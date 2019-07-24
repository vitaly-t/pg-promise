/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const {ServerFormatting} = require('./server-formatting');
const {QueryFile} = require('../query-file');
const assertOptions = require('assert-options');

const npm = {
    os: require('os'),
    utils: require('../utils'),
    errors: require('../errors')
};

/**
 * @class ParameterizedQuery
 * @description
 * **Alternative Syntax:** `ParameterizedQuery({text, values, ...})` &#8658; {@link ParameterizedQuery}
 *
 * Constructs a new {@link ParameterizedQuery} object.
 *
 * The alternative syntax supports advanced properties {@link ParameterizedQuery#binary binary} and {@link ParameterizedQuery#rowMode rowMode},
 * which are passed into $[pg], but not used by the class.
 *
 * All properties can also be set after the object's construction.
 *
 * This type extends the basic `{text, values}` object, by replacing it, i.e. when the basic object is used
 * with a query method, a new {@link ParameterizedQuery} object is created implicitly in its place.
 *
 * The type can be used in place of the `query` parameter, with any query method directly. And it never throws any error,
 * leaving it for query methods to reject with {@link errors.ParameterizedQueryError ParameterizedQueryError}.
 *
 * The type is available from the library's root: `pgp.ParameterizedQuery`.
 *
 * @param {string|QueryFile} text
 * A non-empty query string or a {@link QueryFile} object.
 *
 * Only the basic variables (`$1`, `$2`, etc) can be used in the query, because _Parameterized Queries_ are formatted by the database server.
 *
 * @param {array} [values]
 * Query formatting values. When it is not an `Array` and not `null`/`undefined`, it is automatically wrapped into an array.
 *
 * @returns {ParameterizedQuery}
 *
 * @see
 * {@link errors.ParameterizedQueryError ParameterizedQueryError}
 *
 * @example
 *
 * const PQ = require('pg-promise').ParameterizedQuery;
 *
 * // Creating a complete Parameterized Query with parameters:
 * const findUser = new PQ('SELECT * FROM Users WHERE id = $1', [123]);
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
 * const PQ = require('pg-promise').ParameterizedQuery;
 *
 * // Creating a reusable Parameterized Query without values:
 * const addUser = new PQ('INSERT INTO Users(name, age) VALUES($1, $2)');
 *
 * // setting values explicitly:
 * addUser.values = ['John', 30];
 *
 * db.none(addUser)
 *     .then(() => {
 *         // user added;
 *     })
 *     .catch(error=> {
 *         // error;
 *     });
 *
 * // setting values implicitly, by passing them into the query method:
 * db.none(addUser, ['Mike', 25])
 *     .then(() => {
 *         // user added;
 *     })
 *     .catch(error=> {
 *         // error;
 *     });
 *
 */
class ParameterizedQuery extends ServerFormatting {

    constructor(text, values) {
        super();

        const _i = {
            currentError: undefined,
            PQ: {},
            changed: true,
            state: {
                text,
                binary: undefined,
                rowMode: undefined
            },
            setValues(v) {
                if (Array.isArray(v)) {
                    if (v.length) {
                        _i.PQ.values = v;
                    } else {
                        delete _i.PQ.values;
                    }
                } else {
                    if (npm.utils.isNull(v)) {
                        delete _i.PQ.values;
                    } else {
                        _i.PQ.values = [v];
                    }
                }
            }
        };
        this._inner = _i; // private/inner state variable

        if (text && typeof text === 'object' && 'text' in text) {
            text = assertOptions(text, ['text', 'values', 'binary', 'rowMode']);
            _i.state.text = text.text;
            _i.state.binary = text.binary;
            _i.state.rowMode = text.rowMode;
            _i.setValues(text.values);
        } else {
            _i.setValues(values);
        }
    }

    /**
     * @name ParameterizedQuery#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
     */
    get text() {
        return this._inner.state.text;
    }

    set text(value) {
        const _i = this._inner;
        if (value !== _i.state.text) {
            _i.state.text = value;
            _i.changed = true;
        }
    }

    /**
     * @name ParameterizedQuery#values
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
        return this._inner.PQ.values;
    }

    set values(value) {
        this._inner.setValues(value);
    }

    /**
     * @name ParameterizedQuery#binary
     * @type {boolean}
     * @default undefined
     * @description
     * Activates binary result mode. The default is the text mode.
     *
     * @see {@link http://www.postgresql.org/docs/devel/static/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY Extended Query}
     */
    get binary() {
        return this._inner.state.binary;
    }

    set binary(value) {
        const _i = this._inner;
        if (value !== _i.state.binary) {
            _i.state.binary = value;
            _i.changed = true;
        }
    }

    /**
     * @name ParameterizedQuery#rowMode
     * @type {string}
     * @default undefined
     * @description
     * Changes the way data arrives to the client, with only one value supported by $[pg]:
     *  - `rowMode = 'array'` will make all data rows arrive as arrays of values.
     *    By default, rows arrive as objects.
     */
    get rowMode() {
        return this._inner.state.rowMode;
    }

    set rowMode(value) {
        const _i = this._inner;
        if (value !== _i.state.rowMode) {
            _i.state.rowMode = value;
            _i.changed = true;
        }
    }

    /**
     * @name ParameterizedQuery#error
     * @type {errors.ParameterizedQueryError}
     * @default undefined
     * @readonly
     * @description
     * When in an error state, it is set to a {@link errors.ParameterizedQueryError ParameterizedQueryError} object. Otherwise, it is `undefined`.
     *
     * This property is primarily for internal use by the library.
     */
    get error() {
        return this._inner.currentError;
    }

    /**
     * @method ParameterizedQuery#parse
     * @description
     * Parses the current object and returns a simple `{text, values}`, if successful,
     * or else it returns a {@link errors.ParameterizedQueryError ParameterizedQueryError} object.
     *
     * This method is primarily for internal use by the library.
     *
     * @returns {{text, values}|errors.ParameterizedQueryError}
     */
    parse() {

        const _i = this._inner;
        const qf = _i.state.text instanceof QueryFile ? _i.state.text : null;

        if (!_i.changed && !qf) {
            return _i.PQ;
        }

        const errors = [], values = _i.PQ.values;
        _i.PQ = {
            name: _i.state.name
        };
        _i.changed = true;
        _i.currentError = undefined;

        if (qf) {
            qf.prepare();
            if (qf.error) {
                _i.PQ.text = _i.state.text;
                errors.push(qf.error);
            } else {
                _i.PQ.text = qf[QueryFile.$query];
            }
        } else {
            _i.PQ.text = _i.state.text;
        }
        if (!npm.utils.isText(_i.PQ.text)) {
            errors.push('Property \'text\' must be a non-empty text string.');
        }

        if (!npm.utils.isNull(values)) {
            _i.PQ.values = values;
        }

        if (_i.state.binary !== undefined) {
            _i.PQ.binary = _i.state.binary;
        }

        if (_i.state.rowMode !== undefined) {
            _i.PQ.rowMode = _i.state.rowMode;
        }

        if (errors.length) {
            return _i.currentError = new npm.errors.ParameterizedQueryError(errors[0], _i.PQ);
        }

        _i.changed = false;

        return _i.PQ;
    }
}

/**
 * @method ParameterizedQuery#toString
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
ParameterizedQuery.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    const gap = npm.utils.messageGap(level + 1);
    const pq = this.parse();
    const lines = [
        'ParameterizedQuery {'
    ];
    if (npm.utils.isText(pq.text)) {
        lines.push(gap + 'text: "' + pq.text + '"');
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
    if (this.error !== undefined) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    }
    lines.push(npm.utils.messageGap(level) + '}');
    return lines.join(npm.os.EOL);
};

module.exports = {ParameterizedQuery};
