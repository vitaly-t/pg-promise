'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.update
 * @description
 * Generates an `UPDATE` query for either one object or an array of objects.
 *
 * @param {Object|Array} data
 * An update object with properties for update values, or an array of such objects.
 *
 * When `data` is not a non-null object and not an array, it will throw {@link external:TypeError TypeError} = `Invalid parameter 'data' specified.`
 *
 * And if `data` is an array that contains an invalid update object, the method will throw {@link external:Error Error} =
 * `Invalid update object at index N.`
 *
 * @param {Array|helpers.Column|helpers.ColumnSet} [columns]
 * Set of columns to be updated.
 *
 * It is optional when `data` is a single object, and required when `data` is an array of objects. When not specified for an array
 * of objects, the method will throw {@link external:TypeError TypeError} = `Parameter 'columns' is required when updating multiple records.`
 *
 * When `columns` is not a {@link helpers.ColumnSet ColumnSet} object, a temporary {@link helpers.ColumnSet ColumnSet}
 * is created - from the value of `columns` (if it was specified), or from the value of `data` (if it is not an array).
 *
 * When the final {@link helpers.ColumnSet ColumnSet} is empty (no columns in it), it will throw
 * {@link external:Error Error} = `Cannot generate a valid UPDATE without any columns.`
 *
 * @param {String} [table]
 * Name of the table to be updated.
 *
 * It is normally a required parameter. But when `columns` is passed in as a {@link helpers.ColumnSet ColumnSet} object
 * with `table` set in it, that will be used when this parameter isn't specified. When neither is available, the method
 * will throw {@link external:Error Error} = `Table name is unknown.`
 *
 * @param {Object} [options]
 * An object with formatting options for multi-object updates. Passing in a non-null value that's not an object will
 * throw {@link external:TypeError TypeError} = `Invalid parameter 'options' specified.`
 *
 * @param {String} [options.tableAlias=t]
 * Name of the SQL variable that represents the destination table. It is used only for multi-object updates.
 *
 * @param {String} [options.valueAlias=v]
 * Name of the SQL variable that represents the values. It is used only for multi-object updates.
 *
 * @returns {String}
 * The resulting query string.
 *
 * @see {@link helpers.ColumnSet ColumnSet}
 */
function update(data, columns, table, options, capSQL) {

    if (!data || typeof data !== 'object') {
        throw new TypeError("Invalid parameter 'data' specified.");
    }
    
    if (columns instanceof $npm.ColumnSet) {
        if ($npm.utils.isNull(table)) {
            table = columns.table;
        }
    } else {
        if (Array.isArray(data) && $npm.utils.isNull(columns)) {
            throw new TypeError("Parameter 'columns' is required when updating multiple records.");
        }
        columns = new $npm.ColumnSet(columns || data);
    }

    if (!$npm.utils.isNull(options) && typeof options !== 'object') {
        throw new TypeError("Invalid parameter 'options' specified.");
    }

    if (!table) {
        throw new Error("Table name is unknown.");
    }

    if (!columns.columns.length) {
        throw new Error("Cannot generate a valid UPDATE without any columns.");
    }

    var format = $npm.formatting.as.format;

    if (Array.isArray(data)) {
        // Multi-update, as per:
        // http://stackoverflow.com/questions/18797608/update-multiple-rows-in-same-query-using-postgresql
        // The result is partial, requires a WHEN to be appended.
        var tableAlias = 't', valueAlias = 'v';
        if (options) {
            if (options.tableAlias) {
                tableAlias = options.tableAlias.toString();
            }
            if (options.valueAlias) {
                valueAlias = options.valueAlias.toString();
            }
        }

        var query = "update $1~ as $2^ set $3^ from (values$4^) as $5^($6^)";
        if (capSQL) {
            query = query.toUpperCase();
        }

        var targetCols = columns.columns.$map(function (c) {
            return c.escapedName + '=' + valueAlias + '.' + c.escapedName;
        }).join();

        var values = data.$map(function (d, index) {
            if (!d || typeof d !== 'object') {
                throw new Error("Invalid update object at index " + index + ".");
            }
            return '(' + format(columns.variables, columns.prepare(d)) + ')';
        }).join();

        return format(query, [table, tableAlias, targetCols, values, valueAlias, columns.names]);
    }

    var query = "update $1~ set ";
    if (capSQL) {
        query = query.toUpperCase();
    }
    return format(query, table) + format(columns.updates, columns.prepare(data));

}

module.exports = update;
