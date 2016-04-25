'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    QueryFileError: require('./queryFile'),
};

/**
 * @constructor PreparedStatementError
 * @augments Error
 * @summary Prepared Statement Error class.
 * @description
 * Specified as the rejection reason by query methods when encountering an error related to a {@link PreparedStatement},
 * whether it is used explicitly or implicitly (via simple `{name, text, values}` object).
 *
 * The type is available from the {@link errors} namespace.
 *
 * @property {string} name
 * Standard {@link external:Error Error} property - error type name = `PreparedStatementError`.
 *
 * @property {string} message
 * Standard {@link external:Error Error} property - the error message.
 *
 * @property {object} stack
 * Standard {@link external:Error Error} property - the stack trace.
 *
 * @property {QueryFileError} error
 * Internal {@link QueryFileError} object.
 *
 * It is set only when the source {@link PreparedStatement} used a {@link QueryFile} which threw the error.
 *
 * @property {Object} result
 * Resulting Prepared Statement object.
 *
 * @returns {PreparedStatementError}
 */
function PreparedStatementError(error, ps) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'PreparedStatementError';
    this.stack = temp.stack;
    if (error instanceof $npm.QueryFileError) {
        this.error = error;
        this.message = "Failed to initialize 'text' from a QueryFile.";
    } else {
        this.message = error;
    }
    this.result = ps;
}

PreparedStatementError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: PreparedStatementError,
        writable: true,
        configurable: true
    }
});

/**
 * @method PreparedStatementError.toString
 * @description
 * Creates a well-formatted multi-line string that represents the error.
 *
 * It is called automatically when writing the object into the console.
 *
 * @param {Number} [level=0]
 * Nested output level, to provide visual offset.
 *
 * @returns {string}
 */
PreparedStatementError.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap0 = $npm.utils.messageGap(level),
        gap1 = $npm.utils.messageGap(level + 1),
        gap2 = $npm.utils.messageGap(level + 2)
    var lines = [
        'PreparedStatementError {',
        gap1 + 'message: "' + this.message + '"',
        gap1 + 'result: {',
        gap2 + 'name: ' + JSON.stringify(this.result.name),
        gap2 + 'text: ' + JSON.stringify(this.result.text),
        gap2 + 'values: ' + JSON.stringify(this.result.values),
        gap1 + '}'
    ];
    if (this.error) {
        lines.push(gap1 + 'error: ' + this.error.toString(level + 1));
    }
    lines.push(gap0 + '}');
    return lines.join($npm.os.EOL);
};

PreparedStatementError.prototype.inspect = function () {
    return this.toString();
};

module.exports = PreparedStatementError;
