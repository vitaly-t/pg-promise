'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting')
};

/**
 * Represents a single column information, plus formatting helpers;
 * @class helpers.Column
 * @private
 * @returns {helpers.Column}
 */
function Column(col) {

    if (!(this instanceof Column)) {
        return new Column(col);
    }

    if (typeof col === 'string') {
        var mod = col.match(/\^|~|#|:raw|:name|:json|:csv|:value/);
        if (mod) {
            this.name = col.substr(0, mod.index);
            this.mod = mod[0];
        } else {
            this.name = col;
        }
    } else {
        if (col && typeof col === 'object') {
            if ('name' in col) {
                this.name = col.name; // column name + property name (if 'prop' isn't specified)
            }
            if ('prop' in col) {
                this.prop = col.prop; // optional property name (if different from the columns name);
            }
            if (col.mod && typeof col.mod === 'string') {
                this.mod = col.mod; // optional format modifier;
            }
            if ($npm.utils.isText(col.cast)) {
                this.cast = getCastName(col.cast); // optional SQL type casting
            }
            if ('def' in col) {
                this.def = col.def; // optional default
            }
            if (typeof col.init === 'function') {
                this.init = col.init; // optional value override (overrides 'def' also)
            }
        } else {
            throw new TypeError("A column must be a string or a non-null object.");
        }
    }

    if (!$npm.utils.isText(this.name)) {
        throw new TypeError("A column name must be a non-empty text string.");
    }
    
    if ('prop' in this && !$npm.utils.isText(this.prop)) {
        throw new TypeError("A property name must be a non-empty text string.");
    }

    this.variable = '${' + (this.prop || this.name) + (this.mod || '') + '}' + (this.cast ? ('::' + this.cast) : '');

    this.escapedName = $npm.formatting.as.name(this.name);

    Object.freeze(this);

}

function getCastName(name) {
    var idx = 0;
    while (idx < name.length && name[idx] === ':') {
        idx++;
    }
    return idx ? name.substr(idx) : name;
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
    if ('def' in this) {
        lines.push(gap1 + 'def: ' + JSON.stringify(this.def));
    }
    lines.push(gap0 + '}');
    return lines.join($npm.os.EOL);
};

Column.prototype.inspect = function () {
    return this.toString();
};

module.exports = Column;
