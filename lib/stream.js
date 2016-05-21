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
        return $p.reject("Streaming doesn't work with native bindings.");
    }
    if (!$npm.utils.isObject(qs, ['state', '_reading'])) {
        // stream object wasn't passed in correctly;
        return $p.reject("Invalid or missing stream object.");
    }
    if (qs._reading || qs.state !== 'initialized') {
        // stream object is in the wrong state;
        return $p.reject("Invalid stream state.");
    }
    if (typeof initCB !== 'function') {
        // parameter `initCB` must be passed as the initialization callback;
        return $p.reject("Invalid or missing stream initialization callback.");
    }
    var errorMsg = $npm.events.query(ctx.options, getContext());
    if (errorMsg) {
        errorMsg = errorMsg.message;
        $npm.events.error(ctx.options, errorMsg, getContext());
        return $p.reject(errorMsg);
    }
    var stream, fetch, start, nRows = 0;
    try {
        stream = ctx.db.client.query(qs);
        fetch = stream._fetch;
        stream._fetch = function (size, func) {
            fetch.call(stream, size, function (err, rows) {
                if (!err && rows.length) {
                    nRows += rows.length;
                    var context = getContext();
                    if (errorMsg === undefined) {
                        errorMsg = $npm.events.receive(ctx.options, rows, undefined, context);
                    }
                    if (errorMsg !== undefined) {
                        stream.close();
                    }
                }
                return func(err, rows);
            });
        };
        start = Date.now();
        initCB.call(this, stream); // the stream must be initialized during the call;
    } catch (err) {
        errorMsg = err;
    }
    if (errorMsg) {
        // error thrown by initCB();
        stream._fetch = fetch;
        $npm.events.error(ctx.options, errorMsg, getContext());
        return $p.reject(errorMsg);
    }
    return $p(function (resolve, reject) {
        stream.once('end', function () {
            stream._fetch = fetch;
            if (errorMsg) {
                onError(errorMsg);
            } else {
                resolve({
                    processed: nRows, // total number of rows processed;
                    duration: Date.now() - start // duration, in milliseconds;
                });
            }
        });
        stream.once('error', function (err) {
            stream._fetch = fetch;
            onError(err);
        });
        function onError(e) {
            if (e instanceof $npm.utils.InternalError) {
                e = e.message;
            }
            $npm.events.error(ctx.options, e, getContext());
            reject(e);
        }
    });

    function getContext() {
        var client;
        if (ctx.db) {
            client = ctx.db.client;
        } else {
            errorMsg = "Loose request outside an expired connection.";
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
