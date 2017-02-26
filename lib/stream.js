'use strict';

var $npm = {
    events: require('./events'),
    utils: require('./utils')
};

////////////////////////////////////////////
// Streams query data into any destination,
// with the help of pg-query-stream library.
function $stream(ctx, qs, initCB, config) {

    var $p = config.promise;

    // istanbul ignore next:
    // we do not provide code coverage for the Native Bindings specifics
    if (ctx.options.pgNative) {
        return $p.reject(new Error('Streaming doesn\'t work with Native Bindings.'));
    }
    if (!$npm.utils.isObject(qs, ['state', '_reading'])) {
        // stream object wasn't passed in correctly;
        return $p.reject(new TypeError('Invalid or missing stream object.'));
    }
    if (qs._reading || qs.state !== 'initialized') {
        // stream object is in the wrong state;
        return $p.reject(new Error('Invalid stream state.'));
    }
    if (typeof initCB !== 'function') {
        // parameter `initCB` must be passed as the initialization callback;
        return $p.reject(new TypeError('Invalid or missing stream initialization callback.'));
    }
    var error = $npm.events.query(ctx.options, getContext());
    if (error) {
        error = getError(error);
        $npm.events.error(ctx.options, error, getContext());
        return $p.reject(error);
    }
    var stream, fetch, start, nRows = 0;
    try {
        stream = ctx.db.client.query(qs);
        fetch = stream._fetch;
        stream._fetch = (size, func) => {
            fetch.call(stream, size, (err, rows) => {
                if (!err && rows.length) {
                    nRows += rows.length;
                    var context = getContext();
                    if (!error) {
                        error = $npm.events.receive(ctx.options, rows, undefined, context);
                    }
                    if (error) {
                        stream.close();
                    }
                }
                return func(err, rows);
            });
        };
        start = Date.now();
        initCB.call(this, stream); // the stream must be initialized during the call;
    } catch (err) {
        error = err;
    }
    if (error) {
        // error thrown by initCB();
        stream._fetch = fetch;
        error = getError(error);
        $npm.events.error(ctx.options, error, getContext());
        return $p.reject(error);
    }
    return $p((resolve, reject) => {
        stream.once('end', () => {
            stream._fetch = fetch;
            if (error) {
                onError(error);
            } else {
                resolve({
                    processed: nRows, // total number of rows processed;
                    duration: Date.now() - start // duration, in milliseconds;
                });
            }
        });
        stream.once('error', err => {
            stream._fetch = fetch;
            onError(err);
        });
        function onError(e) {
            e = getError(e);
            $npm.events.error(ctx.options, e, getContext());
            reject(e);
        }
    });

    function getError(e) {
        return e instanceof $npm.utils.InternalError ? e.error : e;
    }

    function getContext() {
        var client;
        if (ctx.db) {
            client = ctx.db.client;
        } else {
            error = new Error('Loose request outside an expired connection.');
        }
        return {
            client: client,
            dc: ctx.dc,
            query: qs.text,
            params: qs.values,
            ctx: ctx.ctx
        };
    }

}

module.exports = $stream;
