/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const {Events} = require('./events');

const npm = {
    con: require('manakin').local,
    utils: require('./utils'),
    text: require('./text'),
    formatting: require('./formatting')
};

function poolConnect(ctx, db, config) {
    return config.promise((resolve, reject) => {
        const p = db.$pool;
        if (p.ending) {
            db.$destroy();
            const err = new Error(npm.text.poolDestroyed);
            Events.error(ctx.options, err, {
                dc: ctx.dc
            });
            reject(err);
            return;
        }
        p.connect((err, client) => {
            if (err) {
                Events.error(ctx.options, err, {
                    cn: npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                if ('$useCount' in client) {
                    client.$useCount++;
                } else {
                    Object.defineProperty(client, '$useCount', {
                        value: 0,
                        configurable: false,
                        enumerable: false,
                        writable: true
                    });
                    hidePassword(client); // See: https://github.com/brianc/node-postgres/issues/1568
                    setSchema(client, ctx);
                }
                setCtx(client, ctx);
                const end = lockClientEnd(client);
                client.on('error', onError);
                resolve({
                    client,
                    useCount: client.$useCount,
                    release(kill) {
                        client.end = end;
                        client.release(kill || client.$connectionError);
                        Events.disconnect(ctx, client);
                        client.removeListener('error', onError);
                    }
                });
                Events.connect(ctx, client, client.$useCount);
            }
        });
    });
}

function directConnect(ctx, config) {
    return config.promise((resolve, reject) => {
        const client = new config.pgp.pg.Client(ctx.cn);
        client.connect(err => {
            if (err) {
                Events.error(ctx.options, err, {
                    cn: npm.utils.getSafeConnection(ctx.cn),
                    dc: ctx.dc
                });
                reject(err);
            } else {
                hidePassword(client); // See: https://github.com/brianc/node-postgres/issues/1568
                setSchema(client, ctx);
                setCtx(client, ctx);
                const end = lockClientEnd(client);
                client.on('error', onError);
                resolve({
                    client,
                    useCount: 0,
                    release() {
                        client.end = end;
                        client.end();
                        Events.disconnect(ctx, client);
                        client.removeListener('error', onError);
                    }
                });
                Events.connect(ctx, client, 0);
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
    Events.error(ctx.options, err, {cn, dc: ctx.dc});
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
        // 2. connection with the server broke, and the pool is terminating all clients forcefully.
        npm.con.error(npm.text.clientEnd + '\n%s\n', npm.utils.getLocalStack(3));
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

// See: https://github.com/brianc/node-postgres/issues/1568
function hidePassword(client) {
    hideProperty(client, 'password');
    hideProperty(client.connectionParameters, 'password');
}

function hideProperty(obj, prop) {
    Object.defineProperty(obj, prop, {value: obj[prop], enumerable: false});
}

function setSchema(client, ctx) {
    let s = ctx.options.schema;
    if (!s) {
        return;
    }
    if (typeof s === 'function') {
        s = s.call(ctx.dc, ctx.dc);
    }
    if (Array.isArray(s)) {
        s = s.filter(a => a && typeof a === 'string');
    }
    if (typeof s === 'string' || (Array.isArray(s) && s.length)) {
        client.query(npm.formatting.as.format('SET search_path TO $1:name', [s]), err => {
            // istanbul ignore if;
            if (err) {
                // This is unlikely to ever happen, unless the connection is created faulty,
                // and fails on the very first query, which is impossible to test automatically.
                throw err;
            }
        });
    }
}

module.exports = config => ({
    pool: (ctx, db) => poolConnect(ctx, db, config),
    direct: ctx => directConnect(ctx, config)
});
