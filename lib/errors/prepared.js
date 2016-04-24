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
 * 
 * The type is available from the {@link errors} namespace.
 * 
 */
function PreparedStatementError(error) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'PreparedStatementError';
    this.stack = temp.stack;
    if (error instanceof $npm.QueryFileError) {
        this.error = error;
        this.message = "Failed to initialize 'text' from a QueryFile.";
    } else {
        this.message = error;
    }
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
 * @param {Number} [level]
 * Nested error level, to provide visual offset.
 *
 * @returns {string}
 */
PreparedStatementError.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap = $npm.utils.messageGap(level + 1);
    var lines = [
        'PreparedStatementError {',
        gap + 'message: "' + this.message + '"'
    ];
    if (this.error) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    }
    lines.push($npm.utils.messageGap(level) + '}');
    return lines.join($npm.os.EOL);
};

PreparedStatementError.prototype.inspect = function () {
    return this.toString();
};

module.exports = PreparedStatementError;
