/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const {QueryFileError} = require('./query-file-error');

const npm = {
    os: require('os'),
    utils: require('../utils'),
    inspect: require('util').inspect
};

/**
 * @class errors.ParameterizedQueryError
 * @augments external:Error
 * @description
 * {@link errors.ParameterizedQueryError ParameterizedQueryError} class, available from the {@link errors} namespace.
 *
 * This type represents all errors that can be reported by class {@link ParameterizedQuery}, whether it is used
 * explicitly or implicitly (via a simple `{text, values}` object).
 *
 * @property {string} name
 * Standard {@link external:Error Error} property - error type name = `ParameterizedQueryError`.
 *
 * @property {string} message
 * Standard {@link external:Error Error} property - the error message.
 *
 * @property {string} stack
 * Standard {@link external:Error Error} property - the stack trace.
 *
 * @property {errors.QueryFileError} error
 * Internal {@link errors.QueryFileError} object.
 *
 * It is set only when the source {@link ParameterizedQuery} used a {@link QueryFile} which threw the error.
 *
 * @property {object} result
 * Resulting Parameterized Query object.
 *
 * @see ParameterizedQuery
 */
class ParameterizedQueryError extends Error {
    constructor(error, pq) {
        const isQueryFileError = error instanceof QueryFileError;
        const message = isQueryFileError ? 'Failed to initialize \'text\' from a QueryFile.' : error;
        super(message);
        this.name = this.constructor.name;
        if (isQueryFileError) {
            this.error = error;
        }
        this.result = pq;
        Error.captureStackTrace(this, this.constructor);
    }
}

npm.utils.addInspection(ParameterizedQueryError, function () {
    const obj = {
        message: this.message,
        result: this.result
    };
    if (this.error) {
        obj.error = this.error;
    }
    return 'ParameterizedQueryError ' + npm.inspect(obj, {breakLength: 100, depth: 5, colors: true});
});

module.exports = {ParameterizedQueryError};
