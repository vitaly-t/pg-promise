'use strict';

var $npm = {
    qResult: require('./queryResult'),
    qFile: require('./queryFile'),
    prepared: require('./prepared'),
    paramQuery: require('./paramQuery')
};

/**
 * @namespace errors
 * @description
 * Error types namespace, available as `pgp.errors`, before and after initializing the library.
 *
 * @property {QueryResultError} QueryResultError
 * Represents all result-specific errors from query methods.
 *
 * @property {queryResultErrorCode} queryResultErrorCode
 * Error codes `enum` used by class {@link QueryResultError}.
 *
 * @property {PreparedStatementError} PreparedStatementError
 * Represents all errors that can be reported by class {@link PreparedStatement}.
 *
 * @property {ParameterizedQueryError} ParameterizedQueryError
 * Represents all errors that can be reported by class {@link ParameterizedQuery}.
 *
 * @property {QueryFileError} QueryFileError
 * Represents all errors that can be reported by class {@link QueryFile}.
 */
module.exports = {
    QueryResultError: $npm.qResult.QueryResultError,
    queryResultErrorCode: $npm.qResult.queryResultErrorCode,
    PreparedStatementError: $npm.prepared,
    ParameterizedQueryError: $npm.paramQuery,
    QueryFileError: $npm.qFile
};

Object.freeze(module.exports);
