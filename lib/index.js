// No 'use strict' here, so queryResult can
// be exported into the global namespace.

var npm = {
    pg: require('pg'),
    formatting: require('./formatting')
};

///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one|many.
queryResult = {
    one: 1,  // single row;
    many: 2,  // one or more rows;
    none: 4,  // no rows;
    any: 6   // many|none (default).
};

////////////////////////////
// Database type;
function Database(cn, options) {

    // Resolves a connection object to allow chaining
    // queries under the same (shared) connection;
    this.connect = function () {
        var ctx = createContext();
        var self = {
            // Generic query method;
            query: function (query, values, qrm) {
                if (!ctx.db) {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
                return $query(ctx, query, values, qrm);
            },
            // Connection release method;
            done: function () {
                if (!ctx.db) {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
                ctx.disconnect();
            }
        };
        $extend(ctx, self); // extending the protocol;
        return $connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return $p.resolve(self);
            });
    };

    // Generic query method;
    this.query = function (query, values, qrm) {
        var ctx = createContext();
        return $connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return $query(ctx, query, values, qrm)
                    .then(function (data) {
                        ctx.disconnect();
                        return $p.resolve(data);
                    }, function (reason) {
                        ctx.disconnect();
                        return $p.reject(reason);
                    });
            });
    };

    $extend(createContext(), this); // extending root protocol;

    function createContext() {
        return new Context(cn, options);
    }

}

/////////////////////////////////
// Transaction type;
function Transaction(ctx, tag) {

    var self = this;

    this.ctx = ctx.ctx = {}; // transaction context object;

    if (tag !== undefined) {
        this.ctx.tag = tag; // transaction tag;
    }

    // generic query method;
    this.query = function (query, values, qrm) {
        if (!ctx.db) {
            throw new Error("Unexpected call outside of transaction.");
        }
        return $query(ctx, query, values, qrm);
    };

    // Sequentially resolves dynamic promises returned by a promise factory:
    // - with an array of resolved data, if `empty` = false (default);
    // - with total number of resolved requests, if `empty` = true.
    this.sequence = this.queue = function (factory, empty) {
        if (typeof(factory) !== 'function') {
            return $p.reject("Invalid factory function specified.");
        }
        var idx = 0, result = [];

        function loop() {
            var obj;
            try {
                obj = factory.call(self, idx, self); // get next promise;
            } catch (e) {
                return $p.reject(e);
            }
            if ($isNull(obj)) {
                // no more promises left in the sequence;
                return $p.resolve(empty ? idx : result);
            }
            if (typeof(obj.then) !== 'function') {
                // the result is not a promise;
                return $p.reject("Invalid promise returned by factory for index " + idx);
            }
            return obj
                .then(function (data) {
                    if (!empty) {
                        result.push(data); // accumulate resolved data;
                    }
                    idx++;
                    return loop();
                });
        }

        return loop();
    };

    $extend(ctx, this); // extending transaction protocol;
}

//////////////////////////////////////
// Database Connection Context type;
function Context(cn, options, db) {

    this.cn = cn; // connection details;
    this.options = options; // library options;
    this.db = db; // database session;

    this.connect = function (db) {
        this.db = db;
    };

    this.disconnect = function () {
        this.db.done();
        this.db = null;
    };

    this.clone = function () {
        return new Context(this.cn, this.options, this.db);
    };
}

////////////////////////////
// Library's Version type;
function Version(major, minor, patch) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
}

// Version-to-string conversion;
Version.prototype.toString = function () {
    return this.major + '.' + this.minor + '.' + this.patch;
};

////////////////////////////////////////////////
// Global/Reusable functions, all start with $
////////////////////////////////////////////////

////////////////////////////////////////////////////
// Injects additional methods into an access object,
// extending the protocol's base method 'query'.
function $extend(ctx, obj) {

    // Expects no data to be returned:
    // - resolves with `undefined` when no records returned;
    // - rejects when one or more records returned.
    obj.none = function (query, values) {
        return obj.query(query, values, queryResult.none);
    };

    // Expects exactly one row:
    // - resolves with the object representing the row;
    // - rejects when 0 or more than 1 records returned.
    obj.one = function (query, values) {
        return obj.query(query, values, queryResult.one);
    };

    // Expects one or more rows:
    // - resolves with the array of rows;
    // - rejects when no rows returned.
    obj.many = function (query, values) {
        return obj.query(query, values, queryResult.many);
    };

    // Expects 0 or 1 rows:
    // - resolves with `null` when no rows returned;
    // - resolves with the object representing the row
    //   when 1 row returned;
    // - rejects when more than 1 row returned.
    obj.oneOrNone = function (query, values) {
        return obj.query(query, values, queryResult.one | queryResult.none);
    };

    // Expects any number of rows:
    // - resolves with the array of rows returned;
    // - resolves with an empty array when no rows returned.
    obj.manyOrNone = function (query, values) {
        return obj.query(query, values, queryResult.any);
    };

    // Alias for method `manyOrNone`;
    obj.any = function (query, values) {
        return obj.manyOrNone(query, values);
    };

    // Resolves with the original `Result` object:
    // https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6
    obj.result = function (query, values) {
        return obj.query(query, values, 'result');
    };

    // Aliases for method `result`;
    obj.queryRaw = obj.raw = function (query, values) {
        return obj.result(query, values);
    };

    // Has no expectation for the return data;
    // Resolves when the streaming has finished,
    // with data = {processed, duration}
    // Parameters:
    // qs - object of type `pg-query-stream`;
    // init - stream initialization callback.
    obj.stream = function (qs, init) {
        return obj.query(qs, init, 'stream');
    };

    // Expects data according to qrm (Query Result Mask);
    obj.func = function (funcName, values, qrm) {
        return obj.query({
            funcName: funcName
        }, values, qrm);
    };

    // Expects the same data as method oneOrNone.
    obj.proc = function (procName, values) {
        return obj.func(procName, values, queryResult.one | queryResult.none);
    };

    // Transaction method;
    // Resolves with result from the callback function;
    obj.transact = obj.tx = function (p1, p2) {

        var tag, // tag object/value;
            txCtx = ctx.clone(); // transaction context object;

        txCtx.cb = p1; // callback function;

        // allow inserting a transaction tag in front of the
        // callback function, for better code readability;
        if (p2 !== undefined) {
            tag = p1;
            txCtx.cb = p2;
        }

        if (typeof(txCtx.cb) !== 'function') {
            return $p.reject("Callback function must be specified for the transaction.");
        }

        var tx = new Transaction(txCtx, tag);

        if (txCtx.db) {
            // reuse existing connection;
            return $transact(txCtx, tx);
        }

        // connection required;
        return $connect(txCtx)
            .then(function (db) {
                txCtx.connect(db);
                return $transact(txCtx, tx);
            })
            .then(function (data) {
                txCtx.disconnect();
                return $p.resolve(data);
            }, function (reason) {
                if (txCtx.db) {
                    txCtx.disconnect();
                }
                return $p.reject(reason);
            });
    };

    // protocol extensibility support;
    $notify.extend(ctx.options, obj);
}

//////////////////////////////
// Generic query method;
function $query(ctx, query, values, qrm) {
    if (qrm === 'stream') {
        return $stream(ctx, query, values);
    }
    var errMsg,
        options = ctx.options,
        pgFormatting = (options && options.pgFormatting),
        params = pgFormatting ? values : undefined,
        isResult = qrm === 'result',
        isFunc = $isObject(query, ['funcName']);

    return $p(function (resolve, reject) {

        if (isFunc) {
            query = query.funcName; // query is a function name;
        }
        if (!pgFormatting && (typeof(query) !== 'string' || !/\S/.test(query))) {
            errMsg = (isFunc ? "Function name" : "Parameter 'query'") + " must be a non-empty text string.";
        }
        if (!errMsg && !isResult) {
            if ($isNull(qrm)) {
                qrm = queryResult.any; // default query result;
            } else {
                var badMask = queryResult.one | queryResult.many; // the combination isn't supported;
                var isInteger = typeof(qrm) === 'number' && isFinite(qrm) && Math.floor(qrm) === qrm;
                if (!isInteger || (qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
                    errMsg = "Invalid Query Result Mask specified.";
                }
            }
        }
        if (!errMsg && (!pgFormatting || isFunc)) {
            try {
                // use 'pg-promise' implementation of values formatting;
                if (isFunc) {
                    query = npm.formatting.formatFunction(query, values);
                } else {
                    query = npm.formatting.formatQuery(query, values);
                }
            } catch (err) {
                if (isFunc) {
                    query = "select * from " + query + "(...)";
                }
                errMsg = err;
                params = values;
            }
        }
        if (!errMsg) {
            errMsg = $notify.query(options, {
                client: ctx.db.client,
                query: query,
                params: params,
                ctx: ctx.ctx
            });
        }
        if (notifyReject()) {
            return;
        }
        try {
            ctx.db.client.query(query, params, function (err, result) {
                var data;
                if (err) {
                    errMsg = err;
                } else {
                    if (isResult) {
                        data = result; // raw object requested (Result type);
                    } else {
                        data = result.rows;
                        var len = data.length;
                        if (len) {
                            if (len > 1 && (qrm & queryResult.one)) {
                                // one row was expected, but returned multiple;
                                errMsg = "Single row was expected from the query, but multiple returned.";
                            } else {
                                if (!(qrm & (queryResult.one | queryResult.many))) {
                                    // no data should have been returned;
                                    errMsg = "No return data was expected from the query.";
                                } else {
                                    if (!(qrm & queryResult.many)) {
                                        data = data[0];
                                    }
                                }
                            }
                        } else {
                            // no data returned;
                            if (qrm & queryResult.none) {
                                if (qrm & queryResult.one) {
                                    data = null;
                                } else {
                                    data = (qrm & queryResult.many) ? [] : undefined;
                                }
                            } else {
                                errMsg = "No data returned from the query.";
                            }
                        }
                    }
                }
                if (!notifyReject()) {
                    resolve(data);
                }
            });
        } catch (err) {
            // can only happen when pgFormatting = true;
            errMsg = err;
        }
        notifyReject();

        function notifyReject() {
            if (errMsg) {
                reject(errMsg);
                $notify.error(options, errMsg, {
                    client: ctx.db.client,
                    query: query,
                    params: params,
                    ctx: ctx.ctx
                });
                return true;
            }
        }
    });
}

////////////////////////////////////////////
// Streams query data into any destination,
// with help from pg-query-stream library.
function $stream(ctx, qs, init) {
    if (!$isObject(qs, ['state', '_reading'])) {
        // stream object wasn't passed in correctly;
        return $p.reject("Invalid or missing stream object.");
    }
    if (qs._reading || qs.state !== 'initialized') {
        // stream object is in the wrong state;
        return $p.reject("Invalid stream state.");
    }
    if (typeof(init) !== 'function') {
        // parameter `init` must be passed as the initialization callback;
        return $p.reject("Invalid or missing stream initialization callback.");
    }
    var error = $notify.query(ctx.options, {
        client: ctx.db.client,
        query: qs.text,
        params: qs.values,
        ctx: ctx.ctx
    });
    if (error) {
        $notify.error(ctx.options, error, {
            client: ctx.db.client,
            query: qs.text,
            params: qs.values,
            ctx: ctx.ctx
        });
        return $p.reject(error);
    }
    var stream, fetch, start, nRows = 0;
    try {
        stream = ctx.db.client.query(qs);
        fetch = stream._fetch;
        stream._fetch = function (size, func) {
            fetch.call(stream, size, function (err, rows) {
                nRows += err ? 0 : rows.length;
                return func(err, rows);
            });
        };
        start = Date.now();
        init(stream); // the stream must be initialized during the call;
    } catch (err) {
        error = err;
    }
    if (!error && !qs._reading) {
        // the stream wasn't initialized by the callback function;
        error = "Stream not initialized.";
    }
    if (error) {
        stream._fetch = fetch;
        $notify.error(ctx.options, error, {
            client: ctx.db.client,
            query: qs.text,
            params: qs.values,
            ctx: ctx.ctx
        });
        return $p.reject(error);
    }
    return $p(function (resolve, reject) {
        stream.once('end', function () {
            stream._fetch = fetch;
            resolve({
                processed: nRows, // total number of rows processed;
                duration: Date.now() - start // duration, in milliseconds;
            });
        });
        stream.once('error', function (err) {
            stream._fetch = fetch;
            reject(err);
            $notify.error(ctx.options, err, {
                client: ctx.db.client,
                query: qs.text,
                params: qs.values,
                ctx: ctx.ctx
            });
        });
    });
}

///////////////////////////////////////////////
// Acquires and resolves with a new connection
// object from the connection pool;
function $connect(ctx) {
    return $p(function (resolve, reject) {
        npm.pg.connect(ctx.cn, function (err, client, done) {
            if (err) {
                reject(err);
                $notify.error(ctx.options, err, {
                    cn: ctx.cn
                });
            } else {
                resolve({
                    client: client,
                    done: function () {
                        done();
                        $notify.disconnect(ctx.options, client);
                    }
                });
                $notify.connect(ctx.options, client);
            }
        });
    });
}

/////////////////////////////////
// Implements transaction logic;
function $transact(ctx, obj) {

    // callback invocation helper;
    function invoke() {
        var result;
        try {
            result = ctx.cb.call(obj, obj); // invoking the callback function;
        } catch (err) {
            $notify.error(ctx.options, err, {
                client: ctx.db.client,
                ctx: ctx.ctx
            });
            return $p.reject(err); // reject with the error;
        }
        if (result && typeof(result.then) === 'function') {
            return result; // result is a valid promise object;
        }
        // transaction callback must always return a promise object;
        return $p.reject("Transaction callback function didn't return a promise object.");
    }

    // updates the transaction context and notifies the client;
    function txUpdate(start, success, result) {
        var c = ctx.ctx;
        if (start) {
            c.start = new Date();
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
        }
        $notify.transact(ctx.options, {
            client: ctx.db.client,
            ctx: c
        });
    }

    var cbData, cbReason, success;
    txUpdate(true);
    return obj.none('begin') // BEGIN;
        .then(function () {
            return invoke() // callback;
                .then(function (data) {
                    cbData = data; // save callback data;
                    success = true;
                    return obj.none('commit'); // COMMIT;
                }, function (reason) {
                    cbReason = reason; // save callback failure reason;
                    return obj.none('rollback'); // ROLLBACK;
                })
                .then(function () {
                    if (success) {
                        txUpdate(false, true, cbData);
                        return $p.resolve(cbData); // resolve with data from the callback;
                    } else {
                        txUpdate(false, false, cbReason);
                        return $p.reject(cbReason); // reject with reason from the callback;
                    }
                });
        });
}

/////////////////////////////////
// Client notification helpers;
var $notify = {
    connect: function (options, client) {
        if ($isEvent(options, 'connect')) {
            try {
                options.connect(client);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while connecting to the database,
                // as it will break the connection logic;
                $notify.unexpected('connect', err);
            }
        }
    },
    disconnect: function (options, client) {
        if ($isEvent(options, 'disconnect')) {
            try {
                options.disconnect(client);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while disconnecting from the database,
                // as it will break the disconnection logic;
                $notify.unexpected('disconnect', err);
            }
        }
    },
    query: function (options, context) {
        if ($isEvent(options, 'query')) {
            try {
                options.query(context);
            } catch (err) {
                // throwing an exception is ok during event 'query',
                // it will result in a proper reject for the query.
                return err;
            }
        }
    },
    transact: function (options, context) {
        if ($isEvent(options, 'transact')) {
            try {
                options.transact(context);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while handling a transaction
                // event, as it will break the transaction's command chain;
                $notify.unexpected('transact', err);
            }
        }
    },
    error: function (options, err, context) {
        if ($isEvent(options, 'error')) {
            try {
                options.error(err, context);
            } catch (err) {
                // have to silence errors here;
                // throwing unhandled errors while handling an error
                // notification is simply not acceptable.
                $notify.unexpected('error', err);
            }
        }
    },
    extend: function (options, obj) {
        if ($isEvent(options, 'extend')) {
            try {
                options.extend.call(obj, obj);
            } catch (err) {
                // have to silence errors here;
                // the result of throwing unhandled errors while
                // extending the protocol would be unpredictable.
                $notify.unexpected('extend', err);
            }
        }
    },
    unexpected: function (event, err) {
        // If you should ever get here, your app is definitely broken, and you need to fix
        // your event handler to prevent unhandled errors during event notifications.
        //
        // Console output is suppressed when running tests, to avoid polluting test output
        // with error messages that are intentional and of no value to the test.

        /* istanbul ignore if */
        if (!$main.suppressErrors) {
            console.log("Unexpected error in '" + event + "' event handler.");
            if (!$isNull(err)) {
                console.log(err.stack || err.message || err);
            }
        }
    }
};

////////////////////////////////////////////
// Verifies event-function in the options;
function $isEvent(options, event) {
    var func = options ? options[event] : null;
    if (!$isNull(func) && typeof(func) !== 'function') {
        throw new Error("Type 'function' was expected for property 'options." + event + "'");
    }
    return func ? true : false;
}

////////////////////////////////////////////
// Simpler check for null/undefined;
function $isNull(value) {
    return value === null || value === undefined;
}

//////////////////////////////////////
// Verifies value for being an object,
// based on type and property names.
function $isObject(value, properties) {
    if (value && typeof(value) === 'object') {
        if (Array.isArray(properties)) {
            for (var i = 0; i < properties.length; i++) {
                if (!(properties[i] in value)) {
                    return false;
                }
            }
        }
        return true;
    }
    return false;
}

////////////////////////////////////////////
// Simpler promise instantiation;
function $p(func) {
    return new npm.promise(func);
}

///////////////////////////
// Main library function;
function $main(options) {

    if (!$isNull(options) && typeof(options) !== 'object') {
        throw new Error("Invalid parameter 'options' specified.");
    }

    var lib = options ? options.promiseLib : null;
    if (lib) {
        // alternative promise library specified;
        var t = typeof(lib);
        if (t !== 'function' && t !== 'object') {
            throw new Error('Invalid promise library override.');
        }
        // 'Promise' type is supported by libraries Bluebird, When, Q and RSVP,
        // while libraries 'promise' and 'lie' use their main function instead.
        npm.promise = (typeof(lib.Promise) === 'function') ? lib.Promise : lib;
    } else {
        npm.promise = npm.promise || require('promise'); // 'promise' is the default library;
    }

    // promise abbreviations used in the library;
    $p.resolve = npm.promise.resolve;
    $p.reject = npm.promise.reject;

    var inst = function (cn) {
        if (!cn) {
            // cannot instantiate a database without connection details;
            throw new Error("Connection details must be specified.");
        }
        return new Database(cn, options);
    };

    // namespace for the type conversion helpers;
    inst.as = npm.formatting.as;

    // instance of the PG library used;
    inst.pg = npm.pg;

    // terminates pg library (call it when exiting the application);
    inst.end = function () {
        npm.pg.end();
    };

    // library version;
    inst.version = new Version(1, 8, 2);

    return inst;
}

module.exports = $main;