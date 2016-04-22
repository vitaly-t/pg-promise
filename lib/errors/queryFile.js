'use strict';

var EOL = require('os').EOL;

/**
 *
 * @constructor
 */
function QueryFileError(message) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'QueryFileError';
    this.stack = temp.stack;
    this.message = message;
}

QueryFileError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: QueryFileError,
        writable: true,
        configurable: true
    }
});

QueryFileError.prototype.toString = function () {
    return "QueryFileError {" + EOL + '    ' + this.message + EOL + '}';
};

QueryFileError.prototype.inspect = function () {
    return this.toString();
};

module.exports = QueryFileError;

