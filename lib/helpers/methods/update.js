'use strict';

var $npm = {
    TableName: require('../tableName'),
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

var $arr = require('../../array');

/**
 * @method helpers.update
 * @description
 * Generates a simplified `UPDATE` query for either one object or an array of objects.
 *
 * The resulting query needs a `WHERE` clause to be appended to it, to determine the update logic.
 * This is to allow for update conditions of any complexity that are easy to add.
 *
 * @param {object|object[]} data
 * An update object with properties for update values, or an array of such objects.
 *
 * When `data` is not a non-null object and not an array, it will throw {@link external:TypeError TypeError} = `Invalid parameter 'data' specified.`
 *
 * When `data` is an empty array, it will throw {@link external:TypeError TypeError} = `Cannot generate an UPDATE from an empty array.`
 *
 * When `data` is an array that contains a non-object value, the method will throw {@link external:Error Error} =
 * `Invalid update object at index N.`
 *
 * @param {array|helpers.Column|helpers.ColumnSet} [columns]
 * Set of columns to be updated.
 *
 * It is optional when `data` is a single object, and required when `data` is an array of objects. If not specified for an array
 * of objects, the method will throw {@link external:TypeError TypeError} = `Parameter 'columns' is required when updating multiple records.`
 *
 * When `columns` is not a {@link helpers.ColumnSet ColumnSet} object, a temporary {@link helpers.ColumnSet ColumnSet}
 * is created - from the value of `columns` (if it was specified), or from the value of `data` (if it is not an array).
 *
 * When the final {@link helpers.ColumnSet ColumnSet} is empty (no columns in it), the method will throw
 * {@link external:Error Error} = `Cannot generate an UPDATE without any columns.` (see also {@link helpers.ColumnSet.canGenerate ColumnSet.canGenerate})
 *
 * @param {helpers.TableName|string|{table,schema}} [table]
 * Table to be updated.
 *
 * It is normally a required parameter. But when `columns` is passed in as a {@link helpers.ColumnSet ColumnSet} object
 * with `table` set in it, that will be used when this parameter isn't specified. When neither is available, the method
 * will throw {@link external:Error Error} = `Table name is unknown.`
 *
 * @param {object} [options]
 * An object with formatting options for multi-row `UPDATE` queries.
 *
 * @param {string} [options.tableAlias=t]
 * Name of the SQL variable that represents the destination table.
 *
 * @param {string} [options.valueAlias=v]
 * Name of the SQL variable that represents the values.
 *
 * @returns {string}
 * The resulting query string that typically needs a `WHERE` condition appended.
 *
 * @see
 *  {@link helpers.Column Column},
 *  {@link helpers.ColumnSet ColumnSet},
 *  {@link helpers.TableName TableName}
 *
 * @example
 *
 * var pgp = require('pg-promise')({
 *    capSQL: true // if you want all generated SQL capitalized
 * });
 *
 * var dataSingle = {id: 1, val: 123, msg: 'hello'};
 * var dataMulti = [{id: 1, val: 123, msg: 'hello'}, {id: 2, val: 456, msg: 'world!'}];
 *
 * // Although column details can be taken from the data object, it is not
 * // a likely scenario for an update, unless updating the whole table:
 *
 * pgp.helpers.update(dataSingle, null, 'my-table');
 * //=> UPDATE "my-table" SET "id"=1,"val"=123,"msg"='hello'
 *
 * @example
 *
 * // A typical single-object update:
 *
 * pgp.helpers.update(dataSingle, ['val', 'msg'], 'my-table') + ' WHERE id = ' + dataSingle.id;
 * //=> UPDATE "my-table" SET "val"=123,"msg"='hello' WHERE id = 1
 *
 * @example
 *
 * // Column details are required for a multi-row `UPDATE`;
 * // Adding '?' in front of a column name means it is only for a WHERE condition:
 *
 * pgp.helpers.update(dataMulti, ['?id', 'val', 'msg'], 'my-table') + ' WHERE v.id = t.id';
 * //=> UPDATE "my-table" AS t SET "val"=v."val","msg"=v."msg" FROM (VALUES(1,123,'hello'),(2,456,'world!'))
 * //   AS v("id","val","msg") WHERE v.id = t.id
 *
 * @example
 *
 * // Column details from a reusable ColumnSet (recommended for performance):
 *
 * var cs = new pgp.helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'my-table'});
 *
 * pgp.helpers.update(dataMulti, cs) + ' WHERE v.id = t.id';
 * //=> UPDATE "my-table" AS t SET "val"=v."val","msg"=v."msg" FROM (VALUES(1,123,'hello'),(2,456,'world!'))
 * //   AS v("id","val","msg") WHERE v.id = t.id
 *
 * @example
 *
 * // Using parameter `options` to change the default alias names:
 *
 * pgp.helpers.update(dataMulti, cs, null, {tableAlias: 'X', valueAlias: 'Y'}) + ' WHERE Y.id = X.id';
 * //=> UPDATE "my-table" AS X SET "val"=Y."val","msg"=Y."msg" FROM (VALUES(1,123,'hello'),(2,456,'world!'))
 * //   AS Y("id","val","msg") WHERE Y.id = X.id
 *
 */
function update(data, columns, table, options, capSQL) {

    if (!data || typeof data !== 'object') {
        throw new TypeError('Invalid parameter \'data\' specified.');
    }

    var isArray = Array.isArray(data);

    if (isArray && !data.length) {
        throw new TypeError('Cannot generate an UPDATE from an empty array.');
    }

    if (columns instanceof $npm.ColumnSet) {
        if ($npm.utils.isNull(table)) {
            table = columns.table;
        }
    } else {
        if (isArray && $npm.utils.isNull(columns)) {
            throw new TypeError('Parameter \'columns\' is required when updating multiple records.');
        }
        columns = new $npm.ColumnSet(columns || data);
    }

    var format = $npm.formatting.as.format;

    if (isArray) {
        var tableAlias = 't', valueAlias = 'v';
        if (options && typeof options === 'object') {
            if (options.tableAlias && typeof options.tableAlias === 'string') {
                tableAlias = options.tableAlias;
            }
            if (options.valueAlias && typeof options.valueAlias === 'string') {
                valueAlias = options.valueAlias;
            }
        }

        var q = capSQL ? sql.multi.capCase : sql.multi.lowCase;

        var actualColumns = $arr.filter(columns.columns, c => !c.cnd);

        checkColumns(actualColumns);
        checkTable();

        var targetCols = $arr.map(actualColumns, c => c.escapedName + '=' + valueAlias + '.' + c.escapedName).join();

        var values = $arr.map(data, (d, index) => {
            if (!d || typeof d !== 'object') {
                throw new Error('Invalid update object at index ' + index + '.');
            }
            return '(' + format(columns.variables, columns.prepare(d)) + ')';
        }).join();

        return format(q, [table.name, tableAlias, targetCols, values, valueAlias, columns.names]);
    }

    var updates = columns.assign(data);

    checkColumns(updates);
    checkTable();

    var query = capSQL ? sql.single.capCase : sql.single.lowCase;

    return format(query, table.name) + format(updates, columns.prepare(data));

    function checkTable() {
        if (table && !(table instanceof $npm.TableName)) {
            table = new $npm.TableName(table);
        }
        if (!table) {
            throw new Error('Table name is unknown.');
        }
    }

    function checkColumns(cols) {
        if (!cols.length) {
            throw new Error('Cannot generate an UPDATE without any columns.');
        }
    }
}

var sql = {
    single: {
        lowCase: 'update $1^ set ',
        capCase: 'UPDATE $1^ SET '
    },
    multi: {
        lowCase: 'update $1^ as $2^ set $3^ from (values$4^) as $5^($6^)',
        capCase: 'UPDATE $1^ AS $2^ SET $3^ FROM (VALUES$4^) AS $5^($6^)'
    }
};

module.exports = update;
