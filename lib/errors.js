'use strict';

/**
 * @constructor QueryResultError
 * @augments Error
 * @summary Query Result Error type.
 * @description
 *
 * This error is specified as the rejection reason for all result-specific methods
 * when the result doesn't match the expectation, i.e. when a query result doesn't
 * match its Query Result Mask - the value of {@link queryResult}.
 *
 * The error applies to the result from the following methods: {@link Database.none none},
 * {@link Database.one one}, {@link Database.oneOrNone oneOrNone} and {@link Database.many many}.
 *
 * Supported errors:
 *
 * - `No return data was expected.`, method {@link Database.none none}
 * - `No data returned from the query.`, methods {@link Database.one one} and {@link Database.many many}
 * - `Multiple rows were not expected.`, methods {@link Database.one one} and {@link Database.oneOrNone oneOrNone}
 *
 * Like any other error, this one is notified with through the global event {@link event:error error}.
 *
 * The type is available from the library's root: `pgp.QueryResultError`.
 *
 * @example
 *
 * var options = {
 *
 *   // pg-promise initialization options...
 *
 *   error: function (err, e) {
 *       if (err instanceof pgp.QueryResultError) {
 *           // A query returned unexpected number of records, and thus rejected;
 *           // See: err, e.query, e.params, etc.
 *       }
 *   }
 * };
 *
 * @see
 * {@link queryResult}, {@link Database.none none}, {@link Database.one one},
 * {@link Database.oneOrNone oneOrNone}, {@link Database.many many}
 *
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

module.exports = {
    QueryResultError: QueryResultError
};
