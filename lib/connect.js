'use strict';

const npm = {
    con: require('manakin').local,
    utils: require('./utils'),
    events: require('./events')
};

function poolConnect(ctx, db, config) {
    return config.promise((resolve, reject) => {
        const p = db.$pool;
        if (p.pool._draining) {
            db.$destroy();
            const err = new Error('Connection pool of the database object has been destroyed.');
            npm.events.error(ctx.options, err, {
                dc: ctx.dc
            });
            reject(err);
            return;
        }
        p.connect((err, client, done) => {
            if (err) {
                npm.events.error(ctx.options, err, {
                    cn: npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                const isFresh = !client.$used;
                if (isFresh) {
                    npm.utils.addReadProp(client, '$used', true, true);
                }
                setCtx(client, ctx);
                const end = lockClientEnd(client);
                client.on('error', onError);
                resolve({
                    isFresh, client,
                    done: () => {
                        client.end = end;
                        done();
                        npm.events.disconnect(ctx, client);
                        client.removeListener('error', onError);
                    }
                });
                npm.events.connect(ctx, client, isFresh);
            }
        });
    });
}

function directConnect(ctx, config) {
    return config.promise((resolve, reject) => {
        const client = new config.pgp.pg.Client(ctx.cn);
        client.connect(err => {
            if (err) {
                npm.events.error(ctx.options, err, {
                    cn: npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                setCtx(client, ctx);
                const end = lockClientEnd(client);
                client.on('error', onError);
                resolve({
                    isFresh: true,
                    client,
                    done: () => {
                        client.end = end;
                        client.end();
                        npm.events.disconnect(ctx, client);
                        client.removeListener('error', onError);
                    }
                });
                npm.events.connect(ctx, client, true);
            }
        });
    });
}

// this event only happens when the connection is lost physically,
// which cannot be tested automatically; removing from coverage:
// istanbul ignore next
function onError(err) {
    const ctx = this.$ctx;
    const cn = npm.utils.getSafeConnection(ctx.cn);
    npm.events.error(ctx.options, err, {cn, dc: ctx.dc});
    ctx.disconnect();
    if (ctx.cnOptions && typeof ctx.cnOptions.onLost === 'function' && !ctx.notified) {
        try {
            ctx.cnOptions.onLost.call(this, err, {
                cn,
                dc: ctx.dc,
                start: ctx.start,
                client: this
            });
        } catch (e) {
            npm.con.error(e && e.stack || e);
        }
        ctx.notified = true;
    }
}

function lockClientEnd(client) {
    const end = client.end;
    client.end = doNotCall => {
        // This call can happen only in the following two cases:
        // 1. the client made the call directly, against the library's documentation (invalid code)
        // 2. connection with the server broke while under heavy communications, and the connection
        //    pool is trying to terminate all clients forcefully.
        npm.con.error('Abnormal client.end() call, due to invalid code or failed server connection.\n%s\n',
            npm.utils.getLocalStack(3));
        if (!doNotCall) {
            end.call(client);
        }
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
    pool: (ctx, db) => poolConnect(ctx, db, config),
    direct: ctx => directConnect(ctx, config)
});
