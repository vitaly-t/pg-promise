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
 *         init: function (value) {
 *             // set to 100, if the value is 0:
 *             return values === 0 ? 100 : value;
 *         }
 *     },
 *     {
 *         name: 'total-val',
 *         prop: 'total',
 *         skip: function (name) {
 *             // skip from updates, if 'amount' is 0:
 *             return (this.amount === 0);
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
        throw new TypeError("Invalid parameter 'columns' specified.");
    }

    var inherit, names, variables, castVariables, updates, canSetMany, isSimple = true;

    if (!$npm.utils.isNull(options)) {
        if (typeof options !== 'object') {
            throw new TypeError("Invalid parameter 'options' specified.");
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
        this.columns = $arr.map(columns, function (c) {
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
                if (inherit || columns.hasOwnProperty(name)) {
                    this.columns.push(new $npm.Column(name));
                }
            }
        }
    }

    Object.freeze(this.columns);
    
    // ColumnSet is simple when the source objects require no preparation,
    // and should be used directly:
    for (var i = 0; i < this.columns.length; i++) {
        var c = this.columns[i];
        if (c.prop || c.init || 'def' in c) {
            isSimple = false;
            break;
        }
    }

    /**
     * @name helpers.ColumnSet#names
     * @private
     * @type String
     * @readonly
     * @description
     * A string that contains a comma-separated list of escaped column names, wrapped in `()`.
     */
    Object.defineProperty(this, 'names', {
        get: function () {
            if (!names) {
                names = $arr.map(this.columns, function (c) {
                    return c.escapedName;
                }).join();
                if (names) {
                    names = '(' + names + ')';
                }
            }
            return names;
        }
    });

    /**
     * @name helpers.ColumnSet#variables
     * @private
     * @type String
     * @readonly
     * @description
     * A string that contains a comma-separated list of all variables.
     */
    Object.defineProperty(this, 'variables', {
        get: function () {
            if (!variables) {
                variables = $arr.map(this.columns, function (c) {
                    return c.variable;
                }).join();
            }
            return variables;
        }
    });

    /**
     * @name helpers.ColumnSet#castVariables
     * @private
     * @type String
     * @readonly
     * @description
     * A string that contains a comma-separated list of all variables with casting.
     */
    Object.defineProperty(this, 'castVariables', {
        get: function () {
            if (!castVariables) {
                castVariables = $arr.map(this.columns, function (c) {
                    return c.variable + c.castText;
                }).join();
            }
            return castVariables;
        }
    });

    /**
     * @method helpers.ColumnSet.getUpdates
     * @private
     * @readonly
     * @description
     * Returns the complete list of SET-s for a single object.
     */
    this.getUpdates = function (obj) {
        if (updates) {
            return updates;
        }
        var dynamic;
        var list = $arr.filter(this.columns, function (c) {
            if (c.cnd) {
                return false;
            }
            if (c.skip) {
                dynamic = true;
                if (c.skip.call(obj, c.prop || c.name)) {
                    return false;
                }
            }
            return true;
        });

        list = $arr.map(list, function (c) {
            return c.escapedName + '=' + c.variable + c.castText;
        }).join();

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
    this.extend = function (columns) {
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
    this.merge = function (columns) {
        var cs = columns;
        if (!(cs instanceof ColumnSet)) {
            cs = new ColumnSet(columns);
        }
        var colNames = {}, cols = [];
        $arr.forEach(this.columns, function (c, idx) {
            cols.push(c);
            colNames[c.name] = idx;
        });
        $arr.forEach(cs.columns, function (c) {
            if (c.name in colNames) {
                cols[colNames[c.name]] = c;
            } else {
                cols.push(c);
            }
        });
        return new ColumnSet(cols, {table: this.table});
    };

    /**
     * @method helpers.ColumnSet.canUpdate
     * @description
     * Checks if it is possible to generate an `UPDATE` query (via method {@link helpers.update update}) for the specified `data`
     * and the current {@link helpers.ColumnSet ColumnSet}, without running into errors related to the shortage of effective
     * update columns or the lack of data. It can also be used before calling method {@link helpers.sets sets}, to determine whether
     * it is going to return an empty string, due to the shortage of effective columns.
     *
     * The result and the logic depend on whether `data` is a single object or an array, and it is consistent with the validation
     * logic that's implemented by the {@link helpers.update update} method.
     *
     * This method is mainly valuable for those single-object updates that make use of property {@link helpers.Column Column.skip}, which
     * makes the list of effective columns dynamic.
     *
     * @param {object|array} data
     * Data intended for an `UPDATE` query - a single source object or an array of such objects.
     *
     * Passing in a non-object value will throw {@link external:TypeError TypeError} = `Invalid parameter 'data' specified.`
     *
     * @returns {boolean}
     *
     * - `true` - this `ColumnSet` can generate a valid `UPDATE` query via method {@link helpers.update update} for the `data` specified
     * - `false` - passing such `data` into method {@link helpers.update update} will inevitably throw an error, either because
     *   there are no columns to be updated or there is no data (when `data` is an empty array).
     */
    this.canUpdate = function (data) {
        if (!data || typeof data !== 'object') {
            throw new TypeError("Invalid parameter 'data' specified.");
        }
        var cnd = 0, skip = 0, total = this.columns.length;
        if (Array.isArray(data)) {
            if (canSetMany === undefined) {
                cnd = $arr.countIf(this.columns, function (c) {
                    return c.cnd;
                });
                canSetMany = total > cnd;
            }
            return canSetMany && data.length > 0;
        }
        $arr.forEach(this.columns, function (c) {
            cnd += c.cnd ? 1 : 0;
            if (c.skip) {
                skip += c.skip.call(data, c.prop || c.name) ? 1 : 0;
            }
        });
        return total > cnd + skip;
    };

    /**
     * @method helpers.ColumnSet.prepare
     * @private
     * @description
     * Prepares a source object to be formatted, by cloning it and applying the rules
     * as set by the columns configuration.
     *
     * This method is meant primarily for internal use.
     *
     * @param {object} obj
     * Source object to be prepared.
     *
     * @returns {object}
     * A clone of the source objects, with all properties and values set according to
     * the columns configuration.
     */
    this.prepare = function (obj) {
        if (isSimple) {
            return obj; // a simple ColumnSet requires no object preparation;
        }
        var target = {};
        $arr.forEach(this.columns, function (c) {
            var name = c.prop || c.name;
            if (name in obj) {
                var value = obj[name];
                target[name] = c.init ? c.init.call(obj, value) : value;
            } else {
                var value;
                if ('def' in c) {
                    target[name] = value = c.def;
                }
                if (c.init) {
                    target[name] = c.init.call(obj, value);
                }
            }
        });
        return target;
    };

    Object.freeze(this);
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
        $arr.forEach(this.columns, function (c) {
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
