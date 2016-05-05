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

    // It is possible to implement multi-update, see:
    // http://stackoverflow.com/questions/18797608/update-multiple-rows-in-same-query-using-postgresql
    // But it requires 2 variables in the midst to be passed in, plus it is no good without a WHEN
    // statement, which can be of any complexity.
    // If it is worth doing at all, then perhaps as a separate method, like 'multiUpdate'.

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

    if (!table) {
        throw new TypeError("Unknown table name.");
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
