'use strict';

var $npm = {
    result: require('./result'),
    special: require('./special'),
    context: require('./cnContext'),
    events: require('./events'),
    utils: require('./utils'),
    connect: require('./connect'),
    query: require('./query'),
    task: require('./task')
};

/**
 * @constructor Database
 * @description
 * Represents an extensible database protocol. This type is not available directly,
 * it can only be created via the library's base call.
 *
 * @param {String|Object} cn
 * Connection object or string.
 *
 * @param {} [dc]
 * Database Context.
 *
 * Any object or value to be propagated through the entire protocol, to allow implementations
 * and event handling that depend on the database context.
 *
 * This is mainly to facilitate the use of multiple databases which may need separate protocol
 * extensions, or different implementations within a single task / transaction callback,
 * depending on the database context.
 *
 * @see {@link event:extend extend}
 *
 * @example
 * // Loading and initializing the library:
 * var pgp = require('pg-promise')({
 *     // Initialization Options
 * });
 *
 * var cn = "postgres://username:password@host:port/database";
 *
 * // Creating a new database instance from the connection details:
 * var db = pgp(cn);
 *
 */
function Database(cn, dc, options, config) {

    var $p = config.promise;

    /**
     * @method Database.connect
     * @deprecated
     * Method {@link Database.task task} offers a safer (automatic) way of opening and
     * releasing the connection.
     *
     * @summary Retrieves a new or existing connection from the pool, based on the current
     * connection parameters.
     *
     * @description
     * This method initiates a shared connection for executing a chain of queries on the
     * same connection. The connection must be released in the end of the chain by calling
     * method `done()` on the connection object.
     *
     * This is a legacy, low-level approach to chaining queries on the same connection.
     * A newer and safer approach is via methods {@link Database.task task}, which allocates
     * and releases the shared connection automatically.
     *
     * @returns {external:Promise}
     * Connection result:
     *  - resolves with the connection object, if successful. The object has method `done()` that must
     *    be called in the end of the query chain, in order to release the connection back to the pool.
     *  - rejects with the connection error when fails.
     *
     * @see {@link Database.task}
     */
    this.connect = function () {
        var ctx = createContext();
        var self = {
            // Generic query method;
            query: function (query, values, qrm) {
                if (!ctx.db) {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
                return config.npm.query.call(this, ctx, query, values, qrm);
            },
            // Connection release method;
            done: function () {
                if (!ctx.db) {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
                ctx.disconnect();
            }
        };
        extend(ctx, self); // extending the protocol;
        return config.npm.connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return self;
            });
    };

    /**
     * @method Database.query
     *
     * @description
     * Executes a generic query request that expects return data
     * according to parameter `qrm`.
     *
     * @param {String|Object} query
     * - query string
     * - prepared statement: `{name, text, values}`
     * - {@link PreparedStatement} object
     * - {@link QueryFile} object
     *
     * @param {Array|value} [values]
     * Formatting parameters for the query string:
     * - a single value - for variable `$1`
     * - an array of values - for variables `$1`, `$2`, etc.
     * - an object - for $[Named Parameters]
     *
     * @param {queryResult} [qrm=queryResult.any]
     * {@link queryResult Query Result Mask}
     *
     * @returns {external:Promise}
     * A promise object that represents the query result.
     *
     * When the query result is an array, it is extended with a hidden
     * property `duration` - query duration in milliseconds.
     */
    this.query = function (query, values, qrm) {
        var self = this, ctx = createContext();
        return config.npm.connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return config.npm.query.call(self, ctx, query, values, qrm);
            })
            .then(function (data) {
                ctx.disconnect();
                return data;
            })
            .catch(function (error) {
                ctx.disconnect();
                return $p.reject(error);
            });
    };

    extend(createContext(), this); // extending root protocol;

    function createContext() {
        return new $npm.context(cn, dc, options);
    }

    ////////////////////////////////////////////////////
    // Injects additional methods into an access object,
    // extending the protocol's base method 'query'.
    function extend(ctx, obj) {

        /**
         * @method Database.none
         * @description
         * Executes a query that expects no data to be returned.
         * If the query returns any kind of data, the method rejects.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise} Result of the query call:
         * - when no records are returned, it resolves with `undefined`
         * - when any data is returned, it rejects with {@link QueryResultError}
         * = `No return data was expected.`
         */
        obj.none = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.none);
        };

        /**
         * @method Database.one
         * @description
         * Executes a query that expects exactly one row of data.
         * When 0 or more than 1 rows are returned, the method rejects.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise}
         * Result of the query call:
         * - when 1 row is returned, it resolves with that row as a single object;
         * - when no rows are returned, it rejects with {@link QueryResultError}
         * = `No data returned from the query.`
         * - when multiple rows are returned, it rejects with {@link QueryResultError}
         * = `Multiple rows were not expected.`
         */
        obj.one = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.one);
        };

        /**
         * @method Database.many
         * @description
         * Executes a query that expects one or more rows.
         * When the query returns no data, the method rejects.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise} Result of the query call:
         * - when 1 or more rows are returned, it resolves with the array of rows
         * - when no rows are returned, it rejects with {@link QueryResultError}
         * = `No data returned from the query.`
         */
        obj.many = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.many);
        };

        /**
         * @method Database.oneOrNone
         * @description
         * Executes a query that expects 0 or 1 rows.
         * When the query returns more than 1 row, the method rejects.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise} Result of the query call:
         * - when no rows are returned, it resolves with `null`
         * - when 1 row is returned, it resolves with that row as a single object
         * - when multiple rows are returned, it rejects with {@link QueryResultError}
         * = `Multiple rows were not expected.`
         */
        obj.oneOrNone = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.one | $npm.result.none);
        };

        /**
         * @method Database.manyOrNone
         * @description
         * Executes a query that expects any number of rows.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise} Result of the query call:
         * - when no rows are returned, it resolves with an empty array
         * - when 1 or more rows are returned, it resolves with the array of rows.
         * @see {@link Database.any}
         */
        obj.manyOrNone = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.many | $npm.result.none);
        };

        /**
         * @method Database.any
         * @description
         * Executes a query that expects any number of rows.
         *
         * This is simply a shorter alias for method {@link Database.manyOrNone manyOrNone}.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise} The same as method {@link Database.manyOrNone manyOrNone}
         * @see {@link Database.manyOrNone}
         */
        obj.any = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.any);
        };

        /**
         * @method Database.result
         * @description
         * Executes a query without any expectation for the return data,
         * to resolve with the original $[Result] object when successful.
         *
         * @param {String|Object} query
         * - query string
         * - prepared statement: `{name, text, values}`
         * - {@link PreparedStatement} object
         * - {@link QueryFile} object
         *
         * @param {Array|value} [values]
         * Formatting parameters for the query string:
         * - a single value - for variable `$1`
         * - an array of values - for variables `$1`, `$2`, etc.
         * - an object - for $[Named Parameters]
         *
         * @returns {external:Promise}
         * Result of the query call:
         * - resolves with the original $[Result] object, extended with
         * property `duration` - query duration in milliseconds.
         */
        obj.result = function (query, values) {
            return obj.query.call(this, query, values, $npm.special.cache.resultQuery);
        };

        /**
         * @method Database.stream
         * @description
         * Custom data streaming, with the help of $[pg-query-stream].
         *
         * This method doesn't work when initialization option `pgNative` is set,
         * because $[pg-query-stream] doesn't support $[Native Bindings].
         *
         * And if you call this method while using option `pgNative`, it will throw {@link external:Error Error} =
         * `Streaming doesn't work with native bindings.`
         *
         * @param {QueryStream} qs - stream object of type $[QueryStream].
         * @param {Function} init - stream initialization callback, with
         * the same `this` context as the calling method.
         * @returns {external:Promise} Result of the streaming operation.
         *
         * Once the streaming has finished successfully, the method resolves with
         * `{processed, duration}`:
         * - `processed` - total number of rows processed;
         * - `duration` - streaming duration, in milliseconds.
         *
         * Possible rejections messages:
         * - `Invalid or missing stream object.`
         * - `Invalid stream state.`
         * - `Invalid or missing stream initialization callback.`
         */
        obj.stream = function (qs, init) {
            return obj.query.call(this, qs, init, $npm.special.cache.streamQuery);
        };

        /**
         * @method Database.func
         * @description
         * Executes a query against a database function by its name: `SELECT * FROM funcName(values)`
         *
         * It is the same as calling method {@link Database.query query} in any of the following ways:
         * - `query('SELECT * FROM funcName($1^)', pgp.as.csv(values), qrm)`
         * - `query('SELECT * FROM funcName($1:csv)', [values], qrm)`
         * - `query('SELECT * FROM funcName(${params:csv})', {params:values}, qrm)`
         * - `query('SELECT * FROM funcName(${params^})', {params:pgp.as.csv(values)}, qrm)`
         *
         * @param {String} funcName
         * Name of the function to be executed.
         *
         * @param {Array|value} [values]
         * Parameters for the function - one value or an array of values.
         *
         * @param {queryResult} [qrm=queryResult.any] - {@link queryResult Query Result Mask}.
         *
         * @returns {external:Promise}
         * Result of the query call, according to parameter `qrm`.
         *
         * @see {@link Database.query}
         * @see {@link Database.proc}
         */
        obj.func = function (funcName, values, qrm) {
            return obj.query.call(this, {
                funcName: funcName
            }, values, qrm);
        };

        /**
         * @method Database.proc
         * @description
         * Executes a query against a stored procedure via its name: `select * from procName(values)`,
         * expecting back 0 or 1 rows.
         *
         * The method simply forwards into `func(funcName, values, queryResult.one|queryResult.none)`.
         *
         * @param {String} procName
         * Name of the stored procedure to be executed.
         *
         * @param {Array|value} [values]
         * Parameters for the procedure - one value or an array of values.
         *
         * @returns {external:Promise}
         * The same result as method {@link Database.oneOrNone oneOrNone}.
         *
         * @see {@link Database.oneOrNone}
         * @see {@link Database.func}
         */
        obj.proc = function (procName, values) {
            return obj.func.call(this, procName, values, $npm.result.one | $npm.result.none);
        };

        /**
         * @method Database.task
         * @description
         * Executes a callback function (or $[ES6 generator]) with an automatically managed connection.
         *
         * This method should be used whenever executing more than one query at once, so the allocated connection
         * is reused between all queries, and released only after the task has finished.
         *
         * The callback function is called with one parameter - database protocol (same as `this`), extended with methods
         * {@link Task.batch batch}, {@link Task.page page}, {@link Task.sequence sequence}, plus property {@link Task.ctx ctx} -
         * the task context object. See {@link Task} for more details.
         *
         * @param {} tag/cb
         * When the method takes only one parameter, it must be the callback function (or $[ES6 generator]) for the task.
         * However, when calling the method with 2 parameters, the first one is always the `tag` - traceable context for the
         * task (see $[tags]).
         *
         * @param {Function|generator} [cb]
         * Task callback function (or $[ES6 generator]), if it is not `undefined`, or else the callback is expected to
         * be passed in as the first parameter.
         *
         * @returns {external:Promise}
         * Result from the callback function.
         *
         * @see {@link Task}
         *
         * @example
         *
         * // creating a task with a string for the tag:
         * db.task('my-task-name', t=> {
         *         // t.ctx = task context object
         *         
         *         // task body, usually returning something
         *     })
         *     .then(data=> {
         *         // success
         *         // data = as returned from the task's callback
         *     })
         *     .catch(error=> {
         *         // error
         *     });
         *
         */
        obj.task = function (p1, p2) {
            return taskProcessor.call(this, p1, p2, false);
        };

        /**
         * @method Database.tx
         * @description
         * Executes a callback function (or $[ES6 generator]) as a transaction.
         *
         * The transaction will execute `ROLLBACK` in the end, if the callback function returns a rejected
         * promise or throws an error; and it will execute `COMMIT` in all other cases.
         *
         * The callback function is called with one parameter - database protocol (same as `this`), extended with methods
         * {@link Task.batch batch}, {@link Task.page page}, {@link Task.sequence sequence}, plus property {@link Task.ctx ctx} -
         * the transaction context object. See {@link Task} for more details.
         *
         * @param {} tag/cb
         * When the method takes only one parameter, it must be the callback function (or $[ES6 generator]) for the transaction.
         * However, when calling the method with 2 parameters, the first one is always the `tag` - traceable context for the
         * transaction (see $[tags]).
         *
         * @param {Function|generator} [cb]
         * Transaction callback function (or $[ES6 generator]), if it is not `undefined`, or else the callback is expected to be
         * passed in as the first parameter.
         *
         * @returns {external:Promise}
         * Result from the callback function.
         *
         * @see {@link Task}
         *
         * @example
         *
         * // creating a transaction with a string for the tag:
         * db.tx('my-transaction-name', t=> {
         *         // t.ctx = transaction context object
         *         
         *         // transaction body, usually returning something
         *     })
         *     .then(data=> {
         *         // success
         *         // data = as returned from the transaction's callback
         *     })
         *     .catch(error=> {
         *         // error
         *     });
         *
         */
        obj.tx = function (p1, p2) {
            return taskProcessor.call(this, p1, p2, true);
        };

        // Task method;
        // Resolves with result from the callback function;
        function taskProcessor(p1, p2, isTX) {

            var tag, // tag object/value;
                taskCtx = ctx.clone(); // task context object;

            if (isTX) {
                taskCtx.txLevel = taskCtx.txLevel >= 0 ? (taskCtx.txLevel + 1) : 0;
            }

            if (this !== obj) {
                taskCtx.context = this; // calling context object;
            }

            taskCtx.cb = p1; // callback function;

            // allow inserting a tag in front of the callback
            // function, for better code readability;
            if (p2 !== undefined) {
                tag = p1; // overriding any default tag;
                taskCtx.cb = p2;
            }

            var cb = taskCtx.cb;

            if (typeof cb !== 'function') {
                return $p.reject("Callback function is required for the " + (isTX ? "transaction." : "task."));
            }

            if (tag === undefined) {
                if (cb.tag !== undefined) {
                    // use the default tag associated with the task:
                    tag = cb.tag;
                } else {
                    if (cb.name) {
                        tag = cb.name; // use the function name as tag;
                    }
                }
            }

            var tsk = new config.npm.task(taskCtx, tag, isTX, config);
            extend(taskCtx, tsk);

            if (taskCtx.db) {
                // reuse existing connection;
                return config.npm.task.exec(taskCtx, tsk, isTX, config);
            }

            // connection required;
            return config.npm.connect(taskCtx)
                .then(function (db) {
                    taskCtx.connect(db);
                    return config.npm.task.exec(taskCtx, tsk, isTX, config);
                })
                .then(function (data) {
                    taskCtx.disconnect();
                    return data;
                })
                .catch(function (error) {
                    taskCtx.disconnect();
                    return $p.reject(error);
                });
        }

        // lock all default properties to read-only,
        // to prevent override by the client.
        $npm.utils.lock(obj, false, ctx.options);

        // extend the protocol;
        $npm.events.extend(ctx.options, obj, ctx.dc);

        // freeze the protocol permanently;
        $npm.utils.lock(obj, true, ctx.options);
    }
}

module.exports = function (config) {
    var npm = config.npm;
    npm.connect = npm.connect || $npm.connect(config);
    npm.query = npm.query || $npm.query(config);
    npm.task = npm.task || $npm.task(config);
    return Database;
};
