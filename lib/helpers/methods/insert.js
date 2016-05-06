'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.insert
 * @description
 * Generates an `INSERT` query from an object, using its properties as insert values.
 *
 * @param {Object|Array} data
 * Object with properties for insert values, or an array of such objects.
 *
 * @param {Array|helpers.ColumnSet} [columns]
 * Columns to be inserted.
 *
 * It is optional when inserting a single object, but required when inserting multiple objects.
 *
 * @param {String} [table]
 * Destination table name.
 *
 * @returns {String}
 * The resulting query string.
 */
function insert(data, columns, table, capSQL) {

    if (!data || typeof data !== 'object') {
        throw new TypeError("Invalid parameter 'data' specified.");
    }

    if (columns instanceof $npm.ColumnSet) {
        if ($npm.utils.isNull(table)) {
            table = columns.table;
        }
    } else {
        if (Array.isArray(data) && $npm.utils.isNull(columns)) {
            throw new TypeError("Parameter 'columns' is required when inserting multiple records.");
        }
        columns = new $npm.ColumnSet(columns || data);
    }

    if (!table) {
        throw new TypeError("Table name is unknown.");
    }

    var query = "insert into $1~($2^) values";

    if (capSQL) {
        query = query.toUpperCase();
    }

    var f = $npm.formatting.as.format;
    query = f(query, [table, columns.names]);

    if (Array.isArray(data)) {
        return query + data.$map(function (o) {
                return '(' + f(columns.variables, columns.prepare(o)) + ')';
            }).join(',');
    }
    return query + '(' + f(columns.variables, columns.prepare(data)) + ')';
}

module.exports = insert;
