'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils')
};

/**
 * @class errors.ColumnError
 * @private
 * @augments Error
 * @description
 * ColumnError class, available from the {@link errors} namespace.
 *
 * Represents an error in parsing a column information by class {@link Columns}.
 *
 * @returns {errors.ColumnError}
 * @see Columns
 */
function ColumnError(message, index) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'ColumnError';
    this.stack = temp.stack;
    this.message = message;
    this.index = index;
}

ColumnError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: ColumnError,
        writable: true,
        configurable: true
    }
});

/**
 * @method errors.ColumnError.toString
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
ColumnError.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap0 = $npm.utils.messageGap(level),
        gap1 = $npm.utils.messageGap(level + 1),
        lines = [
            'ColumnError {',
            gap1 + 'message: "' + this.message + '"'
        ];
    if (this.index !== undefined) {
        lines.push(gap1 + 'index: ' + this.index);
    }
    lines.push(gap0 + '}');
    return lines.join($npm.os.EOL);
};

ColumnError.prototype.inspect = function () {
    return this.toString();
};

module.exports = ColumnError;
