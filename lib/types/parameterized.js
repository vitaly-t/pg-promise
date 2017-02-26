'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    errors: require('../errors'),
    QueryFile: require('../queryFile')
};

/**
 * @constructor ParameterizedQuery
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
 * var PQ = require('pg-promise').ParameterizedQuery;
 *
 * // Creating a complete Parameterized Query with parameters:
 * var findUser = new PQ('SELECT * FROM Users WHERE id = $1', [123]);
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
 * var PQ = require('pg-promise').ParameterizedQuery;
 *
 * // Creating a reusable Parameterized Query without values:
 * var addUser = new PQ('INSERT INTO Users(name, age) VALUES($1, $2)');
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
 *
 */
function ParameterizedQuery(text, values) {
    if (!(this instanceof ParameterizedQuery)) {
        return new ParameterizedQuery(text, values);
    }

    var currentError, PQ = {}, changed = true, state = {
        text: text,
        binary: undefined,
        rowMode: undefined
    };

    function setValues(v) {
        if (Array.isArray(v)) {
            if (v.length) {
                PQ.values = v;
            } else {
                delete PQ.values;
            }
        } else {
            if ($npm.utils.isNull(v)) {
                delete PQ.values;
            } else {
                PQ.values = [v];
            }
        }
    }

    setValues(values);

    /**
     * @name ParameterizedQuery#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
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
    Object.defineProperty(this, 'values', {
        get: () => PQ.values,
        set: value => {
            setValues(value);
        }
    });

    /**
     * @name ParameterizedQuery#binary
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
     * @name ParameterizedQuery#rowMode
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
     * @name ParameterizedQuery#error
     * @type {errors.ParameterizedQueryError}
     * @default undefined
     * @readonly
     * @description
     * When in an error state, it is set to a {@link errors.ParameterizedQueryError ParameterizedQueryError} object. Otherwise, it is `undefined`.
     *
     * This property is primarily for internal use by the library.
     */
    Object.defineProperty(this, 'error', {
        get: () => currentError
    });

    if ($npm.utils.isObject(text, ['text'])) {
        state.text = text.text;
        state.binary = text.binary;
        state.rowMode = text.rowMode;
        setValues(text.values);
    }

    /**
     * @method ParameterizedQuery.parse
     * @description
     * Parses the current object and returns a simple `{text, values}`, if successful,
     * or else it returns a {@link errors.ParameterizedQueryError ParameterizedQueryError} object.
     *
     * This method is primarily for internal use by the library.
     *
     * @returns {{text, values}|errors.ParameterizedQueryError}
     */
    this.parse = () => {

        var qf = state.text instanceof $npm.QueryFile ? state.text : null;

        if (!changed && !qf) {
            return PQ;
        }

        var errors = [], values = PQ.values;
        PQ = {
            name: state.name
        };
        changed = true;
        currentError = undefined;

        if (qf) {
            qf.prepare();
            if (qf.error) {
                PQ.text = state.text;
                errors.push(qf.error);
            } else {
                PQ.text = qf.query;
            }
        } else {
            PQ.text = state.text;
        }
        if (!$npm.utils.isText(PQ.text)) {
            errors.push('Property \'text\' must be a non-empty text string.');
        }

        if (!$npm.utils.isNull(values)) {
            PQ.values = values;
        }

        if (state.binary !== undefined) {
            PQ.binary = state.binary;
        }

        if (state.rowMode !== undefined) {
            PQ.rowMode = state.rowMode;
        }

        if (errors.length) {
            return currentError = new $npm.errors.ParameterizedQueryError(errors[0], PQ);
        }

        changed = false;

        return PQ;
    };
}

/**
 * @method ParameterizedQuery.toString
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
    var gap = $npm.utils.messageGap(level + 1);
    var pq = this.parse();
    var lines = [
        'ParameterizedQuery {'
    ];
    if ($npm.utils.isText(pq.text)) {
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
    lines.push($npm.utils.messageGap(level) + '}');
    return lines.join($npm.os.EOL);
};

module.exports = ParameterizedQuery;
