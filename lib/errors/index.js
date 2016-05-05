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
 * @property {errors.QueryResultError} QueryResultError
 * Represents all result-specific errors from query methods.
 *
 * @property {errors.queryResultErrorCode} queryResultErrorCode
 * Error codes `enum` used by class {@link QueryResultError}.
 *
 * @property {errors.PreparedStatementError} PreparedStatementError
 * Represents all errors that can be reported by class {@link PreparedStatement}.
 *
 * @property {errors.ParameterizedQueryError} ParameterizedQueryError
 * Represents all errors that can be reported by class {@link ParameterizedQuery}.
 *
 * @property {errors.QueryFileError} QueryFileError
 * Represents all errors that can be reported by class {@link QueryFile}.
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
