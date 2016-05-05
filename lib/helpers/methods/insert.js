'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.insert
 * @private
 * @description
 * Generates a complete `INSERT` query from an object, using its properties as insert values.
 *
 * @param {String} table
 * Destination table name.
 *
 * Passing in anything other than a non-empty string will throw {@link external:TypeError TypeError} =
 * `Parameter 'table' must be a non-empty text string.`
 *
 * @param {Object} obj
 * Object with properties for insert values.
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
 *
 * @example
 *
 * // Default usage
 *
 * var obj = {
 *    one: 123,
 *    two: 'test'
 * };
 *
 * var query = pgp.helpers.insert('myTable', obj);
 * //=> INSERT INTO "myTable"("one","two") VALUES(123,'test')
 *
 * @example
 *
 * // Advanced usage, with `exclude` and `defaults`
 *
 * var obj = {
 *     zero: 0,
 *     one: 1,
 *     two: undefined,
 *     // `three` is missing
 *     four: true
 * };
 *
 * var query = pgp.helpers.insert('myTable', obj, {
 *     exclude: 'zero', // exclude property `zero`
 *     defaults: {
 *         one: 123, // use `one` = 123, if missing;
 *         three: 555, // use `three` = 555, if missing;
 *         two: function (value) {
 *             // set `two` = `second`, if it is `undefined`,
 *             // or else keep the current value:
 *             return value === undefined ? 'second' : value;
 *         },
 *         four: function (value) {
 *             // if `one` is equal 1, set `four` to `false`,
 *             // or else keep the current value:
 *             return this.one === 1 ? false : value;
 *         }
 *     }
 * });
 * //=> INSERT INTO "myTable"("one","two","four","three") VALUES(1,'second',false,555)
 *
 */
function insert(table, cols, obj, capSQL) {
    if (cols instanceof $npm.ColumnSet) {
        if (!table) {
            table = cols.table;
        }
        checkTable();
    } else {
        checkTable();
        if (!obj || (typeof obj !== 'object' && !Array.isArray(obj))) {
            throw new TypeError("Parameter 'obj' must be a non-null object or array.");
        }
        cols = new $npm.ColumnSet(cols, obj);
    }
    function checkTable() {
        if (!$npm.utils.isText(table)) {
            throw new TypeError("Unknown table name.");
        }
    }

    var query = "insert into $1~($2^) values";

    if (capSQL) {
        query = query.toUpperCase();
    }

    var fm = $npm.formatting.as.format;

    if (Array.isArray(obj)) {
        var values = obj.map(function (o) {
            return '(' + fm(cols.variables, cols.prepare(o)) + ')';
        }).join(',');
        return fm(query + '$3^', [table, cols.names, values]);
    } else {
        var values = fm(cols.variables, cols.prepare(obj));
        return fm(query + '($3^)', [table, cols.names, values]);
    }
}

module.exports = insert;
