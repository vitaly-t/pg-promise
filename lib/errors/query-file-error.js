/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const npm = {
    os: require('os'),
    utils: require('../utils'),
    minify: require('pg-minify'),
    inspect: require('util').inspect
};

/**
 * @class errors.QueryFileError
 * @augments external:Error
 * @description
 * {@link errors.QueryFileError QueryFileError} class, available from the {@link errors} namespace.
 *
 * This type represents all errors related to {@link QueryFile}.
 *
 * @property {string} name
 * Standard {@link external:Error Error} property - error type name = `QueryFileError`.
 *
 * @property {string} message
 * Standard {@link external:Error Error} property - the error message.
 *
 * @property {string} stack
 * Standard {@link external:Error Error} property - the stack trace.
 *
 * @property {string} file
 * File path/name that was passed into the {@link QueryFile} constructor.
 *
 * @property {object} options
 * Set of options that was used by the {@link QueryFile} object.
 *
 * @property {SQLParsingError} error
 * Internal $[SQLParsingError] object.
 *
 * It is set only when the error was thrown by $[pg-minify] while parsing the SQL file.
 *
 * @see QueryFile
 *
 */
class QueryFileError extends Error {
    constructor(error, qf) {
        const isSqlError = error instanceof npm.minify.SQLParsingError;
        const message = isSqlError ? 'Failed to parse the SQL.' : error.message;
        super(message);
        this.name = this.constructor.name;
        if (isSqlError) {
            this.error = error;
        }
        this.file = qf.file;
        this.options = qf.options;
        Error.captureStackTrace(this, this.constructor);
    }
}

npm.utils.addInspection(QueryFileError, function () {
    const obj = {
        message: this.message,
        file: this.file,
        options: this.options
    };
    if (this.error) {
        obj.error = this.error;
    }
    return 'QueryFileError ' + npm.inspect(obj, {breakLength: 100, depth: 5, colors: true});
});

module.exports = {QueryFileError};
