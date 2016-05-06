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
 * ### Formatting Helpers is a v.4.1.0 feature that's in development.
 *
 * Information about all columns.
 *
 * @param {Object} columns
 *
 * @param {Object} [options]
 *
 * @param {string} [options.table]
 * Table name.
 *
 * @param {boolean} [options.inherit = false]
 * Use inherited properties when enumerating an object.
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
     * @description
     * Destination table name.
     */

    /**
     * @name helpers.ColumnSet#columns
     * @type Array
     * @description
     * Array of {@link helpers.Column Column} objects.
     */

    if (Array.isArray(columns)) {
        this.columns = columns.$map(function (c) {
            return new $npm.Column(c);
        });
    } else {
        this.columns = [];
        for (var name in columns) {
            if (inherit || columns.hasOwnProperty(name)) {
                this.columns.push(new $npm.Column(name));
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

    this.prepare = function (obj) {
        var target = {};
        this.columns.$forEach(function (c) {
            var name = c.prop || c.name;
            if (name in obj) {
                var value = obj[name];
                target[name] = c.init ? c.init.call(obj, value) : value;
            } else {
                if (c.init) {
                    target[name] = c.init.call(obj);
                } else {
                    if ('def' in c) {
                        target[name] = c.def;
                    }
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
        }, this);
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
