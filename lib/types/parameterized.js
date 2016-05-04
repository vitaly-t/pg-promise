'use strict';

var $npm = {
    os: require('os'),
    utils: require('../utils'),
    errors: require('../errors'),
    QueryFile: require('../queryFile')
};

var advancedProperties = ['binary', 'rowMode'];

/**
 * @constructor ParameterizedQuery
 * @description
 * **Alternative Syntax:** `ParameterizedQuery({text, values, ...})` &#8658; {@link ParameterizedQuery}
 *
 * Constructs a new {@link ParameterizedQuery} object.
 *
 * The alternative syntax supports advanced properties - `binary` and `rowMode`, which are passed into $[pg],
 * but not used by the class. All properties can also be set after the object's construction.
 *
 * This type extends the basic `{text, values}` object, by replacing it, i.e. when the basic object is used with a query method,
 * a new {@link ParameterizedQuery} object is created implicitly in its place.
 *
 * The type can be used in place of the `query` parameter, with any query method directly. And it never throws any error,
 * leaving it for query methods to reject with {@link ParameterizedQueryError}.
 *
 * The type is available from the library's root: `pgp.ParameterizedQuery`.
 *
 * @param {string|QueryFile} text
 * A non-empty query string or a {@link QueryFile} object.
 *
 * @param {Array} [values]
 * Query formatting values. It can be either an `Array` or `null`/`undefined`.
 *
 * @returns {ParameterizedQuery}
 *
 * @see
 * {@link ParameterizedQueryError}
 *
 * @example
 *
 * var PQ = require('pg-promise').ParameterizedQuery;
 *
 * // Creating a complete Parameterized Query:
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
 * // Creating a reusable Parameterized Query:
 * var addUser = new PQ('INSERT INTO Users(name, age) VALUES($1, $2)');
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
function ParameterizedQuery(text, values) {
    if (!(this instanceof ParameterizedQuery)) {
        return new ParameterizedQuery(text, values);
    }

    /**
     * @name ParameterizedQuery#text
     * @type {string|QueryFile}
     * @description
     * A non-empty query string or a {@link QueryFile} object.
     */
    this.text = text;

    /**
     * @name ParameterizedQuery#values
     * @type {Array}
     * @description
     * Query formatting values. It can be either an `Array` or `null`/`undefined`.
     */
    this.values = values;

    /**
     * @name ParameterizedQuery#error
     * @type {ParameterizedQueryError}
     * @description
     * When in an error state, it is set to a {@link ParameterizedQueryError} object. Otherwise, it is `undefined`.
     *
     * This property is meant primarily for internal use by the library.
     */
    this.error = undefined;

    if ($npm.utils.isObject(text, ['text'])) {
        this.text = text.text;
        this.values = text.values;

        advancedProperties.forEach(function (prop) {
            this[prop] = text[prop];
        }, this);
    }

    /**
     * @method ParameterizedQuery.parse
     * @description
     * Parses the current object and returns a simple Parameterized Query `{text, values}`,
     * if successful, or else returns a {@link ParameterizedQueryError} object.
     *
     * This method is meant primarily for internal use by the library.
     *
     * @returns {{text, values}|ParameterizedQueryError}
     */
    this.parse = function () {
        this.error = undefined;
        var errors = [], pq = {};
        if (this.text instanceof $npm.QueryFile) {
            var qf = this.text;
            qf.prepare();
            if (qf.error) {
                pq.text = this.text;
                errors.push(qf.error);
            } else {
                pq.text = qf.query;
            }
        } else {
            pq.text = this.text;
        }
        if (!$npm.utils.isText(pq.text)) {
            errors.push("Property 'text' must be a non-empty text string.");
        }
        if (!$npm.utils.isNull(this.values)) {
            if (Array.isArray(this.values)) {
                if (this.values.length > 0) {
                    pq.values = this.values;
                }
            } else {
                errors.push("Property 'values' must be an array or null/undefined.");
            }
        }

        advancedProperties.forEach(function (prop) {
            if (this[prop] !== undefined) {
                pq[prop] = this[prop];
            }
        }, this);

        if (errors.length) {
            this.error = new $npm.errors.ParameterizedQueryError(errors[0], pq);
            return this.error;
        }

        return pq;
    };

    Object.seal(this);
}

/**
 * @method ParameterizedQuery.toString
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
ParameterizedQuery.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    var gap = $npm.utils.messageGap(level + 1);
    var ps = this.parse();
    var lines = [
        'ParameterizedQuery {',
        gap + 'text: ' + JSON.stringify(ps.text)
    ];
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

module.exports = ParameterizedQuery;
