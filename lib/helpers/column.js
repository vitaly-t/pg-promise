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
function Column(e) {
    if (!(this instanceof Column)) {
        return new Column(e);
    }

    if (typeof e === 'string') {
        var mod = e.match(/\^|~|#|:raw|:name|:json|:csv|:value/);
        if (mod) {
            this.name = e.substr(0, mod.index);
            this.mod = mod[0];
        } else {
            this.name = e;
        }
    } else {
        // e is an object;
        if ('name' in e) {
            this.name = e.name;
        }
        if (e.mod && typeof e.mod === 'string') {
            this.mod = e.mod;
        }
        if (e.cast && typeof e.cast === 'string') {
            // TODO: Need to remove leading '::'
            this.cast = e.cast;
        }
        if ('def' in e) {
            this.def = e.def;
        }
        if (typeof e.init === 'function') {
            this.init = e.init;
        }
    }

    this.variable = '${' + this.name + (this.mod || '') + '}' + (this.cast ? ('::' + this.cast) : '');

    Object.freeze(this);

}

Column.prototype.escapedName = function () {
    return $npm.formatting.as.name(this.name);
};

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
