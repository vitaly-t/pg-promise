'use strict';

var $npm = {
    qResult: require('./queryResult'),
    qFile: require('./queryFile'),
    prepared: require('./prepared'),
    paramQuery: require('./paramQuery'),
    column: require('./column')
};

/**
 * @namespace errors
 * @description
 * Error types namespace, available as `pgp.errors`, before and after initializing the library.
 *
 * @property {Function} PreparedStatementError
 * {@link errors.PreparedStatementError PreparedStatementError} class constructor.
 *
 * Represents all errors that can be reported by class {@link PreparedStatement}.
 *
 * @property {Function} ParameterizedQueryError
 * {@link errors.ParameterizedQueryError ParameterizedQueryError} class constructor.
 *
 * Represents all errors that can be reported by class {@link ParameterizedQuery}.
 *
 * @property {Function} QueryFileError
 * {@link errors.QueryFileError QueryFileError} class constructor.
 *
 * Represents all errors that can be reported by class {@link QueryFile}.
 *
 * @property {Function} QueryResultError
 * {@link errors.QueryResultError QueryResultError} class constructor.
 *
 * Represents all result-specific errors from query methods.
 *
 * @property {errors.queryResultErrorCode} queryResultErrorCode
 * Error codes `enum` used by class {@link errors.QueryResultError QueryResultError}.
 *
 */

// To add when ready:
// * @property {errors.ColumnError} ColumnError
// * Represents an error in parsing a column information by class {@link Columns}.

module.exports = {
    QueryResultError: $npm.qResult.QueryResultError,
    queryResultErrorCode: $npm.qResult.queryResultErrorCode,
    PreparedStatementError: $npm.prepared,
    ParameterizedQueryError: $npm.paramQuery,
    QueryFileError: $npm.qFile,
    ColumnError: $npm.column
};

Object.freeze(module.exports);
