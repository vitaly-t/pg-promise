'use strict';

var $npm = {
    pg: require('pg'),
    minify: require('pg-minify'),
    adapter: require('./adapter'),
    result: require('./result'),
    promise: require('./promise'),
    formatting: require('./formatting'),
    queryFile: require('./queryFile'),
    errors: require('./errors'),
    utils: require('./utils'),
    mode: require('./txMode'),
    PS: require('./prepared')
};

/**
 * @author Vitaly Tomilov
 * @module pg-promise
 *
 * @description
 * Advanced access layer to node-postgres via $[Promises/A+]
 *
 * Below is the complete list of Initialization Options for the library.
 *
 * @param {Object} [options]
 * Library Initialization Options.
 *
 * @param {Boolean} [options.pgFormatting=false]
 * Redirects query formatting to PG.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Boolean} [options.pgNative=false]
 * Use $[Native Bindings] (library $[pg-native] must be installed).
 *
 * This is a static property (can only be set prior to initialization).
 *
 * @param {Object|Function} [options.promiseLib=Promise]
 * Override for the default promise library.
 *
 * This is a static property (can only be set prior to initialization).
 *
 * @param {Boolean} [options.noLocking=false]
 * Prevents protocol locking.
 *
 * By default, the library locks its protocol to read-only access, as a fool-proof mechanism.
 * Specifically for the extend event this serves as a protection against overriding existing
 * properties or trying to set them at the wrong time.
 *
 * If this provision gets in the way of using a mock-up framework for your tests, you can force
 * the library to deactivate most of the locks by setting `noLocking` = `true` within the options.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Boolean} [options.capSQL=false]
 * Capitalizes all generated SQL commands.
 *
 * By default, all internal SQL within the library is generated using the low case.
 * If, however, you want all SQL to be capitalized instead, set `capSQL` = `true`.
 *
 * This is purely a cosmetic feature.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.connect]
 * Global event {@link event:connect connect} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.disconnect]
 * Global event {@link event:disconnect disconnect} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.query]
 * Global event {@link event:query query} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.receive]
 * Global event {@link event:receive receive} handler.
 *
 * @param {Function} [options.task]
 * Global event {@link event:task task} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.transact]
 * Global event {@link event:transact transact} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.error]
 * Global event {@link event:error error} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @param {Function} [options.extend]
 * Global event {@link event:extend extend} handler.
 *
 * This property can be set dynamically (before or after initialization).
 *
 * @example
 *
 * var options = {
 *   // Initialization Options
 * };
 *
 * var pgp = require('pg-promise')(options);
 *
 */
function $main(options) {

    var invalidInit;
    if (!$npm.utils.isNull(options)) {
        if (typeof options === 'string') {
            // Check for invalid initialization: it must not be a connection string.
            var pg = require.cache[require.resolve('pg')];
            var pgCS = pg.require('pg-connection-string');
            var cn = pgCS.parse(options);
            invalidInit = cn && cn.database !== options;
        }
        if (typeof options === 'object') {
            // Check for invalid initialization: it must not be a connection object.
            invalidInit = 'host' in options || 'database' in options;
        } else {
            if (!invalidInit) {
                throw new TypeError("Invalid initialization options.");
            }
        }
    }

    if (invalidInit) {
        // The most common mistake in using the library - trying to pass in a database
        // connection object or string as the library's initialization object.
        //
        // Steps for using the library:
        //
        // 1. Initialize the library:
        //     var pgp = require('pg-promise')(/*initialization options*/);
        // 2. Create a database object:
        //     var db = pgp(connection);
        //
        // If you skip the first step, you will get this error.
        throw new TypeError("Invalid library initialization: must initialize the library before creating a database object.");
    }

    if (options) {
        // Locking properties that cannot be changed later:
        $npm.utils.addReadProp(options, 'promiseLib', options.promiseLib);
        $npm.utils.addReadProp(options, 'pgNative', options.pgNative);
    }

    var p = $npm.promise(options ? options.promiseLib : null);

    var config = {
        promiseLib: p.promiseLib,
        promise: p.promise,
        pg: $npm.pg,
        npm: {}
    };

    // istanbul ignore next:
    // we do not cover code specific to native bindings
    if (options && options.pgNative) {
        config.pg = $npm.pg.native;
        config.native = true;
    }

    var Database = require('./database')(config);

    var inst = function (cn, dc) {
        var t = typeof cn;
        if (cn && (t === 'string' || t === 'object')) {
            return new Database(cn, dc, options, config);
        }
        // cannot access a database without connection details;
        throw new TypeError("Invalid connection details.");
    };

    $npm.utils.addReadProperties(inst, rootNameSpace);

    /**
     * @member {external:PG} pg
     * @readonly
     * @description
     * Instance of the $[PG] library that's being used, depending on initialization option `pgNative`:
     *  - regular `pg` module instance, without option `pgNative`, or equal to `false` (default)
     *  - `pg` module instance with $[Native Bindings], if option `pgNative` was set.
     *
     * Available as `pgp.pg`, after initializing the library.
     */
    $npm.utils.addReadProp(inst, 'pg', config.pg);

    /**
     * @member {Function} end
     * @readonly
     * @description
     * Terminates pg library (call it when exiting the application).
     *
     * Available as `pgp.end`, after initializing the library.
     */
    $npm.utils.addReadProp(inst, 'end', function () {
        config.pg.end();
    });

    return inst;
}

var rootNameSpace = {

    /**
     * @member {formatting} as
     * @readonly
     * @description
     * Namespace for {@link formatting all query-formatting functions}.
     *
     * Available as `pgp.as`, before and after initializing the library.
     *
     * @see {@link formatting}.
     */
    as: $npm.formatting.as,

    /**
     * @member {external:pg-minify} minify
     * @readonly
     * @description
     * Instance of the $[pg-minify] library that's used.
     *
     * Available as `pgp.minify`, before and after initializing the library.
     */
    minify: $npm.minify,

    /**
     * @member {queryResult} queryResult
     * @readonly
     * @description
     * Query Result Mask enumerator.
     *
     * Available as `pgp.queryResult`, before and after initializing the library.
     */
    queryResult: $npm.result,

    /**
     * @member {PromiseAdapter} PromiseAdapter
     * @readonly
     * @description
     * {@link PromiseAdapter} class.
     *
     * Available as `pgp.PromiseAdapter`, before and after initializing the library.
     */
    PromiseAdapter: $npm.adapter,

    /**
     * @member {PreparedStatement} PreparedStatement
     * @readonly
     * @description
     * {@link PreparedStatement} class.
     *
     * Available as `pgp.PreparedStatement`, before and after initializing the library.
     */
    PreparedStatement: $npm.PS,

    /**
     * @member {QueryFile} QueryFile
     * @readonly
     * @description
     * {@link QueryFile} class.
     *
     * Available as `pgp.QueryFile`, before and after initializing the library.
     */
    QueryFile: $npm.queryFile,

    /**
     * @member {errors} errors
     * @readonly
     * @description
     * {@link errors Errors} - namespace for all error types.
     *
     * Available as `pgp.errors`, before and after initializing the library.
     */
    errors: $npm.errors,

    /**
     * @member {txMode} txMode
     * @readonly
     * @description
     * {@link txMode Transaction Mode} namespace.
     *
     * Available as `pgp.txMode`, before and after initializing the library.
     */
    txMode: $npm.mode
};

$npm.utils.addReadProperties($main, rootNameSpace);

module.exports = $main;

/**
 * @external Promise
 * @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

/**
 * @external PG
 * @see https://github.com/brianc/node-postgres/blob/master/lib/index.js#L8
 */

/**
 * @external Client
 * @see https://github.com/brianc/node-postgres/blob/master/lib/client.js#L12
 */

/**
 * @external pg-minify
 * @see https://github.com/vitaly-t/pg-minify
 */
