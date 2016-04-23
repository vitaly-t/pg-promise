'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    minify: require('pg-minify')
};

/**
 *
 * @constructor
 */
function QueryFileError(file, error) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'QueryFileError';
    this.stack = temp.stack;
    if (error instanceof $npm.minify.SQLParsingError) {
        this.error = error;
        this.message = "Failed to parse the SQL.";
    } else {
        this.message = error.message;
    }
    this.file = file;
}

QueryFileError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: QueryFileError,
        writable: true,
        configurable: true
    }
});

QueryFileError.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap = $npm.utils.messageGap(level + 1);
    var lines = [
        'QueryFileError {',
        gap + 'message: "' + this.message + '"',
        gap + 'file: "' + this.file + '"'
    ];
    if (this.error) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    }
    lines.push($npm.utils.messageGap(level) + '}');
    return lines.join($npm.os.EOL);
};

QueryFileError.prototype.inspect = function () {
    return this.toString();
};

module.exports = QueryFileError;

