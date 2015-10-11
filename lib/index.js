'use strict';

/**
 * @enum {number} queryResult
 * @readonly
 * @summary Query Result Mask.
 * @description
 * Binary mask that represents the result expected from queries.
 * It is used in the generic {@link module:pg-promise.Database#query query} method,
 * as well as method {@link module:pg-promise.Database#func func}.
 *
 * The mask is always the last optional parameter, which defaults to `queryResult.any`.
 *
 * Any combination of flags is supported, except for `one + many`.
 * @see {@link module:pg-promise.Database#query query}, {@link module:pg-promise.Database#func func}
 */
var queryResult = {
    /** Single row is expected. */
    one: 1,
    /** One or more rows expected. */
    many: 2,
    /** Expecting no rows. */
    none: 4,
    /** many|none - any result is expected. */
    any: 6
};

///////////////////////////////////////
// Database type (for internal usage);
function Database(cn, options) {

    /**
     * @method connect
     * @memberof module:pg-promise.Database.prototype
     * @summary Retrieves a new or existing connection from the pool, based on the
     * current connection parameters.
     * @description
     * This method initiates a shared connection for executing a chain of queries
     * on the same connection. The connection must be released in the end of the
     * chain by calling method `done()` of the connection object.
     * This is a legacy, low-level approach to chaining queries on the same connection.
     * A newer and simpler approach is via method {@link module:pg-promise.Database#task task},
     * which allocates and releases the shared connection automatically.
     * @returns {promise} Connection result:
     * - resolves with the connection object, if successful. The object has method `done()` that must
     * be called in the end of the query chain, in order to release the connection back to the pool.
     * - rejects with the connection error when fails.
     * @see {@link module:pg-promise.Database#task task}
     */
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

    /**
     * @method query
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a generic query that expects return data according to parameter `qrm`
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @param {queryResult} [qrm=queryResult.any] - {@link queryResult Query Result Mask}
     * @returns {promise} A promise object that represents the query result.
     */
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

function QueryResultError() {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'QueryResultError';
    this.stack = temp.stack;
    this.message = temp.message;
}

QueryResultError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: QueryResultError,
        writable: true,
        configurable: true
    }
});

/**
 * @constructor module:pg-promise.Task
 * @summary Internal Task implementation.
 */
function Task(ctx, tag, isTX) {

    this.ctx = ctx.ctx = {}; // task context object;

    if (tag !== undefined) {
        this.ctx.tag = tag; // task tag;
    }

    if (isTX) {
        this.ctx.isTX = true;
    }

    // generic query method;
    this.query = function (query, values, qrm) {
        if (!ctx.db) {
            throw new Error("Unexpected call outside of " + (isTX ? "transaction." : "task."));
        }
        return $query(ctx, query, values, qrm);
    };

    /**
     * @method batch
     * @memberof module:pg-promise.Task.prototype
     * @summary Resolves a predefined array of mixed values by redirecting to
     * method {@link https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md spex.batch}
     */
    this.batch = function (values, cb) {
        return npm.spex.batch.call(this, values, cb);
    };

    /**
     * @method sequence
     * @memberof module:pg-promise.Task.prototype
     * @summary Resolves a dynamic sequence of mixed values by redirecting to
     * method {@link https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md spex.sequence}
     */
    this.sequence = function (source, dest, limit, track) {
        return npm.spex.sequence.call(this, source, dest, limit, track);
    };

    $extend(ctx, this); // extending task protocol;
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

    /**
     * @method none
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query that expects no data to be returned.
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} Result of the query call:
     * - when no records are returned, the returned promise will resolve with `undefined`;
     * - when the query returns any data, it will reject with `"No return data was expected from the query"`.
     */
    obj.none = function (query, values) {
        return obj.query(query, values, queryResult.none);
    };

    /**
     * @method one
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query that expects exactly one row of data.
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} Result of the query call:
     * - when 1 row is returned, it will resolve with that row as a single object;
     * - when no rows are returned, it will reject with `"No data returned from the query."`;
     * - when more than 1 rows are returned, it will reject with
     *   `"Single row was expected from the query, but multiple returned."`.
     */
    obj.one = function (query, values) {
        return obj.query(query, values, queryResult.one);
    };

    /**
     * @method many
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query that expects one or more rows.
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} Result of the query call:
     * - when 1 or more rows are returned, it will resolve with the array of rows.
     * - when no rows are returned, it will reject with `"No data returned from the query."`;
     */
    obj.many = function (query, values) {
        return obj.query(query, values, queryResult.many);
    };

    /**
     * @method oneOrNone
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query that expects 0 or 1 rows.
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} Result of the query call:
     * - when no rows are returned, it will resolve with `null`;
     * - when 1 row is returned, it will resolve with that row as a single object;
     * - when more than 1 rows are returned, it will reject with
     *   `"Single row was expected from the query, but multiple returned."`.
     */
    obj.oneOrNone = function (query, values) {
        return obj.query(query, values, queryResult.one | queryResult.none);
    };

    /**
     * @method manyOrNone
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query that expects any number of rows.
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} Result of the query call:
     * - when no rows are returned, it will resolve with an empty array;
     * - when 1 or more rows are returned, it will resolve with the array of rows.
     * @see {@link module:pg-promise.Database#any Database.any}
     */
    obj.manyOrNone = function (query, values) {
        return obj.query(query, values, queryResult.many | queryResult.none);
    };

    /**
     * Alias for method {@link module:pg-promise.Database#manyOrNone manyOrNone}
     * @method any
     * @memberof module:pg-promise.Database.prototype
     * @borrows Database.manyOrNone as any
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} The same as method {@link module:pg-promise.Database#manyOrNone manyOrNone}
     * @see {@link module:pg-promise.Database#manyOrNone manyOrNone}
     */
    obj.any = function (query, values) {
        return obj.manyOrNone(query, values);
    };

    /**
     * @method result
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query without any expectation for the return data,
     * to provide direct access to the {@link https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6 Result} object.
     * @param {string|object} query - query string or prepared statement object
     * @param {array|value} [values] - formatting parameters for the query string
     * @returns {promise} Result of the query call:
     * - resolves with the original {@link https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6 Result} object:
     */
    obj.result = function (query, values) {
        return obj.query(query, values, 'result');
    };

    /**
     * @method stream
     * @memberof module:pg-promise.Database.prototype
     * @summary Custom data streaming, with help of {@link https://github.com/brianc/node-pg-query-stream pg-query-stream}
     * @param {QueryStream} qs - stream object of type {@link https://github.com/brianc/node-pg-query-stream/blob/master/index.js#L5 QueryStream}
     * @param {function} init - stream initialization callback
     * @returns {promise} Result of the streaming operation.
     *
     * Once the streaming has finished successfully, the method resolves with
     * `{processed, duration}`:
     * - `processed` - total number of rows that have been processed;
     * - `duration` - streaming duration, in milliseconds.
     *
     * Possible rejections messages:
     * - `Invalid or missing stream object`
     * - `Invalid stream state`
     * - `Invalid or missing stream initialization callback`
     * - `Stream not initialized`
     */
    obj.stream = function (qs, init) {
        return obj.query(qs, init, 'stream');
    };

    /**
     * @method func
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query against a database function by its name:
     * `select * from funcName(values)`
     * @param {string} funcName - name of the function to be executed.
     * @param {array|value} [values] - parameters for the function.
     * @param {queryResult} [qrm=queryResult.any] - {@link queryResult Query Result Mask}.
     * @returns {promise} Result of the query call, according to `qrm`.
     * @see {@link module:pg-promise.Database#query query}
     */
    obj.func = function (funcName, values, qrm) {
        return obj.query({
            funcName: funcName
        }, values, qrm);
    };

    /**
     * @method proc
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes a query against a stored procedure via its name:
     * `select * from procName(values)`
     * @param {string} procName - name of the stored procedure to be executed.
     * @param {array|value} [values] - parameters for the procedure.
     * @returns {promise} The same result as method {@link module:pg-promise.Database#oneOrNone oneOrNone}.
     * @see {@link module:pg-promise.Database#oneOrNone oneOrNone}
     * @see {@link module:pg-promise.Database#func func}
     */
    obj.proc = function (procName, values) {
        return obj.func(procName, values, queryResult.one | queryResult.none);
    };

    /**
     * @method task
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes the callback function with an automatically managed connection.
     * @param {object|function} p1 - task tag object, if `p2` is `undefined`,
     * or else it is the callback function for the task.
     * @param {function} [p2] - task callback function, if it is not `undefined`,
     * or else `p2` isn't used.
     * @returns {promise} Result from the task callback function.
     */
    obj.task = function (p1, p2) {
        return taskProcessor(p1, p2, false);
    };

    /**
     * @method tx
     * @memberof module:pg-promise.Database.prototype
     * @summary Executes the callback function as a transaction.
     * @description The method implements the following steps:
     * - acquires a connection from the pool, if needed;
     * - executes `BEGIN`;
     * - executes the callback function;
     * - if the callback function has resolved:
     *   - executes `COMMIT`;
     *   - releases the connection, if it was acquired;
     *   - resolves with the result from the callback function;
     * - if the callback function has rejected:
     *   - executes `ROLLBACK`;
     *   - releases the connection, if it was acquired;
     *   - rejects with the result from the callback function.
     * @param {object|function} p1 - transaction tag object, if `p2` is `undefined`,
     * or else it is the callback function for the transaction.
     * @param {function} [p2] - transaction callback function, if it is not `undefined`,
     * or else `p2` isn't used.
     * @returns {promise} Result from the transaction callback function.
     */
    obj.tx = function (p1, p2) {
        return taskProcessor(p1, p2, true);
    };

    // Task method;
    // Resolves with result from the callback function;
    function taskProcessor(p1, p2, isTX) {

        var tag, // tag object/value;
            taskCtx = ctx.clone(); // task context object;

        taskCtx.cb = p1; // callback function;

        // allow inserting a tag in front of the callback
        // function, for better code readability;
        if (p2 !== undefined) {
            tag = p1; // overriding any default tag;
            taskCtx.cb = p2;
        }

        if (typeof taskCtx.cb !== 'function') {
            return $p.reject("Callback function must be specified for the " + (isTX ? "transaction." : "task."));
        }

        if (tag === undefined) {
            if (taskCtx.cb.tag !== undefined) {
                // use the default tag associated with the task:
                tag = taskCtx.cb.tag;
            } else {
                if (taskCtx.cb.name) {
                    tag = taskCtx.cb.name;
                }
            }
        }

        var tsk = new Task(taskCtx, tag, isTX);

        if (taskCtx.db) {
            // reuse existing connection;
            return $task(taskCtx, tsk, isTX);
        }

        // connection required;
        return $connect(taskCtx)
            .then(function (db) {
                taskCtx.connect(db);
                return $task(taskCtx, tsk, isTX);
            })
            .then(function (data) {
                taskCtx.disconnect();
                return $p.resolve(data);
            }, function (reason) {
                if (taskCtx.db) {
                    taskCtx.disconnect();
                }
                return $p.reject(reason);
            });
    }

    // lock all default properties to read-only,
    // to prevent override by the client.
    $lock(obj, false, ctx.options);

    // extend the protocol;
    $notify.extend(ctx.options, obj);

    // freeze the protocol permanently;
    $lock(obj, true, ctx.options);
}

//////////////////////////////
// Generic query method;
function $query(ctx, query, values, qrm) {
    if (qrm === 'stream') {
        return $stream(ctx, query, values);
    }
    var errMsg, textErr,
        isFunc = $isObject(query, ['funcName']), // function call;
        isPS = $isObject(query, ['name', 'text']), // prepared statement;
        options = ctx.options,
        pgFormatting = (options && options.pgFormatting) || isPS,
        params = pgFormatting ? values : undefined,
        isResult = qrm === 'result';

    return $p(function (resolve, reject) {

        if (isFunc) {
            query = query.funcName; // query is a function name;
        }
        if (!pgFormatting && !$isText(query)) {
            textErr = isFunc ? "Function name" : "Parameter 'query'";
        }
        if (isPS) {
            if (!$isText(query.name)) {
                textErr = "Property 'name' in prepared statement";
            } else {
                if (!$isText(query.text)) {
                    textErr = "Property 'text' in prepared statement";
                }
            }
        }
        if (textErr) {
            errMsg = textErr + " must be a non-empty text string.";
        }
        if (!errMsg && !isResult) {
            if ($isNull(qrm)) {
                qrm = queryResult.any; // default query result;
            } else {
                var badMask = queryResult.one | queryResult.many; // the combination isn't supported;
                var isInteger = typeof qrm === 'number' && isFinite(qrm) && Math.floor(qrm) === qrm;
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
        if (notifyReject()) {
            return;
        }
        errMsg = $notify.query(options, {
            client: ctx.db.client,
            query: query,
            params: params,
            ctx: ctx.ctx
        });
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
                            if (len > 1 && qrm & queryResult.one) {
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
                                    data = qrm & queryResult.many ? [] : undefined;
                                }
                            } else {
                                errMsg = "No data returned from the query.";
                            }
                        }
                        if (errMsg) {
                            errMsg = new QueryResultError(errMsg);
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
            var client;
            if (ctx.db) {
                client = ctx.db.client;
            } else {
                errMsg = "Loose request outside an expired connection.";
            }
            if (errMsg) {
                $notify.error(options, errMsg, {
                    client: client,
                    query: query,
                    params: params,
                    ctx: ctx.ctx
                });
                reject(errMsg);
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
    if (typeof init !== 'function') {
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
            $notify.error(ctx.options, err, {
                client: ctx.db.client,
                query: qs.text,
                params: qs.values,
                ctx: ctx.ctx
            });
            reject(err);
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
                $notify.error(ctx.options, err, {
                    cn: ctx.cn
                });
                reject(err);
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

///////////////////////////////////////
// Implements a task/transaction logic;
function $task(ctx, obj, isTX) {

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
        if (result && result.then instanceof Function) {
            return result; // result is a valid promise object;
        }
        // task callback must always return a promise object;
        return $p.reject((isTX ? "Transaction" : "Task") + " callback function didn't return a promise object.");
    }

    // updates the task context and notifies the client;
    function update(start, success, result) {
        var c = ctx.ctx;
        if (start) {
            c.start = new Date();
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
        }
        (isTX ? $notify.transact : $notify.task)(ctx.options, {
            client: ctx.db.client,
            ctx: c
        });
    }

    var cbData, cbReason, success;
    update(true);
    if (isTX) {
        // Executing a transaction;
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
                            update(false, true, cbData);
                            return $p.resolve(cbData); // resolve with data from the callback;
                        } else {
                            update(false, false, cbReason);
                            return $p.reject(cbReason); // reject with reason from the callback;
                        }
                    });
            });
    } else {
        // Executing a task;
        return invoke() // callback;
            .then(function (data) {
                update(false, true, data);
                return $p.resolve(data); // resolve with data from the callback;
            }, function (reason) {
                update(false, false, reason);
                return $p.reject(reason); // reject with reason from the callback;
            });
    }
}

/////////////////////////////////
// Client notification helpers;
var $notify = {
    /**
     * @event connect
     * @memberof module:pg-promise
     */
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
    /**
     * @event disconnect
     * @memberof module:pg-promise
     */
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
    /**
     * @event query
     * @memberof module:pg-promise
     */
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
    /**
     * @event task
     * @memberof module:pg-promise
     */
    task: function (options, context) {
        if ($isEvent(options, 'task')) {
            try {
                options.task(context);
            } catch (err) {
                // silencing errors to avoid breaking the task's command chain;
                $notify.unexpected('task', err);
            }
        }
    },
    /**
     * @event transact
     * @memberof module:pg-promise
     */
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
    /**
     * @event error
     * @memberof module:pg-promise
     */
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
    /**
     * @event extend
     * @memberof module:pg-promise
     */
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
    /**
     * @event unexpected
     * @memberof module:pg-promise
     * @private
     */
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
    if (!$isNull(func) && typeof func !== 'function') {
        throw new Error("Type 'function' was expected for property 'options." + event + "'");
    }
    return func ? true : false;
}

////////////////////////////////////////////
// Simpler check for null/undefined;
function $isNull(value) {
    return value === null || value === undefined;
}

////////////////////////////////////////////////////////
// Verifies parameter for being a non-empty text string;
function $isText(txt) {
    return txt && typeof txt === 'string' && /\S/.test(txt);
}

//////////////////////////////////////
// Verifies value for being an object,
// based on type and property names.
function $isObject(value, properties) {
    if (value && typeof value === 'object') {
        for (var i = 0; i < properties.length; i++) {
            if (!(properties[i] in value)) {
                return false;
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

///////////////////////////////////////////////////
// Locks all properties in an object to read-only,
// or freezes the entire object for any changes.
function $lock(obj, freeze, options) {
    if (options && options.noLocking) {
        return;
    }
    if (freeze) {
        Object.freeze(obj); // freeze the entire object, permanently;
    } else {
        var desc = {
            writable: false
        };
        for (var p in obj) {
            Object.defineProperty(obj, p, desc);
        }
    }
}

/////////////////////////////////////////////
// Adds properties from source to the target,
// and locks the target for any override.
function $addProperties(target, source) {
    for (var p in source) {
        target[p] = source[p];
    }
    $lock(target);
}

var npm = {
    pg: require('pg'),
    formatting: require('./formatting')
};

///////////////////////////
// Main library function;

/**
 * Complete access layer to node-postgres via Promises/A+
 * @module pg-promise
 * @author Vitaly Tomilov
 * @param {object} [options]
 * Library initialization options:
 * - `pgFormatting` - redirects query formatting to PG;
 * - `promiseLib` - overrides default promise library;
 * - `connect` - database `connect` notification;
 * - `disconnect` - database `disconnect` notification;
 * - `query` - query execution notification;
 * - `task` - task event notification;
 * - `transact` - transaction event notification;
 * - `error` - error event notification;
 * - `extend` - protocol extension event;
 */
function $main(options) {

    if (!$isNull(options) && typeof options !== 'object') {
        throw new Error("Invalid parameter 'options' specified.");
    }

    var lib = options ? options.promiseLib : null;
    if (lib) {
        // alternative promise library specified;
        var t = typeof lib;
        if (t !== 'function' && t !== 'object') {
            throw new Error('Invalid promise library override.');
        }
        // 'Promise' type is supported by libraries Bluebird, When, Q and RSVP,
        // while libraries 'promise' and 'lie' use their main function instead.
        npm.promise = lib.Promise instanceof Function ? lib.Promise : lib;
    } else {
        npm.promise = npm.promise || Promise; // ES6 Promise is the default;
    }

    // Specialized Promise Extensions;
    npm.spex = require('spex')(npm.promise);

    // promise abbreviations used in the library;
    $p.resolve = npm.promise.resolve;
    $p.reject = npm.promise.reject;

    /**
     * @constructor module:pg-promise.Database
     * @param {string|object} cn
     * Connection object or string.
     */
    var inst = function (cn) {
        if (!cn) {
            // cannot instantiate a database without connection details;
            throw new Error("Connection details must be specified.");
        }
        return new Database(cn, options);
    };

    $addProperties(inst, rootNameSpace);

    return inst;
}

var rootNameSpace = {

    /**
     * Library version.
     * @alias module:pg-promise.version
     * @readonly
     */
    version: new Version(2, 0, 6),

    /**
     * Terminates pg library (call it when exiting the application).
     * @alias module:pg-promise.end
     */
    end: function () {
        npm.pg.end();
    },

    /**
     * Namespace for the type conversion helpers.
     * @alias module:pg-promise.as
     * @member {module:formatting.as} as
     * @readonly
     */
    as: npm.formatting.as,

    /**
     * Instance of the PG library used.
     * @alias module:pg-promise.pg
     */
    pg: npm.pg,

    /**
     * Query Result Mask.
     * @alias module:pg-promise.queryResult
     */
    queryResult: queryResult,

    /**
     * Query Result Error type.
     * @alias module:pg-promise.QueryResultError
     */
    QueryResultError: QueryResultError
};

$lock(rootNameSpace.as, true);
$lock(rootNameSpace.version, true);
$lock(rootNameSpace.queryResult, true);

$addProperties($main, rootNameSpace);

module.exports = $main;
