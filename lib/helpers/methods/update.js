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
function update(table, cols, obj, capSQL) {

    if (cols instanceof $npm.ColumnSet) {
        if (!table) {
            table = cols.table;
        }
        checkTable();
    } else {
        checkTable();
        if (!obj || typeof obj !== 'object') {
            throw new TypeError("Parameter 'obj' must be a non-null object.");
        }
        cols = new $npm.ColumnSet(cols, obj);
    }
    function checkTable() {
        if (!$npm.utils.isText(table)) {
            throw new TypeError("Unknown table name.");
        }
    }

    if (!cols.columns.length) {
        throw new TypeError("Cannot generate a valid UPDATE without any fields.");
    }

    var query = "update $1~ set ";

    if (capSQL) {
        query = query.toUpperCase();
    }

    var fm = $npm.formatting.as.format;
    query = fm(query, table);
    return query + fm(cols.updates, cols.prepare(obj));
}

module.exports = update;
