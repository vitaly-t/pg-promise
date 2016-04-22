'use strict';

var EOL = require('os').EOL;

/**
 *
 * @constructor
 */
function ConnectionError(message) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'ConnectionError';
    this.stack = temp.stack;
    this.message = message;
}

ConnectionError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: QueryFileError,
        writable: true,
        configurable: true
    }
});

ConnectionError.prototype.toString = function () {
    return "ConnectionError {" + EOL + '    ' + this.message + EOL + '}';
};

ConnectionError.prototype.inspect = function () {
    return this.toString();
};

module.exports = ConnectionError;

