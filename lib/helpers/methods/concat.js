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
 * @param {array<string|helpers.QueryObject|QueryFile>} queries
 * Array of mixed-type elements:
 * - a simple query string, to be used as is
 * - a simple {@link helpers.QueryObject QueryObject} = `{query, values}` (`values` is optional)
 * - a {@link QueryFile} object
 *
 * @returns {string}
 * Resulting query string.
 *
 */
// istanbul ignore next;
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

// istanbul ignore next;
function clean(q) {
    // removes from the query all leading and trailing symbols ' ', '\t' and ';'
    return q.replace(/^[\s;]*|[\s;]*$/g, '');
}

module.exports = concat;

/**
 * @typedef helpers.QueryObject
 * @description
 * A simple structure that describes a query with optional formatting parameters.
 *
 * @property {string|QueryFile} query
 * Query string or a {@link QueryFile} object.
 *
 * @property {string} [values]
 * Optional formatting parameters for the query.
 *
 */
