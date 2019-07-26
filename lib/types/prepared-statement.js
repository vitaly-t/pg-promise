/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const {ServerFormatting} = require('./server-formatting');
const {PreparedStatementError} = require('../errors');
const {QueryFile} = require('../query-file');
const {assertOptions} = require('assert-options');

const npm = {
    os: require('os'),
    utils: require('../utils'),
    errors: require('../errors')
};

/**
 * @class PreparedStatement
 * @description
 * Constructs a new $[Prepared Statement] object.
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
 * @param {} [options]
 * Object configuration options / properties.
 *
 * @param {string} [options.name]
 * An arbitrary name given to this particular prepared statement. It must be unique within a single session and is
 * subsequently used to execute or deallocate a previously prepared statement.
 *
 * @param {string|QueryFile} [options.text]
 * A non-empty query string or a {@link QueryFile} object.
 *
 * Only the basic variables (`$1`, `$2`, etc) can be used in the query, because $[Prepared Statements] are formatted by the database server.
 *
 * @param {array} [options.values]
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
 * const PS = require('pg-promise').PreparedStatement;
 *
 * // Creating a complete Prepared Statement with parameters:
 * const findUser = new PS({name: 'find-user', text: 'SELECT * FROM Users WHERE id = $1', values: [123]});
 *
 * db.one(findUser)
 *     .then(user => {
 *         // user found;
 *     })
 *     .catch(error => {
 *         // error;
 *     });
 *
 * @example
 *
 * const PS = require('pg-promise').PreparedStatement;
 *
 * // Creating a reusable Prepared Statement without values:
 * const addUser = new PS({name: 'add-user', text: 'INSERT INTO Users(name, age) VALUES($1, $2)'});
 *
 * // setting values explicitly:
 * addUser.values = ['John', 30];
 *
 * db.none(addUser)
 *     .then(() => {
 *         // user added;
 *     })
 *     .catch(error => {
 *         // error;
 *     });
 *
 * // setting values implicitly, by passing them into the query method:
 * db.none(addUser, ['Mike', 25])
 *     .then(() => {
 *         // user added;
 *     })
 *     .catch(error => {
 *         // error;
 *     });
 */
class PreparedStatement extends ServerFormatting {

    // TODO: Document advanced properties

    constructor(options) {
        super();

        options = assertOptions(options, ['name', 'text', 'values', 'binary', 'rowMode', 'rows']);

        const _i = {
            options,
            changed: true,
            currentError: undefined,
            PS: {},
            setValues(v) {
                if (Array.isArray(v)) {
                    if (v.length) {
                        _i.PS.values = v;
                    } else {
                        delete _i.PS.values;
                    }
                } else {
                    if (npm.utils.isNull(v)) {
                        delete _i.PS.values;
                    } else {
                        _i.PS.values = [v];
                    }
                }
            }
        };

        _i.setValues(options.values);

        npm.utils.addReadProp(this, '_inner', _i, true);
    }

    /**
     * @name PreparedStatement#name
     * @type {string}
     * @description
     * An arbitrary name given to this particular prepared statement. It must be unique within a single session and is
     * subsequently used to execute or deallocate a previously prepared statement.
     */
    get name() {
        return this._inner.options.name;
    }

    set name(value) {
        const _i = this._inner;
        if (value !== _i.options.name) {
            _i.options.name = value;
            _i.changed = true;
        }
    }

    /**
     * @name PreparedStatement#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
     *
     * Changing this property for the same {@link PreparedStatement#name name} will have no effect, because queries
     * for Prepared Statements are cached, with {@link PreparedStatement#name name} being the cache key.
     */
    get text() {
        return this._inner.options.text;
    }

    set text(value) {
        const _i = this._inner;
        if (value !== _i.options.text) {
            _i.options.text = value;
            _i.changed = true;
        }
    }

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
    get values() {
        return this._inner.PS.values;
    }

    set values(value) {
        this._inner.setValues(value);
    }

    /**
     * @name PreparedStatement#binary
     * @type {boolean}
     * @default undefined
     * @description
     * Activates binary result mode. The default is the text mode.
     *
     * @see {@link http://www.postgresql.org/docs/devel/static/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY Extended Query}
     */
    get binary() {
        return this._inner.options.binary;
    }

    set binary(value) {
        const _i = this._inner;
        if (value !== _i.options.binary) {
            _i.options.binary = value;
            _i.changed = true;
        }
    }

    /**
     * @name PreparedStatement#rowMode
     * @type {string}
     * @default undefined
     * @description
     * Changes the way data arrives to the client, with only one value supported by $[pg]:
     *  - `rowMode = 'array'` will make all data rows arrive as arrays of values.
     *    By default, rows arrive as objects.
     */
    get rowMode() {
        return this._inner.options.rowMode;
    }

    set rowMode(value) {
        const _i = this._inner;
        if (value !== _i.options.rowMode) {
            _i.options.rowMode = value;
            _i.changed = true;
        }
    }

    /**
     * @name PreparedStatement#rows
     * @type {number}
     * @description
     * Number of rows to return at a time from a Prepared Statement's portal.
     * The default is 0, which means that all rows must be returned at once.
     */
    get rows() {
        return this._inner.options.rows;
    }

    set rows(value) {
        const _i = this._inner;
        if (value !== _i.options.rows) {
            _i.options.rows = value;
            _i.changed = true;
        }
    }

    /**
     * @name PreparedStatement#error
     * @type {errors.PreparedStatementError}
     * @default undefined
     * @description
     * When in an error state, it is set to a {@link errors.PreparedStatementError PreparedStatementError} object. Otherwise, it is `undefined`.
     *
     * This property is primarily for internal use by the library.
     */
    get error() {
        return this._inner.currentError;
    }

    /**
     * @method PreparedStatement#parse
     * @description
     * Parses the current object and returns a simple `{name, text, values}`, if successful,
     * or else it returns a {@link errors.PreparedStatementError PreparedStatementError} object.
     *
     * This method is primarily for internal use by the library.
     *
     * @returns {{name, text, values}|errors.PreparedStatementError}
     */
    parse() {

        const _i = this._inner, options = _i.options;

        const qf = options.text instanceof QueryFile ? options.text : null;

        if (!_i.changed && !qf) {
            return _i.PS;
        }

        const errors = [], values = _i.PS.values;
        _i.PS = {
            name: options.name,
            text: options.text
        };
        _i.changed = true;
        _i.currentError = undefined;

        if (!npm.utils.isText(_i.PS.name)) {
            errors.push('Property \'name\' must be a non-empty text string.');
        }

        if (qf) {
            qf.prepare();
            if (qf.error) {
                errors.push(qf.error);
            } else {
                _i.PS.text = qf[QueryFile.$query];
            }
        }
        if (!npm.utils.isText(_i.PS.text)) {
            errors.push('Property \'text\' must be a non-empty text string.');
        }

        if (!npm.utils.isNull(values)) {
            _i.PS.values = values;
        }

        if (options.binary !== undefined) {
            _i.PS.binary = !!options.binary;
        }

        if (options.rowMode !== undefined) {
            _i.PS.rowMode = options.rowMode;
        }

        if (options.rows !== undefined) {
            _i.PS.rows = options.rows;
        }

        if (errors.length) {
            return _i.currentError = new PreparedStatementError(errors[0], _i.PS);
        }

        _i.changed = false;

        return _i.PS;
    }
}

/**
 * @method PreparedStatement#toString
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
    const gap = npm.utils.messageGap(level + 1);
    const ps = this.parse();
    const lines = [
        'PreparedStatement {',
        gap + 'name: ' + JSON.stringify(this.name)
    ];
    if (npm.utils.isText(ps.text)) {
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
    lines.push(npm.utils.messageGap(level) + '}');
    return lines.join(npm.os.EOL);
};

module.exports = {PreparedStatement};
