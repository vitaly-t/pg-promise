'use strict';

var EOL = require('os').EOL;

/**
 *
 * @constructor
 */
function PreparedStatementError(message) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'PreparedStatementError';
    this.stack = temp.stack;
    this.message = message;
}

PreparedStatementError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: PreparedStatementError,
        writable: true,
        configurable: true
    }
});

PreparedStatementError.prototype.toString = function () {
    return "PreparedStatementError {" + EOL + '    ' + this.message + EOL + '}';
};

PreparedStatementError.prototype.inspect = function () {
    return this.toString();
};

module.exports = PreparedStatementError;

