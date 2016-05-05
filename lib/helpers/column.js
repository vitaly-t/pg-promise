'use strict';

/*
 var columns = [{
 name: 'bla', // can be text or number;
 mod: '^', // must exist;
 cast: '::date', // must be a text string (automatically remove :: in front);
 def: 123,
 init: function (value) { // must be a function
 }]
 */

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    formatting: require('../formatting')
};

var fmModifiers = [
    '^',        // Raw-Text variable
    ':raw',     // Raw-Text variable
    '~',        // SQL Name/Identifier
    ':name',    // SQL Name/Identifier
    '#',        // Escaped value
    ':value',   // Escaped value
    ':json',    // JSON modifier
    ':csv'      // CSV modifier
];

function checkModifier(mod, pos) {
    if (mod && fmModifiers.indexOf(mod) === -1) {
        throw new TypeError("Invalid formatting modifier '" + mod + "' at index " + pos + ".");
    }
}

function getColumn(name, pos) {
    var mod = name.match(/\^|~|#|:raw|:name|:json|:csv|:value/);
    var res = {
        name: name.substr(0, mod.index),
        mod: mod ? mod[0] : null
    };
    checkModifier(res.mod, pos);
    return res;
}

/**
 * Represents a single column information, plus formatting helpers;
 * @class helpers.Column
 * @private
 * @returns {helpers.Column}
 */
function Column() {

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
