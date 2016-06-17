'use strict';

var $npm = {
    utils: require('./utils'),
    events: require('./events')
};

function poolConnect(ctx, config) {
    return config.promise(function (resolve, reject) {
        config.pgp.pg.connect(ctx.cn, function (err, client, done) {
            if (err) {
                $npm.events.error(ctx.options, err, {
                    cn: $npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                var isFresh = !client.$used;
                if (isFresh) {
                    $npm.utils.addReadProp(client, '$used', true, true);
                }
                var end = lockClientEnd(client);
                resolve({
                    isFresh: isFresh,
                    client: client,
                    done: function () {
                        client.end = end;
                        done();
                        $npm.events.disconnect(ctx, client);
                    }
                });
                $npm.events.connect(ctx, client, isFresh);
            }
        });
    });
}

function directConnect(ctx, config) {
    return config.promise(function (resolve, reject) {
        var client = new config.pgp.pg.Client(ctx.cn);
        client.connect(function (err) {
            if (err) {
                $npm.events.error(ctx.options, err, {
                    cn: $npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                var end = lockClientEnd(client);
                resolve({
                    isFresh: true,
                    client: client,
                    done: function () {
                        client.end = end;
                        client.end();
                        $npm.events.disconnect(ctx, client);
                    }
                });
                $npm.events.connect(ctx, client, true);
            }
        });
    });
}

function lockClientEnd(client) {
    var end = client.end;
    client.end = function () {
        throw new Error("Cannot invoke client.end() directly.");
    };
    return end;
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
