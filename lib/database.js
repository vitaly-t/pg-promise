'use strict';

var $npm = {
    result: require('./result'),
    special: require('./special'),
    context: require('./dbContext'),
    events: require('./events'),
    utils: require('./utils')
};

var $p; // promise interface;

/**
 * @constructor Database
 * @description
 * Represents an extensible database protocol. This type is not available directly,
 * it can only be created via the library's base call.
 *
 * @param {String|Object} cn
 * Connection object or string
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
function Database(cn, options) {

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
                return $npm.query.call(this, ctx, query, values, qrm);
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
        return $npm.connect(ctx)
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
     * - prepared statement object
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
     */
    this.query = function (query, values, qrm) {
        var self = this, ctx = createContext();
        return $npm.connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return $npm.query.call(self, ctx, query, values, qrm);
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
        return new $npm.context(cn, options);
    }

    ////////////////////////////////////////////////////
    // Injects additional methods into an access object,
    // extending the protocol's base method 'query'.
    function extend(ctx, obj) {

        /**
         * @method Database.none
         * @summary Executes a query that expects no data to be returned.
         *
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * @summary Executes a query that expects exactly one row of data.
         *
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * @summary Executes a query that expects one or more rows.
         *
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * @summary Executes a query that expects 0 or 1 rows.
         *
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * @summary Executes a query that expects any number of rows.
         *
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * to provide direct access to the $[Result] object.
         *
         * @param {String|Object} query -
         * - query string
         * - prepared statement object
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
         * - resolves with the original $[Result] object
         */
        obj.result = function (query, values) {
            return obj.query.call(this, query, values, $npm.special.cache.resultQuery);
        };

        /**
         * @method Database.stream
         * @summary Custom data streaming, with the help of $[pg-query-stream].
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
         * Executes a query against a database function by its name:
         * `select * from funcName(values)`
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
         * Executes a query against a stored procedure via its name:
         * `select * from procName(values)`, expecting back 0 or 1 rows.
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
         * Executes a callback function (or generator) with an automatically managed connection.
         *
         * @param {Object|Function|generator} p1
         * Tag object for the task, if `p2` is `undefined`, or else it is the callback function
         * for the task.
         *
         * @param {Function|generator} [p2]
         * Task callback function, if it is not `undefined`, or else it is ignored.
         *
         * @returns {external:Promise}
         * Result from the callback function.
         */
        obj.task = function (p1, p2) {
            return taskProcessor.call(this, p1, p2, false);
        };

        /**
         * @method Database.tx
         * @description
         * Executes a callback function (or generator) as a transaction.
         *
         * The transaction will execute `ROLLBACK` in the end, if the callback function
         * returns a rejected promise or throws an error; and it will execute `COMMIT`
         * in all other cases.
         *
         * @param {Object|Function|generator} p1
         * Tag for the transaction, if `p2` is `undefined`, or else it is the callback
         * function for the transaction.
         *
         * @param {Function|generator} [p2]
         * Transaction callback function, if it is not `undefined`, or else it is ignored.
         *
         * @returns {external:Promise}
         * Result from the callback function.
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

            var tsk = new $npm.task(taskCtx, tag, isTX);
            extend(taskCtx, tsk);

            if (taskCtx.db) {
                // reuse existing connection;
                return $npm.task.exec(taskCtx, tsk, isTX);
            }

            // connection required;
            return $npm.connect(taskCtx)
                .then(function (db) {
                    taskCtx.connect(db);
                    return $npm.task.exec(taskCtx, tsk, isTX);
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
        $npm.events.extend(ctx.options, obj);

        // freeze the protocol permanently;
        $npm.utils.lock(obj, true, ctx.options);
    }
}

module.exports = function (p) {
    $p = p;
    $npm.connect = require('./connect')(p);
    $npm.query = require('./query')(p);
    $npm.task = require('./task')(p);
    return Database;
};
