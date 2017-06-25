'use strict';

const npm = {
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
 * @property {function} PreparedStatementError
 * {@link errors.PreparedStatementError PreparedStatementError} class constructor.
 *
 * Represents all errors that can be reported by class {@link PreparedStatement}.
 *
 * @property {function} ParameterizedQueryError
 * {@link errors.ParameterizedQueryError ParameterizedQueryError} class constructor.
 *
 * Represents all errors that can be reported by class {@link ParameterizedQuery}.
 *
 * @property {function} QueryFileError
 * {@link errors.QueryFileError QueryFileError} class constructor.
 *
 * Represents all errors that can be reported by class {@link QueryFile}.
 *
 * @property {function} QueryResultError
 * {@link errors.QueryResultError QueryResultError} class constructor.
 *
 * Represents all result-specific errors from query methods.
 *
 * @property {errors.queryResultErrorCode} queryResultErrorCode
 * Error codes `enum` used by class {@link errors.QueryResultError QueryResultError}.
 *
 */

module.exports = {
    QueryResultError: npm.qResult.QueryResultError,
    queryResultErrorCode: npm.qResult.queryResultErrorCode,
    PreparedStatementError: npm.prepared,
    ParameterizedQueryError: npm.paramQuery,
    QueryFileError: npm.qFile
};

Object.freeze(module.exports);
