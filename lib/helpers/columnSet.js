'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting'),
    Column: require('./column')
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
                this.columns.push(new $npm.Column(name));
            }
        }
    } else {
        if (Array.isArray(cols) && cols.length) {
            this.columns = cols.map(function (c) {
                return new $npm.Column(c);
            });
        } else {
            if (!all) {
                throw new TypeError("Invalid 'columns' parameter.");
            }
        }
    }

    var propNames;
    Object.defineProperty(this, 'names', {
        get: function () {
            if (!propNames) {
                propNames = this.columns.map(function (c) {
                    return c.escapedName();
                }).join(',');
            }
            return propNames;
        }
    });

    var variables;
    Object.defineProperty(this, 'variables', {
        get: function () {
            if (!variables) {
                variables = this.columns.map(function (c) {
                    return c.variable;
                }).join(',');
            }
            return variables;
        }
    });

    var updates;
    Object.defineProperty(this, 'updates', {
        get: function () {
            if (!updates) {
                updates = this.columns.map(function (c) {
                    return c.escapedName() + '=' + c.variable;
                }).join(',');
            }
            return updates;
        }
    });

    this.prepare = function (obj) {
        var target = {};
        this.columns.forEach(function (c) {
            if (c.name in obj) {
                var value = obj[c.name];
                target[c.name] = c.init ? c.init.call(obj, value) : value;
            } else {
                if (c.init) {
                    target[c.name] = c.init.call(obj);
                } else {
                    if ('def' in c) {
                        target[c.name] = c.def;
                    } else {
                        throw new Error("Value for property '" + c.name + "' is unknown.");
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
        lines.push(gap1 + 'columns: [');
        this.columns.forEach(function (c) {
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
