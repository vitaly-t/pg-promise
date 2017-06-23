'use strict';

const $npm = {
    con: require('manakin').local,
    result: require('./result'),
    special: require('./special'),
    Context: require('./cnContext'),
    events: require('./events'),
    utils: require('./utils'),
    connect: require('./connect'),
    query: require('./query'),
    task: require('./task')
};

/**
 * @class Database
 * @description
 *
 * Represents the database protocol, extensible via event {@link event:extend extend}.
 * This type is not available directly, it can only be created via the library's base call.
 *
 * **IMPORTANT:**
 *
 * For any given connection, you should only create a single {@link Database} object in a separate module,
 * to be shared in your application (see the code example below). If instead you keep creating the {@link Database}
 * object dynamically, your application will suffer from loss in performance, and will be getting a warning in a
 * development environment (when `NODE_ENV` = `development`):
 *
 * `WARNING: Creating a duplicate database object for the same connection.`
 *
 * If you ever see this warning, rectify your {@link Database} object initialization, so there is only one object
 * per connection details. See the example provided below.
 *
 * See also: property `noWarnings` in {@link module:pg-promise Initialization Options}.
 *
 * @param {string|object} cn
 * Database connection details, which can be:
 *
 * - a configuration object
 * - a connection string
 *
 * For details see {@link https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax Connection Syntax}.
 *
 * The value can be accessed from the database object via property {@link Database.$cn $cn}.
 *
 * @param {} [dc]
 * Database Context.
 *
 * Any object or value to be propagated through the protocol, to allow implementations and event handling
 * that depend on the database context.
 *
 * This is mainly to facilitate the use of multiple databases which may need separate protocol
 * extensions, or different implementations within a single task / transaction callback,
 * depending on the database context.
 *
 * The value can be accessed from the database object via property {@link Database.$dc $dc}.
 *
 * @returns {Database}
 *
 * @see
 *
 * {@link Database.query query},
 * {@link Database.none none},
 * {@link Database.one one},
 * {@link Database.oneOrNone oneOrNone},
 * {@link Database.many many},
 * {@link Database.manyOrNone manyOrNone},
 * {@link Database.any any},
 * {@link Database.func func},
 * {@link Database.proc proc},
 * {@link Database.result result},
 * {@link Database.map map},
 * {@link Database.each each},
 * {@link Database.stream stream},
 * {@link Database.task task},
 * {@link Database.tx tx},
 * {@link Database.connect connect},
 * {@link Database.$config $config},
 * {@link Database.$cn $cn},
 * {@link Database.$dc $dc},
 * {@link event:extend extend}
 *
 * @example
 * // Proper way to initialize and share the Database object
 *
 * // Loading and initializing the library:
 * const pgp = require('pg-promise')({
 *     // Initialization Options
 * });
 *
 * // Preparing the connection details:
 * const cn = "postgres://username:password@host:port/database";
 *
 * // Creating a new database instance from the connection details:
 * const db = pgp(cn);
 *
 * // Exporting the database object for shared use:
 * module.exports = db;
 */
function Database(cn, dc, config) {

    checkForDuplicates(cn, config);
    setErrorHandler(config);

    const $p = config.promise;

    /**
     * @method Database.connect
     *
     * @description
     * Acquires a new or existing connection, depending on the current state of the connection pool, and parameter `direct`.
     *
     * This method creates a shared connection for executing a chain of queries against it. The connection must be released
     * in the end of the chain by calling method `done()` on the connection object.
     *
     * This is an obsolete, low-level approach to chaining queries on the same connection. A newer and safer approach is via
     * methods {@link Database.task task} and {@link Database.tx tx} (for transactions), which allocate and release a shared
     * connection automatically.
     *
     * **NOTE:** Even though this method exposes a {@link external:Client Client} object via property `client`,
     * you cannot call `client.end()` directly, or it will print an error into the console:
     * `Abnormal client.end() call, due to invalid code or failed server connection.`
     * You should only call method `done()` to release the connection.
     *
     * @param {object} [options]
     * @param {boolean} [options.direct=false]
     * Creates a new connection directly, through the {@link external:Client Client}, bypassing the connection pool.
     *
     * By default, all connections are acquired from the connection pool. If you set this option however, the library will instead
     * create a new {@link external:Client Client} object directly (separately from the pool), and then call its `connect` method.
     *
     * **WARNING:**
     *
     * Do not use this option for regular query execution, because it exclusively occupies one physical connection,
     * and therefore cannot scale. This option is only suitable for global connection usage, such as event listeners.
     *
     * @returns {external:Promise}
     * A promise object that represents the connection result:
     *  - resolves with the complete {@link Database} protocol, extended with:
     *    - property `client` of type {@link external:Client Client} that represents the open connection
     *    - method `done()` that must be called in the end, in order to release the connection
     *  - rejects with a connection-related error when it fails to connect.
     *
     * @see
     * {@link Database.task},
     * {@link Database.tx}
     *
     * @example
     *
     * let sco; // shared connection object;
     *
     * db.connect()
     *     .then(obj => {
     *         // obj.client = new connected Client object;
     *
     *         sco = obj; // save the connection object;
     *
     *         // execute all the queries you need:
     *         return sco.any('SELECT * FROM Users');
     *     })
     *     .then(data => {
     *         // success
     *     })
     *     .catch(error => {
     *         // error
     *     })
     *     .finally(() => {
     *         // release the connection, if it was successful:
     *         if (sco) {
     *             sco.done();
     *         }
     *     });
     *
     */
    this.connect = function (options) {
        const ctx = createContext();
        const self = {
            // Generic query method;
            query: function (query, values, qrm) {
                if (!ctx.db) {
                    throw new Error('Cannot execute a query on a disconnected client.');
                }
                return config.$npm.query.call(this, ctx, query, values, qrm);
            },
            // Connection release method;
            done: () => {
                if (!ctx.db) {
                    throw new Error('Cannot invoke done() on a disconnected client.');
                }
                ctx.disconnect();
            }
        };
        const method = (options && options.direct) ? 'direct' : 'pool';
        return config.$npm.connect[method](ctx)
            .then(db => {
                ctx.connect(db);
                self.client = db.client;
                extend(ctx, self);
                return self;
            });
    };

    /**
     * @method Database.query
     *
     * @description
     * Executes a generic query request that expects the return data according to parameter `qrm`.
     *
     * @param {string|object} query
     * Query to be executed, which can any of the following types:
     * - A non-empty query string
     * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
     * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
     * - {@link QueryFile} object
     *
     * @param {array|value} [values]
     * Query formatting parameters.
     *
     * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
     * - a single value - to replace all `$1` occurrences
     * - an array of values - to replace all `$1`, `$2`, ... variables
     * - an object - to apply $[Named Parameters] formatting
     *
     * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
     * and `values` is not `null` or `undefined`, it is automatically set within such object,
     * as an override for its internal `values`.
     *
     * @param {queryResult} [qrm=queryResult.any]
     * {@link queryResult Query Result Mask}
     *
     * @returns {external:Promise}
     * A promise object that represents the query result.
     *
     * When the query result is an array, it is extended with hidden property `duration` -
     * number of milliseconds it took the client to execute the query.
     */
    this.query = function (query, values, qrm) {
        const self = this, ctx = createContext();
        return config.$npm.connect.pool(ctx)
            .then(db => {
                ctx.connect(db);
                return config.$npm.query.call(self, ctx, query, values, qrm);
            })
            .then(data => {
                ctx.disconnect();
                return data;
            })
            .catch(error => {
                ctx.disconnect();
                return $p.reject(error);
            });
    };

    /**
     * @member {object} Database.$config
     * @readonly
     * @description
     * This is a hidden property, to help integrating type {@link Database} directly with third-party libraries.
     *
     * Properties available in the object:
     * - `pgp` - instance of the entire library after initialization
     * - `options` - the library's {@link module:pg-promise Initialization Options} object
     * - `promiseLib` - instance of the promise library that's used
     * - `promise` - generic promise interface that uses `promiseLib` via 4 basic methods:
     *   - `promise((resolve, reject)=>{})` - to create a new promise
     *   - `promise.resolve(value)` - to resolve with a value
     *   - `promise.reject(value)` - to reject with a value
     *   - `promise.all(data)` - to resolve an array of promises
     * - `version` - this library's version
     * - `$npm` _(hidden property)_ - internal module cache
     *
     * @example
     *
     * // Using the promise protocol as configured by pg-promise:
     *
     * const $p = db.$config.promise;
     *
     * const resolvedPromise = $p.resolve('some data');
     * const rejectedPromise = $p.reject('some reason');
     *
     * const newPromise = $p((resolve, reject) => {
     *     // call either resolve(data) or reject(reason) here
     * });
     */
    $npm.utils.addReadProp(this, '$config', config, true);

    /**
     * @member {string|object} Database.$cn
     * @readonly
     * @description
     * **Added in v5.6.8**
     *
     * Database connection, as was passed in during the object's construction.
     *
     * This is a hidden property, to help integrating type {@link Database} directly with third-party libraries.
     *
     * @see Database
     */
    $npm.utils.addReadProp(this, '$cn', cn, true);

    /**
     * @member {} Database.$dc
     * @readonly
     * @description
     * **Added in v5.6.8**
     *
     * Database Context, as was passed in during the object's construction.
     *
     * This is a hidden property, to help integrating type {@link Database} directly with third-party libraries.
     *
     * @see Database
     */
    $npm.utils.addReadProp(this, '$dc', dc, true);

    extend(createContext(), this); // extending root protocol;

    function createContext() {
        return new $npm.Context(cn, dc, config.options);
    }

    function transform(value, cb, thisArg) {
        if (typeof cb === 'function') {
            value = value.then(data => {
                return cb.call(thisArg, data);
            });
        }
        return value;
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
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @returns {external:Promise<null>}
         * A promise object that represents the query result:
         * - When no records are returned, it resolves with `null`.
         * - When any data is returned, it rejects with {@link errors.QueryResultError QueryResultError}:
         *   - `.message` = `No return data was expected.`
         *   - `.code` = {@link errors.queryResultErrorCode.notEmpty queryResultErrorCode.notEmpty}
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
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @param {function} [cb]
         * Value transformation callback, to allow in-line value change.
         * When specified, the return value replaces the original resolved value.
         *
         * The function takes only one parameter - value resolved from the query.
         *
         * @param {} [thisArg]
         * Value to use as `this` when executing the transformation callback.
         *
         * @returns {external:Promise}
         * A promise object that represents the query result:
         * - When 1 row is returned, it resolves with that row as a single object.
         * - When no rows are returned, it rejects with {@link errors.QueryResultError QueryResultError}:
         *   - `.message` = `No data returned from the query.`
         *   - `.code` = {@link errors.queryResultErrorCode.noData queryResultErrorCode.noData}
         * - When multiple rows are returned, it rejects with {@link errors.QueryResultError QueryResultError}:
         *   - `.message` = `Multiple rows were not expected.`
         *   - `.code` = {@link errors.queryResultErrorCode.multiple queryResultErrorCode.multiple}
         * - Resolves with the new value, if transformation callback `cb` was specified.
         *
         * @see
         * {@link Database.oneOrNone oneOrNone}
         *
         * @example
         *
         * // a query with in-line value transformation:
         * db.one('INSERT INTO Events VALUES($1) RETURNING id', [123], event => event.id)
         *     .then(data=> {
         *         // data = a new event id, rather than an object with it
         *     });
         *
         * @example
         *
         * // a query with in-line value transformation + conversion:
         * db.one('SELECT count(*) FROM Users', [], c => +c.count)
         *     .then(count=> {
         *         // count = a proper integer value, rather than an object with a string
         *     });
         *
         */
        obj.one = function (query, values, cb, thisArg) {
            const v = obj.query.call(this, query, values, $npm.result.one);
            return transform(v, cb, thisArg);
        };

        /**
         * @method Database.many
         * @description
         * Executes a query that expects one or more rows.
         * When the query returns no rows, the method rejects.
         *
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @returns {external:Promise}
         * A promise object that represents the query result:
         * - When 1 or more rows are returned, it resolves with the array of rows. The array is extended with
         *   hidden property `duration` - number of milliseconds it took the client to execute the query.
         * - When no rows are returned, it rejects with {@link errors.QueryResultError QueryResultError}:
         *   - `.message` = `No data returned from the query.`
         *   - `.code` = {@link errors.queryResultErrorCode.noData queryResultErrorCode.noData}
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
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @param {function} [cb]
         * Value transformation callback, to allow in-line value change.
         * When specified, the return value replaces the original resolved value.
         *
         * The function takes only one parameter - value resolved from the query.
         *
         * @param {} [thisArg]
         * Value to use as `this` when executing the transformation callback.
         *
         * @returns {external:Promise}
         * A promise object that represents the query result:
         * - When no rows are returned, it resolves with `null`.
         * - When 1 row is returned, it resolves with that row as a single object.
         * - When multiple rows are returned, it rejects with {@link errors.QueryResultError QueryResultError}:
         *   - `.message` = `Multiple rows were not expected.`
         *   - `.code` = {@link errors.queryResultErrorCode.multiple queryResultErrorCode.multiple}
         * - Resolves with the new value, if transformation callback `cb` was specified.
         *
         * @see
         * {@link Database.one one},
         * {@link Database.none none},
         * {@link Database.manyOrNone manyOrNone}
         *
         * @example
         *
         * // a query with in-line value transformation:
         * db.oneOrNone('SELECT id FROM Events WHERE type = $1', ['entry'], e => e && e.id)
         *     .then(data=> {
         *         // data = the event id or null (rather than object or null)
         *     });
         *
         */
        obj.oneOrNone = function (query, values, cb, thisArg) {
            const v = obj.query.call(this, query, values, $npm.result.one | $npm.result.none);
            return transform(v, cb, thisArg);
        };

        /**
         * @method Database.manyOrNone
         * @description
         * Executes a query that expects any number of rows.
         *
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @returns {external:Promise<Array>}
         * A promise object that represents the query result:
         * - When no rows are returned, it resolves with an empty array.
         * - When 1 or more rows are returned, it resolves with the array of rows.
         *
         * The resolved array is extended with hidden property `duration` - number of milliseconds
         * it took the client to execute the query.
         *
         * @see
         * {@link Database.any any},
         * {@link Database.many many},
         * {@link Database.none none}
         *
         */
        obj.manyOrNone = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.many | $npm.result.none);
        };

        /**
         * @method Database.any
         * @description
         * Executes a query that expects any number of rows.
         * This is simply a shorter alias for method {@link Database.manyOrNone manyOrNone}.
         *
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @returns {external:Promise<Array>}
         * A promise object that represents the query result:
         * - When no rows are returned, it resolves with an empty array.
         * - When 1 or more rows are returned, it resolves with the array of rows.
         *
         * The resolved array is extended with hidden property `duration` - number of milliseconds
         * it took the client to execute the query.
         *
         * @see
         * {@link Database.manyOrNone manyOrNone},
         * {@link Database.map map},
         * {@link Database.each each}
         *
         */
        obj.any = function (query, values) {
            return obj.query.call(this, query, values, $npm.result.any);
        };

        /**
         * @method Database.result
         * @description
         * Executes a query without any expectation for the return data, to resolve with the
         * original $[Result] object when successful.
         *
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @param {function} [cb]
         * Value transformation callback, to allow in-line value change.
         * When specified, the return value replaces the original resolved value.
         *
         * The function takes only one parameter - value resolved from the query.
         *
         * @param {} [thisArg]
         * Value to use as `this` when executing the transformation callback.
         *
         * @returns {external:Promise}
         * A promise object that represents the query result:
         * - resolves with the original $[Result] object, extended with property `duration` -
         *   number of milliseconds it took the client to execute the query.
         * - resolves with the new value, if transformation callback `cb` was specified.
         *
         * @example
         *
         * // use of value transformation:
         * // deleting rows and returning the number of rows deleted
         * db.result('DELETE FROM Events WHERE id = $1', [123], r => r.rowCount)
         *     .then(data=> {
         *         // data = number of rows that were deleted
         *     });
         *
         * @example
         *
         * // use of value transformation:
         * // getting only column details from a table
         * db.result('SELECT * FROM Users LIMIT 0', null, r => r.fields)
         *     .then(data=> {
         *         // data = array of column descriptors
         *     });
         *
         */
        obj.result = function (query, values, cb, thisArg) {
            const v = obj.query.call(this, query, values, $npm.special.cache.resultQuery);
            return transform(v, cb, thisArg);
        };

        /**
         * @method Database.stream
         * @description
         * Custom data streaming, with the help of $[pg-query-stream].
         *
         * This method doesn't work with the $[Native Bindings], and if option `pgNative`
         * is set, it will reject with `Streaming doesn't work with Native Bindings.`
         *
         * @param {QueryStream} qs
         * Stream object of type $[QueryStream].
         *
         * @param {Database.streamInitCB} initCB
         * Stream initialization callback.
         *
         * It is invoked with the same `this` context as the calling method.
         *
         * @returns {external:Promise}
         * Result of the streaming operation.
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
         * Executes a query against a database function by its name: `SELECT * FROM funcName(values)`.
         *
         * @param {string} funcName
         * Name of the function to be executed.
         *
         * @param {array|value} [values]
         * Parameters for the function - one value or an array of values.
         *
         * @param {queryResult} [qrm=queryResult.any] - {@link queryResult Query Result Mask}.
         *
         * @returns {external:Promise}
         *
         * A promise object as returned from method {@link Database.query query}, according to parameter `qrm`.
         *
         * @see
         * {@link Database.query query},
         * {@link Database.proc proc}
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
         * The method simply forwards into {@link Database.func func}`(procName, values, queryResult.one|queryResult.none)`.
         *
         * @param {string} procName
         * Name of the stored procedure to be executed.
         *
         * @param {array|value} [values]
         * Parameters for the procedure - one value or an array of values.
         *
         * @param {function} [cb]
         * Value transformation callback, to allow in-line value change.
         * When specified, the return value replaces the original resolved value.
         *
         * The function takes only one parameter - value resolved from the query.
         *
         * @param {} [thisArg]
         * Value to use as `this` when executing the transformation callback.
         *
         * @returns {external:Promise}
         *
         * It calls {@link Database.func func}(`procName`, `values`, `queryResult.one|queryResult.none`),
         * and then returns the same result as method {@link Database.oneOrNone oneOrNone}.
         *
         * And if transformation callback `cb` was specified, it resolves with the new value.
         *
         * @see
         * {@link Database.oneOrNone oneOrNone},
         * {@link Database.func func}
         */
        obj.proc = function (procName, values, cb, thisArg) {
            const v = obj.func.call(this, procName, values, $npm.result.one | $npm.result.none);
            return transform(v, cb, thisArg);
        };

        /**
         * @method Database.map
         * @description
         * Creates a new array with the results of calling a provided function on every element in the array of rows
         * resolved by method {@link Database.any any}.
         *
         * It is a convenience method to reduce the following code:
         *
         * ```js
         * db.any(query, values)
         *     .then(data => {
         *         return data.map((row, index, data) => {
         *              // return a new element
         *         });
         *     });
         * ```
         *
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} values
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @param {function} cb
         * Function that produces an element of the new array, taking three arguments:
         * - `row` - the current row object being processed in the array
         * - `index` - the index of the current row being processed in the array
         * - `data` - the original array of rows resolved by method {@link Database.any any}
         *
         * @param {} [thisArg]
         * Value to use as `this` when executing the callback.
         *
         * @returns {external:Promise<Array>}
         * Resolves with the new array of values returned from the callback. The array is extended with
         * hidden property `duration` - number of milliseconds it took the client to execute the query.
         *
         * @see
         * {@link Database.any any},
         * {@link Database.each each},
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map Array.map}
         *
         * @example
         *
         * db.map('SELECT id FROM Users WHERE status = $1', ['active'], row => row.id)
         *     .then(data => {
         *         // data = array of active user id-s
         *     })
         *     .catch(error => {
         *        // error
         *     });
         *
         * @example
         *
         * db.tx(t => {
         *     return t.map('SELECT id FROM Users WHERE status = $1', ['active'], row => {
         *        return t.none('UPDATE Events SET checked = $1 WHERE userId = $2', [true, row.id]);
         *     }).then(t.batch);
         * })
         *     .then(data => {
         *         // success
         *     })
         *     .catch(error => {
         *         // error
         *     });
         *
         * @example
         *
         * // Build a list of active users, each with the list of user events:
         * db.task(t => {
         *     return t.map('SELECT id FROM Users WHERE status = $1', ['active'], user => {
         *         return t.any('SELECT * FROM Events WHERE userId = $1', user.id)
         *             .then(events=> {
         *                 user.events = events;
         *                 return user;
         *             });
         *     }).then(t.batch);
         * })
         *     .then(data => {
         *         // success
         *     })
         *     .catch(error => {
         *         // error
         *     });
         *
         */
        obj.map = function (query, values, cb, thisArg) {
            return obj.any.call(this, query, values)
                .then(data => {
                    const result = data.map(cb, thisArg);
                    $npm.utils.addReadProp(result, 'duration', data.duration, true);
                    return result;
                });
        };

        /**
         * @method Database.each
         * @description
         * Executes a provided function once per array element, for an array of rows resolved by method {@link Database.any any}.
         *
         * It is a convenience method to reduce the following code:
         *
         * ```js
         * db.any(query, values)
         *     .then(data => {
         *         data.forEach((row, index, data) => {
         *              // process the row
         *         });
         *         return data;
         *     });
         * ```
         *
         * @param {string|object} query
         * Query to be executed, which can any of the following types:
         * - A non-empty query string
         * - Prepared Statement `{name, text, values, ...}` or {@link PreparedStatement} object
         * - Parameterized Query `{text, values, ...}` or {@link ParameterizedQuery} object
         * - {@link QueryFile} object
         *
         * @param {array|value} [values]
         * Query formatting parameters.
         *
         * When `query` is of type `string` or a {@link QueryFile} object, the `values` can be:
         * - a single value - to replace all `$1` occurrences
         * - an array of values - to replace all `$1`, `$2`, ... variables
         * - an object - to apply $[Named Parameters] formatting
         *
         * When `query` is a Prepared Statement or a Parameterized Query (or their class types),
         * and `values` is not `null` or `undefined`, it is automatically set within such object,
         * as an override for its internal `values`.
         *
         * @param {function} cb
         * Function to execute for each row, taking three arguments:
         * - `row` - the current row object being processed in the array
         * - `index` - the index of the current row being processed in the array
         * - `data` - the array of rows resolved by method {@link Database.any any}
         *
         * @param {} [thisArg]
         * Value to use as `this` when executing the callback.
         *
         * @returns {external:Promise<Array<Object>>}
         * Resolves with the original array of rows, extended with hidden property `duration` -
         * number of milliseconds it took the client to execute the query.
         *
         * @see
         * {@link Database.any any},
         * {@link Database.map map},
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach Array.forEach}
         *
         * @example
         *
         * db.each('SELECT id, code, name FROM Events', [], row => {
         *     row.code = +row.code; // leading `+` is short for `parseInt()`
         * })
         *     .then(data => {
         *         // data = array of events, with 'code' converted into integer
         *     })
         *     .catch(error => {
         *         // error
         *     });
         *
         */
        obj.each = function (query, values, cb, thisArg) {
            return obj.any.call(this, query, values)
                .then(data => {
                    data.forEach(cb, thisArg);
                    return data;
                });
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
         * the task context object.
         *
         * See class {@link Task} for more details.
         *
         * @param {} tag/cb
         * When the method takes only one parameter, it must be the callback function (or $[ES6 generator]) for the task.
         * However, when calling the method with 2 parameters, the first one is always the `tag` - traceable context for the
         * task (see $[tags]).
         *
         * @param {function|generator} [cb]
         * Task callback function (or $[ES6 generator]), if it is not `undefined`, or else the callback is expected to
         * be passed in as the first parameter.
         *
         * @returns {external:Promise}
         *
         * A promise object that represents the result from the callback function.
         *
         * @see
         * {@link Task},
         * {@link Database.tx tx},
         * $[tags]
         *
         * @example
         *
         * // using the regular callback syntax:
         * db.task(t => {
         *         // t.ctx = task context object
         *
         *         return t.one('SELECT id FROM Users WHERE name = $1', 'John')
         *             .then(user=> {
         *                 return t.any('SELECT * FROM Events WHERE userId = $1', user.id);
         *             });
         *     })
         *     .then(data => {
         *         // success
         *         // data = as returned from the task's callback
         *     })
         *     .catch(error => {
         *         // error
         *     });
         *
         * @example
         *
         * // using the ES6 arrow syntax:
         * db.task(t => {
         *         // t.ctx = task context object
         *         
         *         return t.one('SELECT id FROM Users WHERE name = $1', 'John')
         *             .then(user=> {
         *                 return t.any('SELECT * FROM Events WHERE userId = $1', user.id);
         *             });
         *     })
         *     .then(data=> {
         *         // success
         *         // data = as returned from the task's callback
         *     })
         *     .catch(error=> {
         *         // error
         *     });
         *
         * @example
         *
         * // using an ES6 generator for the callback:
         * db.task(function * (t) {
         *         // t.ctx = task context object
         *
         *         let user = yield t.one('SELECT id FROM Users WHERE name = $1', 'John');
         *         return yield t.any('SELECT * FROM Events WHERE userId = $1', user.id);
         *     })
         *     .then(data => {
         *         // success
         *         // data = as returned from the task's callback
         *     })
         *     .catch(error => {
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
         * A transaction simply wraps a regular {@link Database.task task} in automatic queries:
         * - it executes `BEGIN` just before invoking the callback function
         * - it executes `COMMIT`, if the callback didn't throw any error or return a rejected promise
         * - it executes `ROLLBACK`, if the callback did throw an error or return a rejected promise
         *
         * The callback function is called with one parameter - database protocol (same as `this`), extended with methods
         * {@link Task.batch batch}, {@link Task.page page}, {@link Task.sequence sequence}, plus property {@link Task.ctx ctx} -
         * the transaction context object.
         *
         * See class {@link Task} for more details.
         *
         * Note that transactions should be chosen over tasks only where they are necessary, because unlike regular tasks,
         * transactions are blocking operations, and must be used with caution.
         *
         * @param {} tag/cb
         * When the method takes only one parameter, it must be the callback function (or $[ES6 generator]) for the transaction.
         * However, when calling the method with 2 parameters, the first one is always the `tag` - traceable context for the
         * transaction (see $[tags]).
         *
         * @param {function|generator} [cb]
         * Transaction callback function (or $[ES6 generator]), if it is not `undefined`, or else the callback is expected to be
         * passed in as the first parameter.
         *
         * @returns {external:Promise}
         *
         * A promise object that represents the result from the callback function.
         *
         * @see
         * {@link Task},
         * {@link Database.task},
         * $[tags]
         *
         * @example
         *
         * // using the regular callback syntax:
         * db.tx(t => {
         *         // t.ctx = transaction context object
         *
         *         return t.one('INSERT INTO Users(name, age) VALUES($1, $2) RETURNING id', ['Mike', 25])
         *             .then(user=> {
         *                 return t.none('INSERT INTO Events(userId, name) VALUES($1, $2)', [user.id, 'created']);
         *             });
         *     })
         *     .then(data => {
         *         // success
         *         // data = as returned from the transaction's callback
         *     })
         *     .catch(error => {
         *         // error
         *     });
         *
         * @example
         *
         * // using the ES6 arrow syntax:
         * db.tx(t=> {
         *         // t.ctx = transaction context object
         *         
         *         return t.one('INSERT INTO Users(name, age) VALUES($1, $2) RETURNING id', ['Mike', 25])
         *             .then(user=> {
         *                 return t.batch([
         *                     t.none('INSERT INTO Events(userId, name) VALUES($1, $2)', [user.id, 'created']),
         *                     t.none('INSERT INTO Events(userId, name) VALUES($1, $2)', [user.id, 'login'])
         *                 ]);
         *             });
         *     })
         *     .then(data=> {
         *         // success
         *         // data = as returned from the transaction's callback
         *     })
         *     .catch(error=> {
         *         // error
         *     });
         *
         * @example
         *
         * // using an ES6 generator for the callback:
         * db.tx(function * (t) {
         *         // t.ctx = transaction context object
         *
         *         let user = yield t.one('INSERT INTO Users(name, age) VALUES($1, $2) RETURNING id', ['Mike', 25]);
         *         return yield t.none('INSERT INTO Events(userId, name) VALUES($1, $2)', [user.id, 'created']);
         *     })
         *     .then(data => {
         *         // success
         *         // data = as returned from the transaction's callback
         *     })
         *     .catch(error => {
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

            let tag; // tag object/value;
            const taskCtx = ctx.clone(); // task context object;

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

            const cb = taskCtx.cb;

            if (typeof cb !== 'function') {
                return $p.reject(new TypeError('Callback function is required for the ' + (isTX ? 'transaction.' : 'task.')));
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

            // eslint-disable-next-line
            const tsk = new config.$npm.task(taskCtx, tag, isTX, config);

            extend(taskCtx, tsk);

            if (taskCtx.db) {
                // reuse existing connection;
                $npm.utils.addReadProp(tsk.ctx, 'isFresh', taskCtx.db.isFresh);
                return config.$npm.task.exec(taskCtx, tsk, isTX, config);
            }

            // connection required;
            return config.$npm.connect.pool(taskCtx)
                .then(db => {
                    taskCtx.connect(db);
                    $npm.utils.addReadProp(tsk.ctx, 'isFresh', db.isFresh);
                    return config.$npm.task.exec(taskCtx, tsk, isTX, config);
                })
                .then(data => {
                    taskCtx.disconnect();
                    return data;
                })
                .catch(error => {
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

let jsHandled, nativeHandled;
const dbObjects = {};

function checkForDuplicates(cn, config) {
    const cnKey = normalizeConnection(cn);
    if (cnKey in dbObjects) {
        if (!config.options.noWarnings) {
            $npm.con.warn('WARNING: Creating a duplicate database object for the same connection.\n%s\n',
                $npm.utils.getLocalStack(5));
        }
    } else {
        dbObjects[cnKey] = true;
    }
}

/**
 * For connections that are objects it reorders the keys alphabetically,
 * and then serializes the result into a JSON string.
 *
 * @param {string|object} cn - connection string or object
 *
 * @private
 */
function normalizeConnection(cn) {
    if (typeof cn === 'object') {
        const obj = {}, keys = Object.keys(cn).sort();
        keys.forEach(name => {
            obj[name] = cn[name];
        });
        cn = obj;
    }
    return JSON.stringify(cn);
}

function setErrorHandler(config) {
    // we do not do code coverage specific to Native Bindings:
    // istanbul ignore if
    if (config.options.pgNative) {
        if (!nativeHandled) {
            config.pgp.pg.on('error', onError);
            nativeHandled = true;
        }
    } else {
        if (!jsHandled) {
            config.pgp.pg.on('error', onError);
            jsHandled = true;
        }
    }
}

// this event only happens when the connection is lost physically,
// which cannot be tested automatically; removing from coverage:
// istanbul ignore next
function onError(err, client) {
    const ctx = client.$ctx;
    $npm.events.error(ctx.options, err, {
        cn: $npm.utils.getSafeConnection(ctx.cn),
        dc: ctx.dc
    });
}

module.exports = config => {
    const npm = config.$npm;
    npm.connect = npm.connect || $npm.connect(config);
    npm.query = npm.query || $npm.query(config);
    npm.task = npm.task || $npm.task(config);
    return Database;
};

/**
 * @callback Database.streamInitCB
 * @description
 * Stream initialization callback, used by {@link Database.stream}.
 *
 * @param {external:Stream} stream
 * Stream object to initialize streaming.
 *
 * @example
 * const QueryStream = require('pg-query-stream');
 * const JSONStream = require('JSONStream');
 *
 * // you can also use pgp.as.format(query, values, options)
 * // to format queries properly, via pg-promise;
 * const qs = new QueryStream('select * from users');
 *
 * db.stream(qs, stream => {
 *         // initiate streaming into the console:
 *         stream.pipe(JSONStream.stringify()).pipe(process.stdout);
 *     })
 *     .then(data => {
 *         console.log("Total rows processed:", data.processed,
 *           "Duration in milliseconds:", data.duration);
 *     })
 *     .catch(error => {
 *         // error;
 *     });
 */

/**
 * @external Stream
 * @see https://nodejs.org/api/stream.html
 */
