'use strict';

var EOL = require('os').EOL;

/*
 * 
 * This type of error should be rejected with when a connection error occurs.
 * 
 * */

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
        value: ConnectionError,
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

