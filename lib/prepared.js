'use strict';

var $npm = {
    os: require('os'),
    fm: require('./formatting'),
    utils: require('./utils'),
    errors: require('./errors'),
    QueryFile: require('./queryFile')
};

/**
 * @constructor PreparedStatement
 * @description
 * **Alternative Syntax:** `PreparedStatement({name, text, values})` &#8658; {@link PreparedStatement}
 *
 * Constructs a strict {@link http://www.postgresql.org/docs/9.5/static/sql-prepare.html Prepared Statement} object
 * that can be used directly with any query method of the library.
 *
 * This type extends the basic `{name, text, values}` object by replacing it, i.e. when the basic object is used
 * with a query method, a new {@link PreparedStatement} object is created implicitly in its place.
 *
 * The type is available from the library's root: `pgp.PreparedStatement`.
 *
 * @param {string} name
 * An arbitrary name given to this particular prepared statement. It must be unique within a single session and is
 * subsequently used to execute or deallocate a previously prepared statement.
 *
 * @param {string|QueryFile} text
 * A non-empty query string or a {@link QueryFile} object.
 *
 * @param {Array} [values]
 * Query formatting values. It can be either an `Array` or `null`/`undefined`.
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

    /**
     * @name PreparedStatement#name
     * @type {string}
     * @description
     * An arbitrary name given to this particular prepared statement. It must be unique within a single session and is
     * subsequently used to execute or deallocate a previously prepared statement.
     */
    this.name = name;

    /**
     * @name PreparedStatement#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
     */
    this.text = text;

    /**
     * @name PreparedStatement#values
     * @type {Array}
     * @description
     * Query formatting values. It can be either an `Array` or `null`/`undefined`.
     */
    this.values = values;

    /**
     * @name PreparedStatement#error
     * @type {PreparedStatementError}
     * @description
     * When in an error state, it is set to a {@link PreparedStatementError} object. Otherwise, it is `undefined`.
     *
     * This property is meant primarily for internal use by the library.
     */
    this.error = undefined;

    if ($npm.utils.isObject(name, ['name', 'text'])) {
        this.name = name.name;
        this.text = name.text;
        this.values = name.values;
    }

    Object.seal(this);
}

/**
 * @method PreparedStatement.parse
 * @description
 * Parses the current object and returns a simple Prepared Statement `{name, text, values}`,
 * if successful, or else returns a {@link PreparedStatementError} object.
 *
 * This method is meant primarily for internal use by the library.
 *
 * @returns {{name, text, values}|PreparedStatementError}
 */
PreparedStatement.prototype.parse = function () {
    this.error = undefined;
    var errors = [], ps = {
        name: this.name,
        text: this.text,
        values: this.values
    };
    if (!$npm.utils.isText(ps.name)) {
        errors.push("Property 'name' must be a non-empty text string.");
    }
    if (!$npm.utils.isNull(ps.values)) {
        if (!Array.isArray(ps.values)) {
            errors.push("Property 'values' must be an array or null/undefined.");
        }
    }
    if (ps.text instanceof $npm.QueryFile) {
        var qf = ps.text;
        qf.prepare();
        if (qf.error) {
            errors.push(qf.error);
        } else {
            ps.text = qf.query;
        }
    }
    if (!$npm.utils.isText(ps.text)) {
        errors.push("Property 'text' must be a non-empty text string.");
    }
    if (errors.length) {
        this.error = new $npm.errors.PreparedStatementError(errors[0], ps);
        return this.error;
    }
    return ps;
};

/**
 * @method PreparedStatement.toString
 * @description
 * Creates a well-formatted multi-line string that represents the object's current state.
 *
 * It is called automatically when writing the object into the console.
 *
 * @param {Number} [level=0]
 * Nested output level, to provide visual offset.
 *
 * @returns {string}
 */
PreparedStatement.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap = $npm.utils.messageGap(level + 1);
    var lines = [
        'PreparedStatement {'
    ];
    var ps = this.parse();
    if ($npm.utils.isText(this.name)) {
        lines.push(gap + 'name: "' + this.name + '"');
    }
    if ($npm.utils.isText(ps.text)) {
        lines.push(gap + 'text: "' + ps.text + '"');
    }
    if (this.values !== undefined) {
        lines.push(gap + 'values: ' + JSON.stringify(this.values));
    }
    if (this.error) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    }
    lines.push($npm.utils.messageGap(level) + '}');
    return lines.join($npm.os.EOL);
};

PreparedStatement.prototype.inspect = function () {
    return this.toString();
};

module.exports = PreparedStatement;
