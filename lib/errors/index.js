'use strict';

var $npm = {
    qResult: require('./queryResult'),
    qFile: require('./queryFile'),
    prepared: require('./prepared')
};

/**
 * @namespace errors
 * @description
 * Error types namespace, available as `pgp.errors`.
 *
 * @property {QueryResultError} QueryResultError
 * {@link QueryResultError} type.
 *
 * @property {queryResultErrorCode} queryResultErrorCode
 * {@link queryResultErrorCode} enumerator.
 *
 */
module.exports = {
    QueryResultError: $npm.qResult.QueryResultError,
    queryResultErrorCode: $npm.qResult.queryResultErrorCode,
    PreparedStatementError: $npm.prepared,
    QueryFileError: $npm.qFile
};

Object.freeze(module.exports);
