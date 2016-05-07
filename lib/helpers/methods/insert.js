'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.insert
 * @description
 * Generates an `INSERT` query for either one object or an array of objects.
 *
 * @param {Object|Array} data
 * An insert object with properties for insert values, or an array of such objects.
 *
 * When `data` is not a non-null object and not an array, it will throw {@link external:TypeError TypeError} = `Invalid parameter 'data' specified.`
 *
 * And if `data` is an array that contains an invalid insert object, the method will throw {@link external:Error Error} =
 * `Invalid insert object at index N.`
 *
 * @param {Array|helpers.ColumnSet} [columns]
 * Set of columns to be inserted.
 *
 * It is optional when `data` is a single object, and required when `data` is an array of objects. When not specified for an array
 * of objects, the method will throw {@link external:TypeError TypeError} = `Parameter 'columns' is required when inserting multiple records.`
 *
 * When `columns` is not a {@link helpers.ColumnSet ColumnSet} object, a temporary {@link helpers.ColumnSet ColumnSet}
 * is created - from the value of `columns` (if it was specified), or from the value of `data` (if it is not an array).
 *
 * @param {String} [table]
 * Destination table name.
 *
 * It is normally a required parameter. But when `columns` is passed in as a {@link helpers.ColumnSet ColumnSet} object
 * with `table` set in it, that will be used when this parameter isn't specified. When neither is available, the method
 * will throw {@link external:Error Error} = `Table name is unknown.`
 *
 * @returns {String}
 * The resulting query string.
 *
 * @see {@link helpers.ColumnSet ColumnSet}
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
        throw new Error("Table name is unknown.");
    }

    var query = "insert into $1~($2^) values";

    if (capSQL) {
        query = query.toUpperCase();
    }
    
    // TODO: Check if inserting 0 records is possible
    
    var format = $npm.formatting.as.format;
    query = format(query, [table, columns.names]);
    
    if (Array.isArray(data)) {
        return query + data.$map(function (d, index) {
                if (!d || typeof d !== 'object') {
                    throw new Error("Invalid insert object at index " + index + ".");
                }
                return '(' + format(columns.variables, columns.prepare(d)) + ')';
            }).join();
    }
    return query + '(' + format(columns.variables, columns.prepare(data)) + ')';
}

module.exports = insert;
