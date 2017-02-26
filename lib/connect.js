'use strict';

var $npm = {
    con: require('manakin').local,
    utils: require('./utils'),
    events: require('./events')
};

function poolConnect(ctx, config) {
    return config.promise((resolve, reject) => {
        config.pgp.pg.connect(ctx.cn, (err, client, done) => {
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
                setCtx(client, ctx);
                var end = lockClientEnd(client);
                resolve({
                    isFresh: isFresh,
                    client: client,
                    done: () => {
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
    return config.promise((resolve, reject) => {
        var client = new config.pgp.pg.Client(ctx.cn);
        client.connect(err => {
            if (err) {
                $npm.events.error(ctx.options, err, {
                    cn: $npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                setCtx(client, ctx);
                var end = lockClientEnd(client);
                resolve({
                    isFresh: true,
                    client: client,
                    done: () => {
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
    client.end = () => {
        // This call can happen only in the following two cases:
        // 1. the client made the call directly, against the library's documentation (invalid code)
        // 2. connection with the server broke while under heavy communications, and the connection
        //    pool is trying to terminate all clients forcefully.
        $npm.con.error('Abnormal client.end() call, due to invalid code or failed server connection.\n%s\n',
            $npm.utils.getLocalStack(3));
        end.call(client);
    };
    return end;
}

function setCtx(client, ctx) {
    Object.defineProperty(client, '$ctx', {
        value: ctx,
        writable: true
    });
}

module.exports = config => ({
    pool: ctx => poolConnect(ctx, config),
    direct: ctx => directConnect(ctx, config)
});
