'use strict';

/**
 * @enum {number}
 * @alias queryResult
 * @readonly
 * @description
 * _Query Result Mask._
 *
 * Binary mask that represents the result expected from queries.
 * It is used in the generic {@link Database.query query} method,
 * as well as method {@link Database.func func}.
 *
 * The mask is always the last optional parameter, which defaults to `queryResult.any`.
 *
 * Any combination of flags is supported, except for `one + many`.
 *
 * The type is available from the library's root: `pgp.queryResult`.
 *
 * @see {@link Database.query}, {@link Database.func}
 */
const queryResult = {
    /** Single row is expected. */
    one: 1,
    /** One or more rows expected. */
    many: 2,
    /** Expecting no rows. */
    none: 4,
    /** `many|none` - any result is expected. */
    any: 6
};

Object.freeze(queryResult);

module.exports = queryResult;
