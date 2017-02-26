'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    errors: require('../errors'),
    QueryFile: require('../queryFile')
};

/**
 * @constructor PreparedStatement
 * @description
 * **Alternative Syntax:** `PreparedStatement({name, text, values, ...})` &#8658; {@link PreparedStatement}
 *
 * Constructs a new $[Prepared Statement] object.
 *
 * The alternative syntax supports advanced properties {@link PreparedStatement#binary binary}, {@link PreparedStatement#rowMode rowMode}
 * and {@link PreparedStatement#rows rows}, which are passed into $[pg], but not used by the class.
 *
 * All properties can also be set after the object's construction.
 *
 * This type extends the basic `{name, text, values}` object, by replacing it, i.e. when the basic object is used
 * with a query method, a new {@link PreparedStatement} object is created implicitly in its place.
 *
 * The type can be used in place of the `query` parameter, with any query method directly. And it never throws any error,
 * leaving it for query methods to reject with {@link errors.PreparedStatementError PreparedStatementError}.
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
 * Only the basic variables (`$1`, `$2`, etc) can be used in the query, because $[Prepared Statements] are formatted by the database server.
 *
 * @param {array} [values]
 * Query formatting values. When it is not an `Array` and not `null`/`undefined`, it is automatically wrapped into an array.
 *
 * @returns {PreparedStatement}
 *
 * @see
 * {@link errors.PreparedStatementError PreparedStatementError},
 * {@link http://www.postgresql.org/docs/9.5/static/sql-prepare.html PostgreSQL Prepared Statements}
 *
 * @example
 *
 * var PS = require('pg-promise').PreparedStatement;
 *
 * // Creating a complete Prepared Statement with parameters:
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
 * // Creating a reusable Prepared Statement without values:
 * var addUser = new PS('add-user', 'INSERT INTO Users(name, age) VALUES($1, $2)');
 *
 * // setting values explicitly:
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
 * // setting values implicitly, by passing them into the query method:
 * db.none(addUser, ['Mike', 25])
 *     .then(()=> {
 *         // user added;
 *     })
 *     .catch(error=> {
 *         // error;
 *     });
 */
function PreparedStatement(name, text, values) {
    if (!(this instanceof PreparedStatement)) {
        return new PreparedStatement(name, text, values);
    }

    var currentError, PS = {}, changed = true, state = {
        name: name,
        text: text,
        binary: undefined,
        rowMode: undefined,
        rows: undefined
    };

    function setValues(v) {
        if (Array.isArray(v)) {
            if (v.length) {
                PS.values = v;
            } else {
                delete PS.values;
            }
        } else {
            if ($npm.utils.isNull(v)) {
                delete PS.values;
            } else {
                PS.values = [v];
            }
        }
    }

    setValues(values);

    /**
     * @name PreparedStatement#name
     * @type {string}
     * @description
     * An arbitrary name given to this particular prepared statement. It must be unique within a single session and is
     * subsequently used to execute or deallocate a previously prepared statement.
     */
    Object.defineProperty(this, 'name', {
        get: () => state.name,
        set: value => {
            if (value !== state.name) {
                state.name = value;
                changed = true;
            }
        }
    });

    /**
     * @name PreparedStatement#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
     *
     * Changing this property for the same {@link PreparedStatement#name name} will have no effect, because queries
     * for Prepared Statements are cached, with {@link PreparedStatement#name name} being the cache key.
     */
    Object.defineProperty(this, 'text', {
        get: () => state.text,
        set: value => {
            if (value !== state.text) {
                state.text = value;
                changed = true;
            }
        }
    });

    /**
     * @name PreparedStatement#values
     * @type {array}
     * @description
     * Query formatting parameters, depending on the type:
     *
     * - `null` / `undefined` means the query has no formatting parameters
     * - `Array` - it is an array of formatting parameters
     * - None of the above, means it is a single formatting value, which
     *   is then automatically wrapped into an array
     */
    Object.defineProperty(this, 'values', {
        get: () => PS.values,
        set: value => {
            setValues(value);
        }
    });

    /**
     * @name PreparedStatement#binary
     * @type {boolean}
     * @default undefined
     * @description
     * Activates binary result mode. The default is the text mode.
     *
     * @see {@link http://www.postgresql.org/docs/devel/static/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY Extended Query}
     */
    Object.defineProperty(this, 'binary', {
        get: () => state.binary,
        set: value => {
            if (value !== state.binary) {
                state.binary = value;
                changed = true;
            }
        }
    });

    /**
     * @name PreparedStatement#rowMode
     * @type {string}
     * @default undefined
     * @description
     * Changes the way data arrives to the client, with only one value supported by $[pg]:
     *  - `rowMode = 'array'` will make all data rows arrive as arrays of values.
     *    By default, rows arrive as objects.
     */
    Object.defineProperty(this, 'rowMode', {
        get: () => state.rowMode,
        set: value => {
            if (value !== state.rowMode) {
                state.rowMode = value;
                changed = true;
            }
        }
    });

    /**
     * @name PreparedStatement#rows
     * @type {number}
     * @description
     * Number of rows to return at a time from a Prepared Statement's portal.
     * The default is 0, which means that all rows must be returned at once.
     */
    Object.defineProperty(this, 'rows', {
        get: () => state.rows,
        set: value => {
            if (value !== state.rows) {
                state.rows = value;
                changed = true;
            }
        }
    });

    /**
     * @name PreparedStatement#error
     * @type {errors.PreparedStatementError}
     * @default undefined
     * @description
     * When in an error state, it is set to a {@link errors.PreparedStatementError PreparedStatementError} object. Otherwise, it is `undefined`.
     *
     * This property is primarily for internal use by the library.
     */
    Object.defineProperty(this, 'error', {
        get: () => currentError
    });

    if ($npm.utils.isObject(name, ['name'])) {
        state.name = name.name;
        state.text = name.text;
        state.binary = name.binary;
        state.rowMode = name.rowMode;
        state.rows = name.rows;
        setValues(name.values);
    }

    /**
     * @method PreparedStatement.parse
     * @description
     * Parses the current object and returns a simple `{name, text, values}`, if successful,
     * or else it returns a {@link errors.PreparedStatementError PreparedStatementError} object.
     *
     * This method is primarily for internal use by the library.
     *
     * @returns {{name, text, values}|errors.PreparedStatementError}
     */
    this.parse = () => {

        var qf = state.text instanceof $npm.QueryFile ? state.text : null;

        if (!changed && !qf) {
            return PS;
        }

        var errors = [], values = PS.values;
        PS = {
            name: state.name
        };
        changed = true;
        currentError = undefined;

        if (!$npm.utils.isText(PS.name)) {
            errors.push('Property \'name\' must be a non-empty text string.');
        }

        if (qf) {
            qf.prepare();
            if (qf.error) {
                PS.text = state.text;
                errors.push(qf.error);
            } else {
                PS.text = qf.query;
            }
        } else {
            PS.text = state.text;
        }
        if (!$npm.utils.isText(PS.text)) {
            errors.push('Property \'text\' must be a non-empty text string.');
        }

        if (!$npm.utils.isNull(values)) {
            PS.values = values;
        }

        if (state.binary !== undefined) {
            PS.binary = state.binary;
        }

        if (state.rowMode !== undefined) {
            PS.rowMode = state.rowMode;
        }

        if (state.rows !== undefined) {
            PS.rows = state.rows;
        }

        if (errors.length) {
            return currentError = new $npm.errors.PreparedStatementError(errors[0], PS);
        }

        changed = false;

        return PS;
    };
}

/**
 * @method PreparedStatement.toString
 * @description
 * Creates a well-formatted multi-line string that represents the object's current state.
 *
 * It is called automatically when writing the object into the console.
 *
 * @param {number} [level=0]
 * Nested output level, to provide visual offset.
 *
 * @returns {string}
 */
PreparedStatement.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap = $npm.utils.messageGap(level + 1);
    var ps = this.parse();
    var lines = [
        'PreparedStatement {',
        gap + 'name: ' + JSON.stringify(this.name)
    ];
    if ($npm.utils.isText(ps.text)) {
        lines.push(gap + 'text: "' + ps.text + '"');
    }
    if (this.values !== undefined) {
        lines.push(gap + 'values: ' + JSON.stringify(this.values));
    }
    if (this.binary !== undefined) {
        lines.push(gap + 'binary: ' + JSON.stringify(this.binary));
    }
    if (this.rowMode !== undefined) {
        lines.push(gap + 'rowMode: ' + JSON.stringify(this.rowMode));
    }
    if (this.rows !== undefined) {
        lines.push(gap + 'rows: ' + JSON.stringify(this.rows));
    }
    if (this.error) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    }
    lines.push($npm.utils.messageGap(level) + '}');
    return lines.join($npm.os.EOL);
};

module.exports = PreparedStatement;

