'use strict';

var $fm = require('./formatting');
var $utils = require('./utils');
var EOL = require('os').EOL;

/**
 * @constructor PreparedStatement
 *
 * @param name
 *
 * @param text
 *
 * @param values
 *
 * @returns {PreparedStatement}
 *
 */
function PreparedStatement(name, text, values) {

    if (!(this instanceof PreparedStatement)) {
        return new PreparedStatement(name, text, values);
    }

    var state = {};

    Object.defineProperty(this, 'name', {
        get: function () {
            return state.name;
        },
        set: function (newValue) {
            if (!$utils.isText(newValue)) {
                throw new TypeError("'name' must be a non-empty text string.");
            }
            state.name = newValue;
        }
    });

    Object.defineProperty(this, 'text', {
        get: function () {
            return state.text;
        },
        set: function (newValue) {
            if (!$utils.isText(newValue)) {
                throw new TypeError("'text' must be a non-empty text string.");
            }
            state.text = newValue;
        }
    });

    Object.defineProperty(this, 'values', {
        get: function () {
            return state.values;
        },
        set: function (newValue) {
            if (!$utils.isNull(newValue) && !Array.isArray(newValue)) {
                throw new TypeError("'values' must be an array.");
            }
            state.values = newValue;
        }
    });

    this.get = function () {
        var obj = {
            name: this.name,
            text: this.text
        };
        if (!$utils.isNull(this.values)) {
            obj.values = this.values;
        }
        return obj;
    };

    this.create = function (values) {
        if (!$utils.isNull(values) && !Array.isArray(values)) {
            throw new TypeError("'values' must be an array.");
        }
        var obj = {
            name: this.name,
            text: this.text
        };
        if (!$utils.isNull(values)) {
            obj.values = values;
        }
        return obj;
    };

    if (name && typeof name === 'object') {
        this.values = name.values;
        this.text = name.text;
        this.name = name.name;
    } else {
        this.name = name;
        this.text = text;
        this.values = values;
    }

    this.format = function (options) {
        return $fm.as.format(this.text, this.values, options);
    };

    Object.freeze(this);
}

PreparedStatement.prototype.toString = function () {
    var lines = [
        'PreparedStatement {',
        '    name: "' + this.name + '"',
        '    text: "' + this.text + '"'
    ];
    if (this.values !== undefined) {
        lines.push('    values: ' + JSON.stringify(this.values));
    }
    lines.push('}');
    return lines.join(EOL);
};

PreparedStatement.prototype.inspect = function () {
    return this.toString();
};

module.exports = PreparedStatement;
