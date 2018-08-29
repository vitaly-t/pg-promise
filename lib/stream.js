/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

const npm = {
    events: require('./events'),
    utils: require('./utils'),
    text: require('./text'),
    Transform: require('stream').Transform
};

////////////////////////////////////////////
// Streams query data into any destination,
// with the help of pg-query-stream library.
function $stream(ctx, qs, initCB, config) {

    const $p = config.promise;

    // istanbul ignore next:
    // we do not provide code coverage for the Native Bindings specifics
    if (ctx.options.pgNative) {
        return $p.reject(new Error(npm.text.nativeStreaming));
    }
    if (!qs || !qs.constructor || qs.constructor.name !== 'PgQueryStream') {
        // stream object wasn't passed in correctly;
        return $p.reject(new TypeError(npm.text.invalidStream));
    }
    if (qs._reading || qs._closed) {
        // stream object is in the wrong state;
        return $p.reject(new Error(npm.text.invalidStreamState));
    }
    if (typeof initCB !== 'function') {
        // parameter `initCB` must be passed as the initialization callback;
        return $p.reject(new TypeError(npm.text.invalidStreamCB));
    }

    let error = npm.events.query(ctx.options, getContext());

    if (error) {
        error = getError(error);
        npm.events.error(ctx.options, error, getContext());
        return $p.reject(error);
    }

    const stream = ctx.db.client.query(qs);

    /* Pipe into a Transform stream so we can count number of rows without using a listener
    on the underlying stream. This avoids returning a stream already in the flowing state. */
    const returnStream = new npm.Transform({
        objectMode: true,
        transform: (data, encoding, callback) => {
            callback(null, data);
            onData(data);
        }
    });

    stream.pipe(returnStream);
    stream.on('error', onError);
    stream.on('end', onEnd);

    try {
        initCB.call(this, returnStream);
    } catch (e) {
        release();
        error = getError(e);
        npm.events.error(ctx.options, error, getContext());
        return $p.reject(error);
    }

    const start = Date.now();
    let resolve, reject, nRows = 0, cache = [];

    function onData(data) {
        cache.push(data);
        nRows++;
        if (cache.length >= qs.batchSize) {
            notify();
        }
    }

    function onError(e) {
        returnStream.emit(e);
        release();
        stream.close();
        e = getError(e);
        npm.events.error(ctx.options, e, getContext());
        reject(e);
    }

    function onEnd() {
        release();
        notify();
        resolve({
            processed: nRows, // total number of rows processed;
            duration: Date.now() - start // duration, in milliseconds;
        });
    }

    function release() {
        stream.removeListener('error', onError);
        stream.removeListener('end', onEnd);
    }

    function notify() {
        if (cache.length) {
            const context = getContext();
            error = npm.events.receive(ctx.options, cache, undefined, context);
            cache = [];
            if (error) {
                onError(error);
            }
        }
    }

    function getError(e) {
        return e instanceof npm.utils.InternalError ? e.error : e;
    }

    function getContext() {
        let client;
        if (ctx.db) {
            client = ctx.db.client;
        } else {
            error = new Error(npm.text.looseQuery);
        }
        return {
            client,
            dc: ctx.dc,
            query: qs.cursor.text,
            params: qs.cursor.values,
            ctx: ctx.ctx
        };
    }

    return $p((res, rej) => {
        resolve = res;
        reject = rej;
    });

}

module.exports = $stream;
