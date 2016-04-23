'use strict';

var $npm = {
    fm: require('./formatting'),
    utils: require('./utils'),
    errors: require('./errors'),
    QueryFile: require('./queryFile')
};

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

    if ($npm.utils.isObject(name, ['name', 'text'])) {
        this.name = name.name;
        this.text = name.text;
        this.values = name.values;
    } else {
        this.name = name;
        this.text = text;
        this.values = values;
    }

    Object.freeze(this);
}

PreparedStatement.prototype.parse = function () {
    var ps = {}, PSE = $npm.errors.PreparedStatementError;
    if (!$npm.utils.isText(this.name)) {
        return new PSE("Property 'name' must be a non-empty text string.");
    }
    ps.name = this.name;
    if (this.text instanceof $npm.QueryFile) {
        var qf = this.text;
        qf.prepare();
        if (qf.error) {
            return new PSE(qf.error);
        }
        ps.text = qf.query;
    } else {
        ps.text = this.text;
    }
    if (!$npm.utils.isText(ps.text)) {
        return new PSE("Invalid 'text' in PreparedStatement '" + this.name + "': a non-empty text string was expected.");
    }
    if (!$npm.utils.isNull(this.values)) {
        if (!Array.isArray(this.values)) {
            return new PSE("Invalid 'values' in PreparedStatement '" + this.name + "': expected an array, null or undefined.");
        }
        ps.values = this.values;
    }
    return ps;
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
    var ps = this.parse();
    if (ps instanceof $npm.errors.PreparedStatementError) {
        return ps.toString();
    }
    var lines = [
        'PreparedStatement {',
        '    name: "' + ps.name + '"',
        '    text: "' + ps.text + '"'
    ];
    if (ps.values !== undefined) {
        lines.push('    values: ' + JSON.stringify(ps.values));
    }
    lines.push('}');
    return lines.join(EOL);
};

PreparedStatement.prototype.inspect = function () {
    return this.toString();
};

module.exports = PreparedStatement;
