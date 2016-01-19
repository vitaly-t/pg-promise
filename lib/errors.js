'use strict';

var EOL = require('os').EOL;

/**
 * @constructor module:errors.QueryResultError
 * @augments Error
 * @summary Query Result Error type.
 * @description
 * Thrown when a query result doesn't match its Query Result Mask.
 */
function QueryResultError() {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'QueryResultError';
    this.stack = temp.stack;
    this.message = temp.message;
}

QueryResultError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: QueryResultError,
        writable: true,
        configurable: true
    }
});

// well-formatted output when passed into console.log();
QueryResultError.prototype.inspect = function () {
    return this.stack;
};

/**
 * @constructor module:errors.SQLParsingError
 * @augments Error
 * @summary SQL Parsing Error type.
 * @description
 * Represents a failure to parse an external SQL file.
 */
function SQLParsingError(error, file, pos) {
    var temp = Error.apply(this, arguments);
    temp.name = this.name = 'SQLParsingError';
    this.stack = temp.stack;
    this.message = "SQL Parsing Error: " + error + EOL + file + " at {line:" + pos.line + ",col:" + pos.col + "}";
}

SQLParsingError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: SQLParsingError,
        writable: true,
        configurable: true
    }
});

// well-formatted output when passed into console.log();
SQLParsingError.prototype.inspect = function () {
    return this.message + EOL + EOL + this.stack;
};

/**
 * Custom Errors
 * @module errors
 * @author Vitaly Tomilov
 */
module.exports = {
    QueryResultError: QueryResultError,
    SQLParsingError: SQLParsingError
};
