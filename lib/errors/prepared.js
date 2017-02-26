'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    QueryFileError: require('./queryFile')
};

/**
 * @interface errors.PreparedStatementError
 * @augments external:Error
 * @description
 * {@link errors.PreparedStatementError PreparedStatementError} interface, available from the {@link errors} namespace.
 *
 * This type represents all errors that can be reported by class {@link PreparedStatement}, whether it is used
 * explicitly or implicitly (via a simple `{name, text, values}` object).
 *
 * @property {string} name
 * Standard {@link external:Error Error} property - error type name = `PreparedStatementError`.
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
 * It is set only when the source {@link PreparedStatement} used a {@link QueryFile} which threw the error.
 *
 * @property {object} result
 * Resulting Prepared Statement object.
 *
 * @see PreparedStatement
 */
function PreparedStatementError(error, ps) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'PreparedStatementError';
    this.stack = temp.stack;
    if (error instanceof $npm.QueryFileError) {
        this.error = error;
        this.message = 'Failed to initialize \'text\' from a QueryFile.';
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
 * @method errors.PreparedStatementError.toString
 * @description
 * Creates a well-formatted multi-line string that represents the error.
 *
 * It is called automatically when writing the object into the console.
 *
 * @param {number} [level=0]
 * Nested output level, to provide visual offset.
 *
 * @returns {string}
 */
PreparedStatementError.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap0 = $npm.utils.messageGap(level),
        gap1 = $npm.utils.messageGap(level + 1),
        gap2 = $npm.utils.messageGap(level + 2),
        lines = [
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
