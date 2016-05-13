'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting')
};

/**
 *
 * @class helpers.Column
 * @description
 *
 * Performance-optimized, read-only structure that contains pre-formatted details for a single column.
 *
 * @param {String|helpers.ColumnConfig} col
 * Column details, depending on the type:
 *
 * - When it is a string, it is expected to contain a name for both the column and the source property,
 *   assuming that the two are the same. The name must adhere to JavaScript syntax for variable names.
 *   The name can be appended with any format modifier as supported by {@link formatting.format as.format}
 *   (`^`, `~`, `#`, `:csv`, `:json`, `name`, `raw`, `:value`), which is then removed from the name and put
 *   into property `mod`. If the name starts with `?`, it is removed, while setting flag `cnd`=`true`.
 *
 * - When it is a simple {@link helpers.ColumnConfig ColumnConfig}-like object, it is used as an
 *   input configurator to set all the properties of the class.
 *
 * @property {String} name
 * Column name + property name (if `prop` isn't specified).
 *
 * @property {String} [prop]
 * Source property name, if different from the column's name.
 *
 * @property {String} [mod]
 * Formatting modifier, as supported by method {@link formatting.format as.format}: `^`, `~`, `#`, `:csv`, `:json`, `name`, `raw`, `:value`.
 *
 * @property {String} [cast]
 * Server-side type casting, without `::` in front.
 *
 * @property {Boolean} [cnd]
 * Conditional column flag.
 *
 * Used by update queries only, it indicates that the column's value is not to be updated,
 * and it is only for use within an update condition.
 *
 * When initializing from a string, it is the same as adding `?` in front of the name.
 *
 * @property {} [def]
 * Default value for the property, to be used only when the source object doesn't have the property.
 *
 * @property {helpers.initCB} [init]
 * Value override callback. See property `init` in {@link helpers.ColumnConfig ColumnConfig}.
 *
 * @property {helpers.skipCB} [skip]
 * An override for skipping columns. See property `skip` in {@link helpers.ColumnConfig ColumnConfig}.
 *
 * It is ignored when conditional flag `cnd` is set.
 *
 * @returns {helpers.Column}
 *
 * @see {@link helpers.ColumnConfig ColumnConfig}
 *
 * @example
 *
 * var pgp = require('pg-promise')({
 *     capSQL: true // if you want all generated SQL capitalized
 * });
 *
 * var Column = pgp.helpers.Column;
 *
 * // creating a column from just a name:
 * var col1 = new Column('colName');
 * console.log(col1);
 * //=>
 * // Column {
 * //    name: "colName"
 * // }
 *
 * // creating a column from a name + modifier:
 * var col2 = new Column('colName:csv');
 * console.log(col2);
 * //=>
 * // Column {
 * //    name: "colName"
 * //    mod: ":csv"
 * // }
 *
 * // creating a column from a configurator:
 * var col3 = new Column({
 *     name: 'colName', // required
 *     prop: 'propName', // optional
 *     mod: '^', // optional
 *     def: 123 // optional
 * });
 * console.log(col3);
 * //=>
 * // Column {
 * //    name: "colName"
 * //    prop: "propName"
 * //    mod: "^"
 * //    def: 123
 * // }
 *
 */
function Column(col) {

    if (!(this instanceof Column)) {
        return new Column(col);
    }

    if (typeof col === 'string') {
        var info = parseColumn(col);
        this.name = info.name;
        if ('mod' in info) {
            this.mod = info.mod;
        }
        if ('cnd' in info) {
            this.cnd = info.cnd;
        }
    } else {
        if (col && typeof col === 'object' && 'name' in col) {
            if (!$npm.utils.isText(col.name)) {
                throw new TypeError("Property 'name' must be a non-empty text string.");
            }
            if ($npm.utils.isNull(col.prop) && !isValidVariable(col.name)) {
                throw new TypeError("Property 'name' must be a valid variable name when 'prop' isn't specified.");
            }
            this.name = col.name; // column name + property name (if 'prop' isn't specified)

            if (!$npm.utils.isNull(col.prop)) {
                if (typeof col.prop !== 'string' || !isValidVariable(col.prop)) {
                    throw new TypeError("The value of 'prop' must be a valid variable name.");
                }
                this.prop = col.prop; // optional property name (if different from the columns name);
            }
            if (!$npm.utils.isNull(col.mod)) {
                if (typeof col.mod !== 'string' || !isValidMod(col.mod)) {
                    throw new TypeError("Invalid property 'mod' specified.");
                }
                this.mod = col.mod; // optional format modifier;
            }
            if (!$npm.utils.isNull(col.cast)) {
                this.cast = parseCast(col.cast); // optional SQL type casting
            }
            if ('cnd' in col) {
                this.cnd = !!col.cnd;
            }
            if ('def' in col) {
                this.def = col.def; // optional default
            }
            if (typeof col.init === 'function') {
                this.init = col.init; // optional value override (overrides 'def' also)
            }
            if (typeof col.skip === 'function') {
                this.skip = col.skip;
            }
        } else {
            throw new TypeError("Invalid column details.");
        }
    }

    var variable = '${' + (this.prop || this.name) + (this.mod || '') + '}',
        castText = this.cast ? ('::' + this.cast) : '',
        escapedName = $npm.formatting.as.name(this.name);

    Object.defineProperty(this, 'variable', {
        enumerable: false,
        value: variable
    });

    Object.defineProperty(this, 'castText', {
        enumerable: false,
        value: castText
    });

    Object.defineProperty(this, 'escapedName', {
        enumerable: false,
        value: escapedName
    });

    Object.freeze(this);

}

function parseCast(name) {
    if (typeof name === 'string') {
        var idx = 0;
        while (idx < name.length && name[idx] === ':') {
            idx++;
        }
        name = idx ? name.substr(idx) : name;
        if ($npm.utils.isText(name)) {
            return name;
        }
    }
    throw new TypeError("Invalid property 'cast' specified.");
}

function parseColumn(name) {
    var m = name.match(/\??[a-z0-9\$_]+(\^|~|#|:raw|:name|:json|:csv|:value)?/);
    if (m && m[0] === name) {
        var res = {};
        if (name[0] === '?') {
            res.cnd = true;
            name = name.substr(1);
        }
        var mod = name.match(/\^|~|#|:raw|:name|:json|:csv|:value/);
        if (mod) {
            res.name = name.substr(0, mod.index);
            res.mod = mod[0];
        } else {
            res.name = name;
        }
        return res;
    }
    throw new TypeError("Invalid column syntax.");
}

function isValidMod(mod) {
    var values = ['^', '~', '#', ':raw', ':name', ':json', ':csv', ':value'];
    return values.indexOf(mod) !== -1;
}

function isValidVariable(name) {
    var m = name.match(/[a-z0-9\$_]+/);
    return m && m[0] === name;
}

/**
 * @method helpers.Column.toString
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
Column.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap0 = $npm.utils.messageGap(level),
        gap1 = $npm.utils.messageGap(level + 1),
        lines = [
            gap0 + 'Column {',
            gap1 + 'name: ' + JSON.stringify(this.name)
        ];
    if ('prop' in this) {
        lines.push(gap1 + 'prop: ' + JSON.stringify(this.prop));
    }
    if ('mod' in this) {
        lines.push(gap1 + 'mod: ' + JSON.stringify(this.mod));
    }
    if ('cast' in this) {
        lines.push(gap1 + 'cast: ' + JSON.stringify(this.cast));
    }
    if ('cnd' in this) {
        lines.push(gap1 + 'cnd: ' + JSON.stringify(this.cnd));
    }
    if ('def' in this) {
        lines.push(gap1 + 'def: ' + JSON.stringify(this.def));
    }
    if ('init' in this) {
        lines.push(gap1 + 'init: [Function]');
    }
    if ('skip' in this) {
        lines.push(gap1 + 'skip: [Function]');
    }
    lines.push(gap0 + '}');
    return lines.join($npm.os.EOL);
};

Column.prototype.inspect = function () {
    return this.toString();
};

/**
 * @typedef helpers.ColumnConfig
 * @description
 * A simple structure with column details, to be passed into the {@link helpers.Column Column} constructor for initialization.
 *
 * @property {String} name
 * Destination column name + source property name (if `prop` is skipped). The name must adhere to JavaScript syntax for variables,
 * unless `prop` is specified, in which case `name` represents only the column name, and therefore can be any string.
 *
 * @property {String} [prop]
 * Source property name, if different from the column's name. It must adhere to JavaScript syntax for variables.
 *
 * @property {String} [mod]
 * Formatting modifier, as supported by method {@link formatting.format as.format}: `^`, `~`, `#`, `:csv`, `:json`, `name`, `raw`, `:value`.
 *
 * @property {String} [cast]
 * Server-side type casting. Leading `::` is allowed, but not needed (automatically removed when specified).
 *
 * @property {Boolean} [cnd]
 * Used by updates only, it means the column's value is not to be updated, and it is only for use within an update
 * condition (for multi-object updates).
 *
 * @property {} [def]
 * Default value for the property, to be used only when the source object doesn't have the property.
 *
 * @property {helpers.initCB} [init]
 * Override callback for the value.
 *
 * @property {helpers.skipCB} [skip]
 * Used by single-object updates only, to allow skipping columns based on a condition.
 *
 * It is ignored for conditional columns (when `cnd` is set to `true`).
 *
 */

/**
 * @callback helpers.initCB
 * @description
 * A callback function type used by parameter `init` within {@link helpers.ColumnConfig ColumnConfig}.
 *
 * It works as an override for the corresponding property value in the source object.
 *
 * The function is called with `this` set to the source object.
 *
 * @param {} value
 * Value of the property within the source object.
 *
 * If the source object doesn't have the property, and `def` option was specified,
 * then the `value` is set to the `def` value.
 *
 * @returns {}
 * The new value to be used for the corresponding column.
 */

/**
 * @callback helpers.skipCB
 * @description
 * A callback function type used by parameter `skip` within {@link helpers.ColumnConfig ColumnConfig}.
 *
 * It is to dynamically determine if the property is to be skipped from the update.
 *
 * The function is called with `this` set to the source object.
 *
 * @param {String} name
 * Name of the property within the source object.
 *
 * It can be used when implementing a generic verification callback to skip columns bases on a certain rule.
 *
 * @returns {Boolean}
 * A truthy value that indicates whether the column is to be skipped.
 *
 */

module.exports = Column;
