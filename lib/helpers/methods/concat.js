'use strict';

var $npm = {
    format: require('../../formatting').as.format,
    QueryFile: require('../../queryFile')
};

var $arr = require('../../array');

/**
 * @method helpers.concat
 * @description
 * **Added in v.5.3.0**
 *
 * Concatenates multiple queries into a single query string.
 *
 * Before joining any query, the method removes from it all leading and trailing spaces, tabs and semi-colons.
 *
 * @param {array<string|helpers.QueryFormat|QueryFile>} queries
 * Array of mixed-type elements:
 * - a simple query string, to be used as is
 * - a simple {@link helpers.QueryFormat QueryFormat}-like object = `{query, [values], [options]}`
 * - a {@link QueryFile} object
 *
 * @returns {string}
 * Concatenated string with all queries.
 *
 */
function concat(queries) {
    if (!Array.isArray(queries)) {
        throw new TypeError("Parameter 'queries' must be an array.");
    }
    return $arr.map(queries, function (q, index) {
        if (typeof q === 'string') {
            // a simple query string without parameters:
            return clean(q);
        }
        if (q && typeof q === 'object') {
            if (q instanceof $npm.QueryFile) {
                // QueryFile object:
                return clean(q.formatDBType());
            }
            if ('query' in q) {
                // object {query, values} (values is optional):
                return clean($npm.format(q.query, q.values));
            }
        }
        throw new Error('Invalid query element at index ' + index + '.');
    }).join(';');
}

function clean(q) {
    // removes from the query all leading and trailing symbols ' ', '\t' and ';'
    return q.replace(/^[\s;]*|[\s;]*$/g, '');
}

module.exports = concat;

/**
 * @typedef helpers.QueryFormat
 * @description
 * A simple structure of parameters to be passed into method {@link formatting.format as.format} exactly as they are.
 *
 * @property {string|value|object} query
 * A query string or a value/object that implements $[Custom Type Formatting], to be formatted according to `values`.
 *
 * @property {array|object|value} [values]
 * Optional formatting parameters for the query.
 *
 * @property {object} [options]
 * Query formatting options, as supported by method {@link formatting.format as.format}.
 *
 * @see
 * {@link formatting.format as.format}
 */
