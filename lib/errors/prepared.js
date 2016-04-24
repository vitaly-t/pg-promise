'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    QueryFileError: require('./queryFile'),
};

/**
 *
 * @constructor
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
