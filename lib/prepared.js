'use strict';

var fm = require('./formatting');
var utils = require('./utils');

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
            if (!utils.isText(newValue)) {
                throw new TypeError('Name for Prepared Statements must be a non-empty string.');
            }
            state.name = newValue;
        }
    });

    Object.defineProperty(this, 'text', {
        get: function () {
            return state.text;
        },
        set: function (newValue) {
            if (!utils.isText(newValue)) {
                throw new TypeError('Query for Prepared Statements must be a non-empty string.');
            }
            state.text = newValue;
        }
    });

    Object.defineProperty(this, 'values', {
        get: function () {
            return state.values;
        },
        set: function (newValue) {
            state.values = newValue;
        }
    });

    this.get = function () {
        return {
            name: this.name,
            text: this.text,
            values: this.values
        };
    };

    this.create = function (values) {
        return {
            name: this.name,
            text: this.text,
            values: values
        };
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
        return fm.as.format(this.text, this.values, options);
    };

    Object.freeze(this);
}

PreparedStatement.prototype.inspect = function () {
    return this.get();
};

module.export = PreparedStatement;
