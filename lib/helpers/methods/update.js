'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.update
 * @description
 * Generates an `UPDATE` query from an object, using its properties as update values.
 *
 * @param {Object|Array} data
 * Object with properties for update values, or an array of such objects.
 *
 * @param {Array|helpers.ColumnSet} [columns]
 * Columns to be updated.
 *
 * It is optional when updating a single object, but required when updating multiple objects.
 *
 * @param {String} table
 * Name of the table to be updated.
 *
 * @returns {string}
 * The resulting query string.
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
        throw new TypeError("Table name is unknown.");
    }

    if (!columns.columns.length) {
        throw new TypeError("Cannot generate a valid UPDATE without any columns.");
    }

    var f = $npm.formatting.as.format;

    if (Array.isArray(data)) {
        // Multi-update, as per:
        // http://stackoverflow.com/questions/18797608/update-multiple-rows-in-same-query-using-postgresql
        // The result is partial, requires a WHEN to be appended.
        var targetAlias = 't', valuesAlias = 'v';
        if (options) {
            if (typeof options.targetAlias === 'string') {
                targetAlias = options.targetAlias;
            }
            if (typeof options.valuesAlias === 'string') {
                valuesAlias = options.valuesAlias;
            }
        }
        
        var query = "update $1~ as $2^ set $3^ from (values$4^) as $5^($6^)";
        if (capSQL) {
            query = query.toUpperCase();
        }
        
        var targetCols = columns.columns.$map(function (c) {
            return c.escapedName + '=' + valuesAlias + '.' + c.escapedName;
        }).join(',');
        
        var values = data.$map(function (o) {
            return '(' + f(columns.variables, columns.prepare(o)) + ')';
        }).join(',');
        
        return f(query, [table, targetAlias, targetCols, values, valuesAlias, columns.names]);
    }

    var query = "update $1~ set ";
    if (capSQL) {
        query = query.toUpperCase();
    }
    return f(query, table) + f(columns.updates, columns.prepare(data));

}

module.exports = update;
