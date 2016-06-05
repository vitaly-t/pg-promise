'use strict';

var $npm = {
    pg: require('pg'),
    utils: require('./utils'),
    events: require('./events')
};

var $arr = require('../lib/array');

var liveClientKeys = {};
var liveNativeClients = [];

function getFreshStatus(config, client) {
    // we do not test code specific to Native Bindings;
    // istanbul ignore next
    if (config.native) {
        for (var i = 0; i < liveNativeClients.length; i++) {
            var c = liveNativeClients[i];
            if (c.client === client) {
                c.tick = Date.now();
                return false;
            }
        }
        liveNativeClients.push({
            client: client,
            tick: Date.now()
        });
        return true;
    }
    var isFreshClient = !(client.secretKey in liveClientKeys);
    liveClientKeys[client.secretKey] = Date.now();
    return isFreshClient;
}

function clearFreshStatus(config) {
    var now = Date.now(), delay = $npm.pg.defaults.poolIdleTimeout + 1000;
    // we do not test code specific to Native Bindings;
    // istanbul ignore if
    if (config.native) {
        $arr.removeIf(liveNativeClients, function (c) {
            return now - c.tick > delay;
        });
    } else {
        $arr.map(Object.keys(liveClientKeys), function (key) {
            // It is impossible to test expired connections automatically,
            // therefore we are excluding it from the text coverage:
            // istanbul ignore next;
            if (now - liveClientKeys[key] > delay) {
                delete liveClientKeys[key];
            }
        });
    }
}

function poolConnect(ctx, config) {
    return config.promise(function (resolve, reject) {
        config.pg.connect(ctx.cn, function (err, client, done) {
            if (err) {
                $npm.events.error(ctx.options, err, {
                    cn: $npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                var isFreshClient = getFreshStatus(config, client);
                var end = client.end;
                client.end = function () {
                    throw new Error("Cannot invoke client.end() directly.");
                };
                resolve({
                    client: client,
                    done: function () {
                        client.end = end;
                        done();
                        $npm.events.disconnect(ctx, client);
                        clearFreshStatus(config);
                    }
                });
                $npm.events.connect(ctx, client, isFreshClient);
            }
        });
    });
}

function directConnect(ctx, config) {
    return config.promise(function (resolve, reject) {
        var client = new config.pg.Client(ctx.cn);
        client.connect(function (err) {
            if (err) {
                $npm.events.error(ctx.options, err, {
                    cn: $npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                var isFreshClient = getFreshStatus(config, client);
                var end = client.end;
                client.end = function () {
                    throw new Error("Cannot invoke client.end() directly.");
                };
                resolve({
                    client: client,
                    done: function () {
                        end.call(client);
                        $npm.events.disconnect(ctx, client);
                        clearFreshStatus(config);
                    }
                });
                $npm.events.connect(ctx, client, isFreshClient);
            }
        });
    });
}

module.exports = function (config) {
    return {
        pool: function (ctx) {
            return poolConnect(ctx, config);
        },
        direct: function (ctx) {
            return directConnect(ctx, config);
        }
    };
};
