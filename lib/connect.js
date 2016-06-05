'use strict';

var $npm = {
    pg: require('pg'),
    utils: require('./utils'),
    events: require('./events')
};

var $arr = require('../lib/array');

var poolConnections = {};

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
                var fresh;

                // we do not test code specific to Native Bindings;
                // istanbul ignore else
                if (!config.native) {
                    fresh = !(client.secretKey in poolConnections);
                    poolConnections[client.secretKey] = Date.now();
                }

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
                        // we do not test code specific to Native Bindings;
                        // istanbul ignore else
                        if (!config.native) {
                            clearConnections(config);
                        }
                    }
                });
                $npm.events.connect(ctx, client, fresh);
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
                var fresh;

                // we do not test code specific to Native Bindings;
                // istanbul ignore else
                if (!config.native) {
                    fresh = !(client.secretKey in poolConnections);
                    poolConnections[client.secretKey] = Date.now();
                }

                var end = client.end;
                client.end = function () {
                    throw new Error("Cannot invoke client.end() directly.");
                };
                resolve({
                    client: client,
                    done: function () {
                        end.call(client);
                        $npm.events.disconnect(ctx, client);
                        // we do not test code specific to Native Bindings;
                        // istanbul ignore else
                        if (!config.native) {
                            clearConnections(config);
                        }
                    }
                });
                $npm.events.connect(ctx, client, fresh);
            }
        });
    });
}

function clearConnections() {
    var now = Date.now(), delay = $npm.pg.defaults.poolIdleTimeout + 1000;
    $arr.map(Object.keys(poolConnections), function (k) {
        // It is impossible to test expired connections automatically,
        // therefore we are excluding it from the text coverage:
        // istanbul ignore next;
        if (now - poolConnections[k] > delay) {
            delete poolConnections[k];
        }
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
