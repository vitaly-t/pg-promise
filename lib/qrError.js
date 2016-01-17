'use strict';

/**
 * @constructor module:error.QueryResultError
 * @augments Error
 * @summary Query Result Error type.
 * @description
 * Custom error used as a rejection reason when a query
 * result doesn't match the specified Query Result Mask.
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
 * Query Result Error
 * @module error
 * @author Vitaly Tomilov
 */
module.exports = QueryResultError;
