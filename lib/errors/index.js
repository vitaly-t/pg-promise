'use strict';

var $npm = {
    qResult: require('./queryResult'),
    qFile: require('./queryFile'),
    prepared: require('./prepared')
};

/**
 * @namespace errors
 * @description
 * Error types namespace, available as `pgp.errors`, before and after initializing the library.
 *
 * @property {QueryResultError} QueryResultError
 * {@link QueryResultError} class.
 *
 * @property {queryResultErrorCode} queryResultErrorCode
 * {@link queryResultErrorCode} enumerator.
 *
 * @property {PreparedStatementError} PreparedStatementError
 * {@link PreparedStatementError} class.
 *
 * @property {QueryFileError} QueryFileError
 * {@link QueryFileError} class.
 *
 */
module.exports = {
    QueryResultError: $npm.qResult.QueryResultError,
    queryResultErrorCode: $npm.qResult.queryResultErrorCode,
    PreparedStatementError: $npm.prepared,
    QueryFileError: $npm.qFile
};

Object.freeze(module.exports);
