'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.insert
 * @description
 * Generates a complete `INSERT` query from an object, using its properties as insert values.
 *
 * @param {Object|Array} data
 * Object with properties for insert values, or an array of.
 *
 * @param {helpers.ColumnSet} columns
 *
 * @param {String} table
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
        columns = new $npm.ColumnSet(columns || data);
    }

    if (!table) {
        throw new TypeError("Unknown table name.");
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
