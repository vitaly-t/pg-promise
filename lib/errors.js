'use strict';

/**
 * @constructor errors.QueryResultError
 * @augments Error
 * @summary Query Result Error type.
 * @description
 * Thrown when a query result doesn't match its Query Result Mask.
 *
 * The type is available from the library's root: `pgp.QueryResultError`.
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
 * @namespace errors
 */
module.exports = {
    QueryResultError: QueryResultError
};
