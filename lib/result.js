'use strict';

/**
 * @enum {Number}
 * @alias queryResult
 * @readonly
 * @summary Query Result Mask.
 * @description
 * Binary mask that represents the result expected from queries.
 * It is used in the generic {@link module:pg-promise.Database#query query} method,
 * as well as method {@link module:pg-promise.Database#func func}.
 *
 * The mask is always the last optional parameter, which defaults to `queryResult.any`.
 *
 * Any combination of flags is supported, except for `one + many`.
 *
 * The type is available from the library's root: `pgp.queryResult`.
 *
 * @see {@link module:pg-promise.Database#query query}, {@link module:pg-promise.Database#func func}
 */
var queryResult = {
    /** Single row is expected. */
    one: 1,
    /** One or more rows expected. */
    many: 2,
    /** Expecting no rows. */
    none: 4,
    /** many|none - any result is expected. */
    any: 6
};

module.exports = queryResult;
