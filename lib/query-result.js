/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

/**
 * @enum {number}
 * @alias queryResult
 * @readonly
 * @description
 * **Query Result Mask**
 *
 * Binary mask that represents the result expected from queries.
 * It is used by the base {@link Database#query query} method, as well as method {@link Database#func func}.
 *
 * The mask is always the last optional parameter, which defaults to `queryResult.any`.
 *
 * Any combination of flags is supported, except for `one + many`.
 *
 * The type is available from the library's root: `pgp.queryResult`.
 *
 * @see {@link Database#query Database.query}, {@link Database#func Database.func}
 */
const queryResult = {
    /** Single row is expected, to be resolved as a single row-object. */
    one: 1,
    /** One or more rows expected, to be resolved as an array with at least 1 row-object. */
    many: 2,
    /** Expecting no rows, to be resolved with `null`. */
    none: 4,
    /** `many|none` - any result is expected, to be resolved with an array of rows-objects. */
    any: 6
};

module.exports = {queryResult};
