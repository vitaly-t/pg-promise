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
 * It is a read-only structure that contains details for a single column, to be primarily used by {@link helpers.ColumnSet ColumnSet}.
 *
 * The class parses and validates all the details, and prepares them for high-performance query generation.
 *
 * @param {String|helpers.ColumnConfig} col
 * Column details, depending on the type.
 *
 * When it is a string, it is expected to contain a name for both the column and the source property, assuming that the two are the same.
 * The name must adhere to JavaScript syntax for variable names. The name can be appended with any format modifier as supported by
 * {@link formatting.format as.format} (`^`, `~`, `#`, `:csv`, `:json`, `:name`, `:raw`, `:value`), which is then removed from the name and put
 * into property `mod`. If the name starts with `?`, it is removed, while setting flag `cnd` = `true`.
 *
 * If the string doesn't adhere to the above requirements, the method will throw {@link external:TypeError TypeError} = `Invalid column syntax`.
 *
 * When `col` is a simple {@link helpers.ColumnConfig ColumnConfig}-like object, it is used as an input configurator to set all the properties
 * of the class.
 *
 * @property {string} name
 * Destination column name + source property name (if `prop` is skipped). The name must adhere to JavaScript syntax for variables,
 * unless `prop` is specified, in which case `name` represents only the column name, and therefore can be any string.
 *
 * @property {string} [prop]
 * Source property name, if different from the column's name. It must adhere to JavaScript syntax for variables.
 *
 * It is ignored when it is the same as `name`.
 *
 * @property {string} [mod]
 * Formatting modifier, as supported by method {@link formatting.format as.format}: `^`, `~`, `#`, `:csv`, `:json`, `:name`, `:raw`, `:value`.
 *
 * @property {string} [cast]
 * Server-side type casting, without `::` in front.
 *
 * @property {boolean} [cnd]
 * Conditional column flag.
 *
 * Used by methods {@link helpers.update update} and {@link helpers.sets sets}, ignored by methods {@link helpers.insert insert} and
 * {@link helpers.values values}. It indicates that the column is reserved for a `WHERE` condition, not to be set or updated.
 *
 * It can be set from a string initialization, by adding `?` in front of the name.
 *
 * @property {} [def]
 * Default value for the property, to be used only when the source object doesn't have the property.
 * It is ignored when property `init` is set.
 *
 * @property {helpers.initCB} [init]
 * Override callback for the value.
 *
 * @property {helpers.skipCB} [skip]
 * An override for skipping columns dynamically.
 *
 * Used by methods {@link helpers.update update} (for a single object) and {@link helpers.sets sets}, ignored by methods
 * {@link helpers.insert insert} and {@link helpers.values values}.
 *
 * It is also ignored when conditional flag `cnd` is set.
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
                throw new TypeError('Invalid \'name\' value: ' + JSON.stringify(col.name) + '. A non-empty string was expected.');
            }
            if ($npm.utils.isNull(col.prop) && !isValidVariable(col.name)) {
                throw new TypeError('Invalid \'name\' syntax: ' + JSON.stringify(col.name) + '. A valid variable name was expected.');
            }
            this.name = col.name; // column name + property name (if 'prop' isn't specified)

            if (!$npm.utils.isNull(col.prop)) {
                if (!$npm.utils.isText(col.prop)) {
                    throw new TypeError('Invalid \'prop\' value: ' + JSON.stringify(col.prop) + '. A non-empty string was expected.');
                }
                if (!isValidVariable(col.prop)) {
                    throw new TypeError('Invalid \'prop\' syntax: ' + JSON.stringify(col.prop) + '. A valid variable name was expected.');
                }
                if (col.prop !== col.name) {
                    // optional property name, if different from the column's name;
                    this.prop = col.prop;
                }
            }
            if (!$npm.utils.isNull(col.mod)) {
                if (typeof col.mod !== 'string' || !isValidMod(col.mod)) {
                    throw new TypeError('Invalid \'mod\' value: ' + JSON.stringify(col.mod) + '.');
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
            throw new TypeError('Invalid column details.');
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
        var s = name.replace(/^[:\s]*|\s*$/g, '');
        if (s) {
            return s;
        }
    }
    throw new TypeError('Invalid \'cast\' value: ' + JSON.stringify(name) + '.');
}

function parseColumn(name) {
    var m = name.match(/\??[a-zA-Z0-9\$_]+(\^|~|#|:raw|:name|:json|:csv|:value)?/);
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
    throw new TypeError('Invalid column syntax: ' + JSON.stringify(name) + '.');
}

function isValidMod(mod) {
    var values = ['^', '~', '#', ':raw', ':name', ':json', ':csv', ':value'];
    return values.indexOf(mod) !== -1;
}

function isValidVariable(name) {
    var m = name.match(/^[0-9]+|[a-zA-Z0-9\$_]+/);
    return !!m && m[0] === name;
}

/**
 * @method helpers.Column.toString
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
 * @property {string} name
 * Destination column name + source property name (if `prop` is skipped). The name must adhere to JavaScript syntax for variables,
 * unless `prop` is specified, in which case `name` represents only the column name, and therefore can be any string.
 *
 * @property {string} [prop]
 * Source property name, if different from the column's name. It must adhere to JavaScript syntax for variables.
 *
 * It is ignored when it is the same as `name`.
 *
 * @property {string} [mod]
 * Formatting modifier, as supported by method {@link formatting.format as.format}: `^`, `~`, `#`, `:csv`, `:json`, `:name`, `:raw`, `:value`.
 *
 * @property {string} [cast]
 * Server-side type casting. Leading `::` is allowed, but not needed (automatically removed when specified).
 *
 * @property {boolean} [cnd]
 * Conditional column flag.
 *
 * Used by methods {@link helpers.update update} and {@link helpers.sets sets}, ignored by methods {@link helpers.insert insert} and
 * {@link helpers.values values}. It indicates that the column is reserved for a `WHERE` condition, not to be set or updated.
 *
 * It can be set from a string initialization, by adding `?` in front of the name.
 *
 * @property {} [def]
 * Default value for the property, to be used only when the source object doesn't have the property.
 * It is ignored when property `init` is set.
 *
 * @property {helpers.initCB} [init]
 * Override callback for the value.
 *
 * @property {helpers.skipCB} [skip]
 * An override for skipping columns dynamically.
 *
 * Used by methods {@link helpers.update update} (for a single object) and {@link helpers.sets sets}, ignored by methods
 * {@link helpers.insert insert} and {@link helpers.values values}.
 *
 * It is also ignored when conditional flag `cnd` is set.
 *
 */

/**
 * @callback helpers.initCB
 * @description
 * A callback function type used by parameter `init` within {@link helpers.ColumnConfig ColumnConfig}.
 *
 * It works as an override for the corresponding property value in the `source` object.
 *
 * The function is called with `this` set to the `source` object.
 *
 * @param {} col
 * Column-to-property descriptor.
 *
 * @param {object} col.source
 * The source object, equals to `this` that's passed into the function.
 *
 * @param {string} col.name
 * Name of the property within the `source` object.
 *
 * @param {} col.value
 *
 * Property value, set to one of the following:
 *
 * - Value of the property within the `source` object (`value` = `source[name]`), if the property exists
 * - If the property doesn't exist and `def` is set in the column, then `value` is set to the value of `def`
 * - If the property doesn't exist and `def` is not set in the column, then `value` is set to `undefined`
 *
 * @param {boolean} col.exists
 * Indicates whether the property exists in the `source` object (`exists = name in source`).
 *
 * @returns {}
 * The new value to be used for the corresponding column.
 */

/**
 * @callback helpers.skipCB
 * @description
 * A callback function type used by parameter `skip` within {@link helpers.ColumnConfig ColumnConfig}.
 *
 * It is to dynamically determine when the property with specified `name` in the `source` object is to be skipped.
 *
 * The function is called with `this` set to the `source` object.
 *
 * @param {} col
 * Column-to-property descriptor.
 *
 * @param {object} col.source
 * The source object, equals to `this` that's passed into the function.
 *
 * @param {string} col.name
 * Name of the property within the `source` object.
 *
 * @param {} col.value
 *
 * Property value, set to one of the following:
 *
 * - Value of the property within the `source` object (`value` = `source[name]`), if the property exists
 * - If the property doesn't exist and `def` is set in the column, then `value` is set to the value of `def`
 * - If the property doesn't exist and `def` is not set in the column, then `value` is set to `undefined`
 *
 * @param {boolean} col.exists
 * Indicates whether the property exists in the `source` object (`exists = name in source`).
 *
 * @returns {boolean}
 * A truthy value that indicates whether the column is to be skipped.
 *
 */

module.exports = Column;
