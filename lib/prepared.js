'use strict';

var $fm = require('./formatting');
var $utils = require('./utils');
var EOL = require('os').EOL;

/**
 * @constructor PreparedStatement
 * @description
 * **Alternative Syntax:** `PreparedStatement({name, text, values})` &#8658; {@link PreparedStatement}
 *
 * Added in version 3.9.0
 *
 * Constructs a strict {@link http://www.postgresql.org/docs/9.5/static/sql-prepare.html Prepared Statement} object
 * that can be used directly with any query method of the library.
 *
 * It is an extension on the basic `{name, text, values}` object (also usable with all query methods):
 * - Parses all the parameters, and throws an error, if they are invalid
 * - Reusable with different values, via method {@link PreparedStatement.create create}
 * - Can be used as a simple object, via method {@link PreparedStatement.get get}
 * - Provides friendly-formatted output for the console, and via method {@link PreparedStatement.toString toString}
 *
 * The type is available from the library's root: `pgp.PreparedStatement`.
 *
 * @param {string} name
 * An arbitrary name given to this particular prepared statement. It must be unique within a single
 * session and is subsequently used to execute or deallocate a previously prepared statement.
 *
 * @param {string} text
 * A non-empty query string with formatting parameters, such as `$1, $2, etc.`, or without them.
 *
 * @param {Array} [values]
 * An optional array of values to replace the formatting parameters in the query, provided it has any.
 *
 * @property {string} name
 * Prepared Statement name, as specified in the constructor (or changed later).
 *
 * Setting it to anything other than a non-empty text string will throw {@link external:TypeError TypeError}=
 * `'name' must be a non-empty text string.`
 *
 * @property {string} text
 * Query string, as specified in the constructor (or changed later).
 *
 * Setting it to anything other than a non-empty text string will throw {@link external:TypeError TypeError}=
 * `'text' must be a non-empty text string.`
 *
 * @property {Array} values
 * Query formatting values, as specified in the constructor (or changed later).
 *
 * It can be set to an `Array`, `null` or `undefined`, or else it will throw {@link external:TypeError TypeError}=
 * `'values' must be an array or null/undefined.`
 *
 * @returns {PreparedStatement}
 *
 * @see {@link http://www.postgresql.org/docs/9.5/static/sql-prepare.html PostgreSQL Prepared Statements}
 *
 * @example
 *
 * var PS = require('pg-promise').PreparedStatement;
 *
 * // Creating a complete Prepared Statement:
 * var findUser = new PS('find-user', 'SELECT * FROM Users WHERE id = $1', [123]);
 *
 * db.one(findUser)
 *     .then(user=> {
 *         // user found;
 *     })
 *     .catch(error=> {
 *         // error;
 *     });
 *
 * @example
 *
 * var PS = require('pg-promise').PreparedStatement;
 *
 * // Creating a reusable Prepared Statement:
 * var addUser = new PS('add-user', 'INSERT INTO Users(name, age) VALUES($1, $2)');
 *
 * db.none(addUser.create(['John', 30]))
 *     .then(()=> {
 *         // user added;
 *     })
 *     .catch(error=> {
 *         // error;
 *     });
 *
 * @example
 *
 * var PS = require('pg-promise').PreparedStatement;
 *
 * // Creating a reusable Prepared Statement:
 * var addUser = new PS('add-user', 'INSERT INTO Users(name, age) VALUES($1, $2)');
 *
 * addUser.values = ['John', 30];
 *
 * db.none(addUser)
 *     .then(()=> {
 *         // user added;
 *     })
 *     .catch(error=> {
 *         // error;
 *     });
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
                throw new TypeError("'values' must be an array or null/undefined.");
            }
            state.values = newValue;
        }
    });

    if (name && typeof name === 'object') {
        this.values = name.values;
        this.text = name.text;
        this.name = name.name;
    } else {
        this.name = name;
        this.text = text;
        this.values = values;
    }

    Object.freeze(this);
}

/**
 * @method PreparedStatement.get
 * @description
 * Returns a new Prepared Statement object `{name, text, values}`, based on the object's state.
 *
 * When a {@link PreparedStatement} object is passed into a query method, {@link PreparedStatement.get get} is called automatically.
 *
 * @returns {Object}
 * New object `{name, text, values}`, with `values` set when it is not `null`/`undefined`.
 */
PreparedStatement.prototype.get = function () {
    var obj = {
        name: this.name,
        text: this.text
    };
    if (!$utils.isNull(this.values)) {
        obj.values = this.values;
    }
    return obj;
};

/**
 * @method PreparedStatement.create
 * @description
 * Returns a new Prepared Statement object `{name, text, values}`, based on the object's state,
 * but with the new `values`.
 *
 * @param {Array} [values]
 * Optional property `values` to be used in the new object: `Array`/`null`/`undefined`.
 *
 * @returns {Object}
 * New object `{name, text, values}`, with `values` set when it is not `null`/`undefined`.
 */
PreparedStatement.prototype.create = function (values) {
    if (!$utils.isNull(values) && !Array.isArray(values)) {
        throw new TypeError("'values' must be an array or null/undefined.");
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

/**
 * @method PreparedStatement.format
 * @description
 * Uses `pg-promise` formatting engine (method {@link formatting.format as.format}) to format the query according to its current state.
 *
 * This method is primarily for logging and diagnostics, as Prepared Statements are to be formatted by the server.
 *
 * ATTENTION: This method can never guarantee the same query as formatted by the server.
 *
 * @param {Object} [options]
 * Formatting options, as used by method {@link formatting.format as.format}.
 *
 * @returns {string}
 */
PreparedStatement.prototype.format = function (options) {
    return $fm.as.format(this.text, this.values, options);
};

/**
 * @method PreparedStatement.toString
 * @description
 * Creates a well-formatted multi-line string that represents the object's state.
 *
 * It is called automatically when writing the object into the console.
 *
 * @returns {string}
 */
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
