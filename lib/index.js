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
    mode: require('./txMode')
};

/**
 * Advanced access layer to node-postgres via $[Promises/A+]
 * @author Vitaly Tomilov
 * @module pg-promise
 *
 * @param {Object} [options]
 * Library Initialization Options.
 *
 * @param {Boolean} [options.pgFormatting=false]
 * Redirects query formatting to PG.
 *
 * @param {Object|Function} [options.promiseLib=Promise]
 * Override for the default promise library.
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
 * @param {Boolean} [options.capTX=false]
 * Capitalizes transaction commands.
 *
 * By default, all commands within automated transactions are executed in low case.
 * If you want them to be executed capitalized instead, set `capTX` = `true`.
 * This is purely a cosmetic feature.
 *
 * @param {Function} [options.connect]
 * Event {@link event:connect connect} handler.
 *
 * @param {Function} [options.disconnect]
 * Event {@link event:disconnect disconnect} handler.
 *
 * @param {Function} [options.query]
 * Event {@link event:query query} handler.
 *
 * @param {Function} [options.receive]
 * Event {@link event:receive receive} handler.
 *
 * @param {Function} [options.task]
 * Event {@link event:task task} handler.
 *
 * @param {Function} [options.transact]
 * Event {@link event:transact transact} handler.
 *
 * @param {Function} [options.error]
 * Event {@link event:error error} handler.
 *
 * @param {Function} [options.extend]
 * Event {@link event:extend extend} handler.
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

    if (!$npm.utils.isNull(options) && typeof options !== 'object') {
        throw new TypeError("Invalid parameter 'options' specified.");
    }

    $npm.promise(options ? options.promiseLib : null);

    var Database = require('./database')($npm.promise.p);

    var inst = function (cn) {
        var t = typeof cn;
        if (cn && (t === 'string' || t === 'object')) {
            return new Database(cn, options);
        }
        // cannot access a database without connection details;
        throw new TypeError("Invalid connection details.");
    };

    $npm.utils.addProperties(inst, rootNameSpace);
    $npm.utils.lock(inst);

    return inst;
}

var rootNameSpace = {

    /**
     * Terminates pg library (call it when exiting the application).
     * @member {Function} end
     * @readonly
     */
    end: function () {
        $npm.pg.end();
    },

    /**
     * Namespace for the type conversion helpers.
     * @member {formatting} as
     * @readonly
     */
    as: $npm.formatting.as,

    /**
     * Instance of the $[PG] library that's used.
     * @member {external:PG} pg
     * @readonly
     */
    pg: $npm.pg,

    /**
     * Instance of the $[pg-minify] library that's used.
     * @member {external:pg-minify} minify
     * @readonly
     */
    minify: $npm.minify,

    /**
     * Query Result Mask.
     * @member {queryResult} queryResult
     * @readonly
     */
    queryResult: $npm.result,

    /**
     * QueryResultError type.
     * @member {QueryResultError} QueryResultError
     * @readonly
     */
    QueryResultError: $npm.errors.QueryResultError,

    /**
     * PromiseAdapter type.
     * @member {PromiseAdapter} PromiseAdapter
     * @readonly
     */
    PromiseAdapter: $npm.adapter,

    /**
     * QueryFile type.
     * @member {QueryFile} QueryFile
     * @readonly
     */
    QueryFile: $npm.queryFile,

    /**
     * Transaction Mode namespace.
     * @member {txMode} txMode
     * @readonly
     */
    txMode: $npm.mode
};

$npm.utils.lock(rootNameSpace.as, true);
$npm.utils.lock(rootNameSpace.txMode, true);
$npm.utils.lock(rootNameSpace.PromiseAdapter, true);
$npm.utils.lock(rootNameSpace.QueryFile, true);
$npm.utils.lock(rootNameSpace.QueryResultError, true);
$npm.utils.lock(rootNameSpace.queryResult, true);

$npm.utils.addProperties($main, rootNameSpace);

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
