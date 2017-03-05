'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting'),
    TableName: require('./tableName'),
    Column: require('./column')
};

var $arr = require('../array');

/**
 * @class helpers.ColumnSet
 * @description
 *
 * Performance-optimized, read-only structure with query-formatting columns.
 *
 * For performance-oriented applications this type should be created globally, to be reused by all methods.
 *
 * @param {object|helpers.Column|array} columns
 * Columns information object, depending on the type:
 *
 * - When it is a simple object, its properties are enumerated to represent both column names and property names
 *   within the source objects. See also option `inherit` that's applicable in this case.
 *
 * - When it is a single {@link helpers.Column Column} object, property {@link helpers.ColumnSet#columns columns} is initialized with
 *   just a single column. It is not a unique situation when only a single column is required for an update operation.
 *
 * - When it is an array, each element is assumed to represent details for a column. If the element is already of type {@link helpers.Column Column},
 *   it is used directly; otherwise the element is passed into {@link helpers.Column Column} constructor for initialization.
 *   On any duplicate column name (case-sensitive) it will throw {@link external:Error Error} = `Duplicate column name "name".`
 *
 * - When it is none of the above, it will throw {@link external:TypeError TypeError} = `Invalid parameter 'columns' specified.`
 *
 * @param {object} [options]
 *
 * @param {helpers.TableName|string|{table,schema}} [options.table]
 * Table details.
 *
 * When it is a non-null value, and not a {@link helpers.TableName TableName} object, a new {@link helpers.TableName TableName} is constructed from the value.
 *
 * It can be used as the default for methods {@link helpers.insert insert} and {@link helpers.update update} when their parameter
 * `table` is omitted, and for logging purposes.
 *
 * @param {boolean} [options.inherit = false]
 * Use inherited properties in addition to the object's own properties.
 *
 * By default, only the object's own properties are enumerated for column names.
 *
 * @returns {helpers.ColumnSet}
 *
 * @see
 *
 * {@link helpers.ColumnSet#columns columns},
 * {@link helpers.ColumnSet#names names},
 * {@link helpers.ColumnSet#table table},
 * {@link helpers.ColumnSet#variables variables} |
 * {@link helpers.ColumnSet.extend extend},
 * {@link helpers.ColumnSet.merge merge},
 * {@link helpers.ColumnSet.prepare prepare}
 *
 * @example
 *
 * // A complex insert/update object scenario for table 'purchases' in schema 'fiscal'.
 * // For a good performance, you should declare such objects once and then reuse them.
 * //
 * // Column Requirements:
 * //
 * // 1. Property 'id' is only to be used for a WHERE condition in updates
 * // 2. Property 'list' needs to be formatted as a csv
 * // 3. Property 'code' is to be used as raw text, and to be defaulted to 0 when the
 * //    property is missing in the source object
 * // 4. Property 'log' is a JSON object with 'log-entry' for the column name
 * // 5. Property 'data' requires SQL type casting '::int[]'
 * // 6. Property 'amount' needs to be set to 100, if it is 0
 * // 7. Property 'total' must be skipped during updates, if 'amount' was 0, plus its
 * //    column name is 'total-val'
 *
 * var cs = new pgp.helpers.ColumnSet([
 *     '?id', // ColumnConfig equivalent: {name: 'id', cnd: true}
 *     'list:csv', // ColumnConfig equivalent: {name: 'list', mod: ':csv'}
 *     {
 *         name: 'code',
 *         mod: '^', // format as raw text
 *         def: 0 // default to 0 when the property doesn't exist
 *     },
 *     {
 *         name: 'log-entry',
 *         prop: 'log',
 *         mod: ':json' // format as JSON
 *     },
 *     {
 *         name: 'data',
 *         cast: 'int[]' // use SQL type casting '::int[]'
 *     },
 *     {
 *         name: 'amount',
 *         init: col => {
 *             // set to 100, if the value is 0:
 *             return col.value === 0 ? 100 : col.value;
 *         }
 *     },
 *     {
 *         name: 'total-val',
 *         prop: 'total',
 *         skip: col => {
 *             // skip from updates, if 'amount' is 0:
 *             return col.source.amount === 0;
 *         }
 *     }
 * ], {table: {table: 'purchases', schema: 'fiscal'}});
 *
 * // Alternatively, you could take the table declaration out:
 * // var table = new pgp.helpers.TableName('purchases', 'fiscal');
 *
 * console.log(cs); // console output for the object:
 * //=>
 * // ColumnSet {
 * //    table: "fiscal"."purchases"
 * //    columns: [
 * //        Column {
 * //            name: "id"
 * //            cnd: true
 * //        }
 * //        Column {
 * //            name: "list"
 * //            mod: ":csv"
 * //        }
 * //        Column {
 * //            name: "code"
 * //            mod: "^"
 * //            def: 0
 * //        }
 * //        Column {
 * //            name: "log-entry"
 * //            prop: "log"
 * //            mod: ":json"
 * //        }
 * //        Column {
 * //            name: "data"
 * //            cast: "int[]"
 * //        }
 * //        Column {
 * //            name: "amount"
 * //            init: [Function]
 * //        }
 * //        Column {
 * //            name: "total-val"
 * //            prop: "total"
 * //            skip: [Function]
 * //        }
 * //    ]
 * // }
 */
function ColumnSet(columns, options) {

    if (!(this instanceof ColumnSet)) {
        return new ColumnSet(columns, options);
    }

    if (!columns || typeof columns !== 'object') {
        throw new TypeError('Invalid parameter \'columns\' specified.');
    }

    var inherit, names, variables, updates, isSimple = true;

    if (!$npm.utils.isNull(options)) {
        if (typeof options !== 'object') {
            throw new TypeError('Invalid parameter \'options\' specified.');
        }
        if (!$npm.utils.isNull(options.table)) {
            if (options.table instanceof $npm.TableName) {
                this.table = options.table;
            } else {
                this.table = new $npm.TableName(options.table);
            }
        }
        inherit = options.inherit;
    }

    /**
     * @name helpers.ColumnSet#table
     * @type {helpers.TableName}
     * @readonly
     * @description
     * Destination table. It can be specified for two purposes:
     *
     * - **primary:** to be used as the default table when it is omitted during a call into methods {@link helpers.insert insert} and {@link helpers.update update}
     * - **secondary:** to be automatically written into the console (for logging purposes).
     */


    /**
     * @name helpers.ColumnSet#columns
     * @type helpers.Column[]
     * @readonly
     * @description
     * Array of {@link helpers.Column Column} objects.
     */
    if (Array.isArray(columns)) {
        var colNames = {};
        this.columns = $arr.map(columns, c => {
            var col = (c instanceof $npm.Column) ? c : new $npm.Column(c);
            if (col.name in colNames) {
                throw new Error('Duplicate column name "' + col.name + '".');
            }
            colNames[col.name] = true;
            return col;
        });
    } else {
        if (columns instanceof $npm.Column) {
            this.columns = [columns];
        } else {
            this.columns = [];
            for (var name in columns) {
                if (inherit || Object.prototype.hasOwnProperty.call(columns, name)) {
                    this.columns.push(new $npm.Column(name));
                }
            }
        }
    }

    Object.freeze(this.columns);

    for (var i = 0; i < this.columns.length; i++) {
        var c = this.columns[i];
        // ColumnSet is simple when the source objects require no preparation,
        // and should be used directly:
        if (c.prop || c.init || 'def' in c) {
            isSimple = false;
            break;
        }
    }

    /**
     * @name helpers.ColumnSet#names
     * @type String
     * @readonly
     * @description
     * **Added in v5.5.5**
     *
     * Returns a string - comma-separated list of all column names, properly escaped.
     *
     * This method is primarily for internal use.
     *
     * @example
     * var cs = new ColumnSet(['id^', {name: 'cells', cast: 'int[]'}, 'doc:json']);
     * console.log(cs.names);
     * //=> "id","cells","doc"
     */
    Object.defineProperty(this, 'names', {
        get: () => {
            if (!names) {
                names = $arr.map(this.columns, c => c.escapedName).join();
            }
            return names;
        }
    });

    /**
     * @name helpers.ColumnSet#variables
     * @type String
     * @readonly
     * @description
     * **Added in v5.5.5**
     *
     * Returns a string - formatting template for all column values.
     *
     * This method is primarily for internal use.
     *
     * @example
     * var cs = new ColumnSet(['id^', {name: 'cells', cast: 'int[]'}, 'doc:json']);
     * console.log(cs.variables);
     * //=> ${id^},${cells}::int[],${doc:json}
     */
    Object.defineProperty(this, 'variables', {
        get: () => {
            if (!variables) {
                variables = $arr.map(this.columns, c => c.variable + c.castText).join();
            }
            return variables;
        }
    });

    /**
     * @method helpers.ColumnSet.assign
     * @private
     * @description
     * Returns a formatting template of SET assignments for a single object.
     *
     * This method is for internal use only.
     *
     * @param {object} source
     * Source object that contains values for columns.
     *
     * @returns {string}
     * Comma-separated list of variable-to-column assignments.
     */
    this.assign = source => {
        if (updates) {
            return updates;
        }
        var dynamic;
        var list = $arr.filter(this.columns, c => {
            if (c.cnd) {
                return false;
            }
            if (c.skip) {
                dynamic = true;
                var a = colDesc(c, source);
                if (c.skip.call(source, a)) {
                    return false;
                }
            }
            return true;
        });

        list = $arr.map(list, c => c.escapedName + '=' + c.variable + c.castText).join();

        if (!dynamic) {
            updates = list;
        }
        return list;
    };

    /**
     * @method helpers.ColumnSet.extend
     * @description
     * Creates a new {@link helpers.ColumnSet ColumnSet}, by joining the two sets of columns.
     *
     * If the two sets contain a column with the same `name` (case-sensitive), an error is thrown.
     *
     * @param {helpers.Column|helpers.ColumnSet|array} columns
     * Columns to be appended, of the same type as parameter `columns` during {@link helpers.ColumnSet ColumnSet} construction, except:
     * - it can also be of type {@link helpers.ColumnSet ColumnSet}
     * - it cannot be a simple object (properties enumeration is not supported here)
     *
     * @returns {helpers.ColumnSet}
     * New {@link helpers.ColumnSet ColumnSet} object with the extended/concatenated list of columns.
     *
     * @see
     * {@link helpers.Column Column},
     * {@link helpers.ColumnSet.merge merge}
     *
     * @example
     *
     * var pgp = require('pg-promise')();
     *
     * var cs = new pgp.helpers.ColumnSet(['one', 'two'], {table: 'my-table'});
     * console.log(cs);
     * //=>
     * // ColumnSet {
     * //    table: "my-table"
     * //    columns: [
     * //        Column {
     * //            name: "one"
     * //        }
     * //        Column {
     * //            name: "two"
     * //        }
     * //    ]
     * // }
     * var csExtended = cs.extend(['three']);
     * console.log(csExtended);
     * //=>
     * // ColumnSet {
     * //    table: "my-table"
     * //    columns: [
     * //        Column {
     * //            name: "one"
     * //        }
     * //        Column {
     * //            name: "two"
     * //        }
     * //        Column {
     * //            name: "three"
     * //        }
     * //    ]
     * // }
     */
    this.extend = columns => {
        var cs = columns;
        if (!(cs instanceof ColumnSet)) {
            cs = new ColumnSet(columns);
        }
        // Any duplicate column will throw Error = 'Duplicate column name "name".',
        return new ColumnSet(this.columns.concat(cs.columns), {table: this.table});
    };

    /**
     * @method helpers.ColumnSet.merge
     * @description
     * Creates a new {@link helpers.ColumnSet ColumnSet}, by joining the two sets of columns.
     *
     * Items in `columns` with the same `name` (case-sensitive) override the original columns.
     *
     * @param {helpers.Column|helpers.ColumnSet|array} columns
     * Columns to be appended, of the same type as parameter `columns` during {@link helpers.ColumnSet ColumnSet} construction, except:
     * - it can also be of type {@link helpers.ColumnSet ColumnSet}
     * - it cannot be a simple object (properties enumeration is not supported here)
     *
     * @see
     * {@link helpers.Column Column},
     * {@link helpers.ColumnSet.extend extend}
     *
     * @returns {helpers.ColumnSet}
     * New {@link helpers.ColumnSet ColumnSet} object with the merged list of columns.
     *
     * @example
     *
     * var pgp = require('pg-promise')();
     *
     * var cs = new pgp.helpers.ColumnSet(['?one', 'two:json'], {table: 'my-table'});
     * console.log(cs);
     * //=>
     * // ColumnSet {
     * //    table: "my-table"
     * //    columns: [
     * //        Column {
     * //            name: "one"
     * //            cnd: true
     * //        }
     * //        Column {
     * //            name: "two"
     * //            mod: ":json"
     * //        }
     * //    ]
     * // }
     * var csMerged = cs.merge(['two', 'three^']);
     * console.log(csMerged);
     * //=>
     * // ColumnSet {
     * //    table: "my-table"
     * //    columns: [
     * //        Column {
     * //            name: "one"
     * //            cnd: true
     * //        }
     * //        Column {
     * //            name: "two"
     * //        }
     * //        Column {
     * //            name: "three"
     * //            mod: "^"
     * //        }
     * //    ]
     * // }
     *
     */
    this.merge = columns => {
        var cs = columns;
        if (!(cs instanceof ColumnSet)) {
            cs = new ColumnSet(columns);
        }
        var colNames = {}, cols = [];
        $arr.forEach(this.columns, (c, idx) => {
            cols.push(c);
            colNames[c.name] = idx;
        });
        $arr.forEach(cs.columns, c => {
            if (c.name in colNames) {
                cols[colNames[c.name]] = c;
            } else {
                cols.push(c);
            }
        });
        return new ColumnSet(cols, {table: this.table});
    };

    /**
     * @method helpers.ColumnSet.prepare
     * @description
     * **Added in v5.5.6**
     *
     * Prepares a source object to be formatted, by cloning it and applying the rules
     * as set by the columns configuration.
     *
     * This method is primarily for internal use, and as such it does not validate
     * its input parameters.
     *
     * @param {object} source
     * The source object to be prepared, if required.
     *
     * It must be a non-`null` object, which the method does not validate, as it is
     * intended primarily for internal use by the library.
     *
     * @returns {object}
     * When the object needs to be prepared, the method returns a clone of the source object,
     * with all properties and values set according to the columns configuration.
     *
     * When the object does not need to be prepared, the original object is returned.
     */
    this.prepare = source => {
        if (isSimple) {
            return source; // a simple ColumnSet requires no object preparation;
        }
        var target = {};
        $arr.forEach(this.columns, c => {
            var a = colDesc(c, source);
            if (c.init) {
                target[a.name] = c.init.call(source, a);
            } else {
                if (a.exists || 'def' in c) {
                    target[a.name] = a.value;
                }
            }
        });
        return target;
    };

    Object.freeze(this);

    function colDesc(column, source) {
        var a = {
            source: source,
            name: column.prop || column.name
        };
        a.exists = a.name in source;
        if (a.exists) {
            a.value = source[a.name];
        } else {
            a.value = 'def' in column ? column.def : undefined;
        }
        return a;
    }
}

/**
 * @method helpers.ColumnSet.toString
 * @description
 * Creates a well-formatted multi-line string that represents the object.
 *
 * It is called automatically when writing the object into the console.
 *
 * @param {number} [level=0]
 * Nested output level, to provide visual offset.
 *
 * @returns {string}
 */
ColumnSet.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap0 = $npm.utils.messageGap(level),
        gap1 = $npm.utils.messageGap(level + 1),
        lines = [
            'ColumnSet {'
        ];
    if (this.table) {
        lines.push(gap1 + 'table: ' + this.table);
    }
    if (this.columns.length) {
        lines.push(gap1 + 'columns: [');
        $arr.forEach(this.columns, c => {
            lines.push(c.toString(2));
        });
        lines.push(gap1 + ']');
    } else {
        lines.push(gap1 + 'columns: []');
    }
    lines.push(gap0 + '}');
    return lines.join($npm.os.EOL);
};

ColumnSet.prototype.inspect = function () {
    return this.toString();
};

module.exports = ColumnSet;
