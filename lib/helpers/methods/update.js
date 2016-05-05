'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.update
 * @private
 * @description
 * Generates a complete `UPDATE` query from an object, using its properties as update values.
 *
 * @param {String} table
 * Name of the table to be updated.
 *
 * Passing in anything other than a non-empty string will throw {@link external:TypeError TypeError} =
 * `Parameter 'table' must be a non-empty text string.`
 *
 * @param {Object} obj
 * Object with properties for update values.
 *
 * Passing in anything other than a non-null object will throw {@link external:TypeError TypeError} =
 * `Parameter 'obj' must be a non-null object.`
 *
 * @param {helpers.propertyOptions} [options]
 * An object with optional parameters.
 *
 * Passing in anything other than a non-null object will be ignored.
 *
 * @returns {string}
 * The resulting query string.
 */
function update(columns, obj, table, capSQL) {

    if (columns instanceof $npm.ColumnSet) {
        if ($npm.utils.isNull(table)) {
            table = columns.table;
        }
    } else {
        columns = new $npm.ColumnSet(columns || obj);
        if (!obj || typeof obj !== 'object') {
            throw new TypeError("Invalid parameter 'obj' specified.");
        }
    }

    if (!columns.columns.length) {
        throw new TypeError("Cannot generate a valid UPDATE without any columns.");
    }

    var query = "update $1~ set ";

    if (capSQL) {
        query = query.toUpperCase();
    }

    var fm = $npm.formatting.as.format;
    query = fm(query, table);
    return query + fm(columns.updates, columns.prepare(obj));
}

module.exports = update;
