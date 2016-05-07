'use strict';

require('../array');

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting'),
    Column: require('./column')
};

/**
 * @class helpers.ColumnSet
 * @description
 *
 * ** WARNING: Everything within the {@link helpers} namespace is currently in its Alpha version.**
 *
 * Information about all query-formatting columns.
 *
 * @param {Array|Object} columns
 * Columns information object, depending on the type:
 *
 * - When it is a simple object, its properties are enumerated to represent both column names and property names
 *   within the source objects. See also option `inherit` that's applicable in this case.
 *
 * - When it is a single {@link helpers.Column Column} object, property {@link helpers.ColumnSet.columns columns} is initialized with
 *   just a single column. It is not a unique situation when only a single column is required for an update operation.
 *
 * - When it is an array, each element is assumed to represent details for a column. If the element is already of type {@link helpers.Column Column},
 *   it is used directly; otherwise the element is passed into {@link helpers.Column Column} constructor for initialization.
 *
 * - When it is none of the above, it will throw {@link external:TypeError TypeError} = `Invalid parameter 'columns' specified.`
 * 
 * @param {Object} [options]
 *
 * @param {String} [options.table]
 * Table name.
 *
 * It can be used as the default for methods {@link helpers.insert insert} and {@link helpers.update update} when their parameter
 * `table` is omitted, and for logging purposes.
 *
 * @param {Boolean} [options.inherit = false]
 * Use inherited properties in addition to the object's own properties.
 *
 * By default, only the object's own properties are enumerated for column names.
 *
 * @returns {helpers.ColumnSet}
 *
 */
function ColumnSet(columns, options) {

    if (!(this instanceof ColumnSet)) {
        return new ColumnSet(columns, options);
    }

    if (!columns || typeof columns !== 'object') {
        throw new TypeError("Invalid parameter 'columns' specified.");
    }

    var inherit, names, variables, updates;

    if (!$npm.utils.isNull(options)) {
        if (typeof options !== 'object') {
            throw new TypeError("Invalid parameter 'options' specified.");
        }
        if ($npm.utils.isText(options.table)) {
            this.table = options.table;
        }
        inherit = options.inherit;
    }

    /**
     * @name helpers.ColumnSet#table
     * @type String
     * @readonly
     * @description
     * Destination table name. It can be specified for two purposes:
     *
     * - **primary:** to be used as the default table name when it is omitted during a call into methods {@link helpers.insert insert} and {@link helpers.update update}
     * - **secondary:** to be automatically written into the console (for logging purposes).
     */


    /**
     * @name helpers.ColumnSet#columns
     * @type Array
     * @readonly
     * @description
     * Array of {@link helpers.Column Column} objects.
     */
    if (Array.isArray(columns)) {
        this.columns = columns.$map(function (c) {
            return (c instanceof $npm.Column) ? c : new $npm.Column(c);
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

    /**
     * @name helpers.ColumnSet#names
     * @type Array
     * @readonly
     */
    Object.defineProperty(this, 'names', {
        get: function () {
            if (!names) {
                names = this.columns.$map(function (c) {
                    return c.escapedName;
                }).join();
            }
            return names;
        }
    });

    /**
     * @name helpers.ColumnSet#variables
     * @type Array
     * @readonly
     */
    Object.defineProperty(this, 'variables', {
        get: function () {
            if (!variables) {
                variables = this.columns.$map(function (c) {
                    return c.variable;
                }).join();
            }
            return variables;
        }
    });

    /**
     * @name helpers.ColumnSet#updates
     * @type Array
     * @readonly
     */
    Object.defineProperty(this, 'updates', {
        get: function () {
            if (!updates) {
                updates = this.columns.$map(function (c) {
                    return c.escapedName + '=' + c.variable;
                }).join();
            }
            return updates;
        }
    });

    /**
     * @method helpers.ColumnSet.prepare
     * @description
     * Prepares a source object to be formatted, by cloning it and applying the rules
     * as set by the columns configuration.
     *
     * This method is meant primarily for internal use.
     *
     * @param {Object} obj
     * Source object to be prepared.
     *
     * @returns {Object}
     * A clone of the source objects, with all properties and values set according to
     * the columns configuration.
     */
    this.prepare = function (obj) {
        var target = {};
        this.columns.$forEach(function (c) {
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
        }, this);
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
 * @param {Number} [level=0]
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
        lines.push(gap1 + 'table: ' + JSON.stringify(this.table));
    }
    if (this.columns.length) {
        lines.push(gap1 + 'columns: [');
        this.columns.$forEach(function (c) {
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
