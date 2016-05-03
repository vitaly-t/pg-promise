'use strict';

var $npm = {
    os: require('os'),
    utils: require('./utils'),
    errors: require('./errors'),
    QueryFile: require('./queryFile')
};

var advancedProperties = ['binary', 'portal', 'rowMode', 'rows', 'stream', 'types'];

/**
 * @constructor PreparedStatement
 * @description
 * **Alternative Syntax:** `PreparedStatement({name, text, values, ...})` &#8658; {@link PreparedStatement}
 *
 * Constructs a {@link http://www.postgresql.org/docs/9.5/static/sql-prepare.html Prepared Statement} object.
 *
 * The alternative syntax supports advanced properties - `binary`, `portal`, `rowMode`, `rows`, `stream` and `types`,
 * which are passed into $[pg], but not used by the class. All properties can also be set after the object's construction.
 *
 * This type extends the basic `{name, text, values}` object, by replacing it, i.e. when the basic object is used
 * with a query method, a new {@link PreparedStatement} object is created implicitly in its place.
 *
 * The type can be used in place of the `query` parameter, with any query method directly. And it never throws any error,
 * leaving it for query methods to reject with {@link PreparedStatementError}.
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
 * @see
 * {@link PreparedStatementError},
 * {@link http://www.postgresql.org/docs/9.5/static/sql-prepare.html PostgreSQL Prepared Statements}
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

    var lastSessionId = -1, state = {
        name: name,
        text: text
    };

    /**
     * @name PreparedStatement#name
     * @type {string}
     * @description
     * An arbitrary name given to this particular prepared statement. It must be unique within a single session and is
     * subsequently used to execute or deallocate a previously prepared statement.
     */
    Object.defineProperty(this, 'name', {
        get: function () {
            return state.name;
        },
        set: function (value) {
            if (state.name !== value) {
                state.name = value;
                lastSessionId = -1;
            }
        }
    });

    /**
     * @name PreparedStatement#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
     */
    Object.defineProperty(this, 'text', {
        get: function () {
            return state.text;
        },
        set: function (value) {
            if (state.text !== value) {
                state.text = value;
                lastSessionId = -1;
            }
        }
    });

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

        advancedProperties.forEach(function (prop) {
            this[prop] = name[prop];
        }, this);
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
    this.parse = function (sessionId) {
        this.error = undefined;
        var errors = [], ps = {
            name: this.name
        };
        if (!$npm.utils.isText(this.name)) {
            errors.push("Property 'name' must be a non-empty text string.");
        }
        if (this.text instanceof $npm.QueryFile) {
            var qf = this.text, prevQuery = qf.query;
            qf.prepare();
            if (qf.error) {
                ps.text = this.text;
                errors.push(qf.error);
            } else {
                if (sessionId === lastSessionId) {
                    if (qf.query !== prevQuery) {
                        ps.text = qf.query;
                    }
                } else {
                    lastSessionId = sessionId || lastSessionId;
                    if (sessionId || lastSessionId < 0) {
                        ps.text = qf.query;
                    }
                }
            }
        } else {
            if ((sessionId || lastSessionId < 0) && sessionId !== lastSessionId) {
                lastSessionId = sessionId || lastSessionId;
                ps.text = this.text;
            }
        }
        if ('text' in ps && !$npm.utils.isText(ps.text)) {
            errors.push("Property 'text' must be a non-empty text string.");
        }
        if (!$npm.utils.isNull(this.values)) {
            if (Array.isArray(this.values)) {
                if (this.values.length > 0) {
                    ps.values = this.values;
                }
            } else {
                errors.push("Property 'values' must be an array or null/undefined.");
            }
        }

        advancedProperties.forEach(function (prop) {
            if (this[prop] !== undefined) {
                ps[prop] = this[prop];
            }
        }, this);

        if (errors.length) {
            this.error = new $npm.errors.PreparedStatementError(errors[0], ps);
            return this.error;
        }

        return ps;
    };

    Object.seal(this);
}

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
    advancedProperties.forEach(function (prop) {
        if (this[prop] !== undefined) {
            lines.push(gap + prop + ': ' + JSON.stringify(this[prop]));
        }
    }, this);
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
