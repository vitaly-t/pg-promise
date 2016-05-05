'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting')
};

// this will cache all the column details nicely! :)
// obj is optional;
// it is to be available via export

/**
 * @class helpers.ColumnSet
 * @private
 * @description
 * Information about columns
 *
 * @param cols
 * @param [obj]
 * @param {string} [table]
 * @returns {helpers.ColumnSet}
 *
 */
function ColumnSet(cols, obj, table) {
    if (!(this instanceof ColumnSet)) {
        return new ColumnSet(cols, obj);
    }
    this.table = table; // can be re-used by methods insert/update when the table isn't specified ;)
    this.columns = [];
    var all = false;
    if (cols === 'all') {
        all = true;
        cols = null;
    }

    if ($npm.utils.isNull(cols)) {
        if (!obj || typeof obj !== 'object') {
            throw new TypeError("The object must be specified when columns aren't.");
        }
        for (var name in obj) {
            if (all || obj.hasOwnProperty(name)) {
                this.columns.push({
                    name: name
                });
            }
        }
    } else {
        if (Array.isArray(cols) && cols.length) {
            this.columns = cols.map(function (c, index) {
                if (typeof c === 'string') {
                    return getColumn(c);
                }
                if (c && typeof c === 'object') {
                    parseColInfo(c, index);
                    return c;
                }
                throw new TypeError("Unrecognized column");
            });
        } else {
            if (!all) {
                throw new TypeError("Invalid 'columns' parameter.");
            }
        }
    }

    function parseColInfo(col, index) {
        // TODO: Will need to report the index also.
        if (!('name' in col)) {
            throw new TypeError("Property 'name' is required.");
        }
        if (typeof col.name !== 'string' && typeof col.name !== 'number') {
            throw new TypeError("Invalid property 'name'.");
        }
        if (col.mod && fmModifiers.indexOf(col.mod) === -1) {
            throw new TypeError("Invalid property 'mod'.");
        }
    }

    var propNames;
    Object.defineProperty(this, 'names', {
        get: function () {
            if (!propNames) {
                propNames = this.columns.map(function (c) {
                    return $npm.formatting.as.name(c.name);
                }).join(',');
            }
            return propNames;
        }
    });

    var propValues;
    Object.defineProperty(this, 'values', {
        get: function () {
            if (!propValues) {
                propValues = this.columns.map(function (c) {
                    return '${' + c.name + (c.mod || '') + '}' + c.cast ? ('::' + c.cast) : '';
                }).join(',');
            }
            return propValues;
        }
    });

    this.prepare = function (obj) {
        var target = {};
        this.columns.forEach(function (c) {
            if (c in obj) {
                var value = obj[c];
                target[c] = c.init ? c.init.call(obj, value) : value;
            } else {
                if (c.init) {
                    target[c] = c.init.call(obj);
                } else {
                    if ('def' in c) {
                        target[c] = c.def;
                    } else {
                        throw new Error("Value for property '" + c + "' is unknown.");
                    }
                }
            }
        }, this);
        return target;
    };
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
        lines.push(gap1 + 'table: "' + this.table + '"');
    }
    if (this.columns.length) {
        lines.push(gap1 + 'data: [');
        this.columns.forEach(function (c) {
            lines.push(c.toString(2));
        }, this);
        lines.push(gap1 + ']');
    } else {
        lines.push(gap1 + 'data: []');
    }
    lines.push(gap0 + '}');
    return lines.join($npm.os.EOL);
};

ColumnSet.prototype.inspect = function () {
    return this.toString();
};

module.exports = ColumnSet;
