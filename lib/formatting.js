'use strict';

var $arr = require('../lib/array');

// Format Modification Flags;
var fmFlags = {
    raw: 1, // Raw-Text variable
    name: 2, // SQL Name/Identifier
    json: 4, // JSON modifier
    csv: 8, // CSV modifier
    value: 16 // escaped, but without ''
};

// Format Modification Map;
var fmMap = {
    '^': fmFlags.raw,
    ':raw': fmFlags.raw,
    '~': fmFlags.name,
    ':name': fmFlags.name,
    ':json': fmFlags.json,
    ':csv': fmFlags.csv,
    ':value': fmFlags.value,
    '#': fmFlags.value
};

////////////////////////////////////////////////////
// Converts a single value into its Postgres format.
function formatValue(value, fm, obj) {

    if (value instanceof Function) {
        return formatValue(resolveFunc(value, obj), fm, obj);
    }

    if (value && typeof value === 'object') {
        var ctf = value['formatDBType']; // custom type formatting;
        if (ctf instanceof Function) {
            fm |= value._rawDBType ? fmFlags.raw : 0;
            return formatValue(resolveFunc(ctf, value), fm, obj);
        }
    }

    var isRaw = !!(fm & fmFlags.raw);
    fm &= ~fmFlags.raw;

    switch (fm) {
        case fmFlags.name:
            return $as.name(value);
        case fmFlags.json:
            return $as.json(value, isRaw);
        case fmFlags.csv:
            return $as.csv(value);
        case fmFlags.value:
            return $as.value(value);
        default:
            break;
    }

    if (isNull(value)) {
        throwIfRaw(isRaw);
        return 'null';
    }

    switch (typeof value) {
        case 'string':
            return $as.text(value, isRaw);
        case 'boolean':
            return $as.bool(value);
        case 'number':
            return $as.number(value);
        default:
            if (value instanceof Date) {
                return $as.date(value, isRaw);
            }
            if (value instanceof Array) {
                return $as.array(value);
            }
            if (value instanceof Buffer) {
                return $as.buffer(value, isRaw);
            }
            return $as.json(value, isRaw);
    }
}

//////////////////////////////////////////////////////////////////////////
// Converts array of values into PostgreSQL Array Constructor: array[...],
// as per PostgreSQL documentation: http://www.postgresql.org/docs/9.4/static/arrays.html
// Arrays of any depth/dimension are supported.
function formatArray(array) {
    function loop(a) {
        return '[' + $arr.map(a, function (v) {
                return v instanceof Array ? loop(v) : formatValue(v);
            }).join() + ']';
    }

    return 'array' + loop(array);
}

///////////////////////////////////////////////////////////////
// Formats array of javascript-type parameters as a csv string,
// so it can be passed into a PostgreSQL function.
// Both single value and array or values are supported.
function formatCSV(values) {
    if (values instanceof Array) {
        return $arr.map(values, function (v) {
            return formatValue(v);
        }).join();
    }
    return values === undefined ? '' : formatValue(values);
}

///////////////////////////////
// Query formatting helpers;
var formatAs = {

    object: function (query, obj, raw, options) {
        var pattern = /\$(?:({)|(\()|(<)|(\[)|(\/))\s*[a-zA-Z0-9\$_]+(\^|~|#|:raw|:name|:json|:csv|:value)?\s*(?:(?=\2)(?=\3)(?=\4)(?=\5)}|(?=\1)(?=\3)(?=\4)(?=\5)\)|(?=\1)(?=\2)(?=\4)(?=\5)>|(?=\1)(?=\2)(?=\3)(?=\5)]|(?=\1)(?=\2)(?=\3)(?=\4)\/)/g;
        var partial = options && options.partial;
        return query.replace(pattern, function (name) {
            var v = formatAs.stripName(name.replace(/^\$[{(<[/]|[\s})>\]/]/g, ''), raw);
            if (v.name in obj) {
                return formatValue(obj[v.name], v.fm, obj);
            }
            if (v.name === 'this') {
                return formatValue(obj, v.fm);
            }
            if (partial) {
                return name;
            }
            // property must exist as the object's own or inherited;
            throw new Error("Property '" + v.name + "' doesn't exist.");
        });
    },

    array: function (query, array, raw, options) {
        var partial = options && options.partial;
        return query.replace(/\$([1-9][0-9]{0,3}(?![0-9])(\^|~|#|:raw|:name|:json|:csv|:value)?)/g, function (name) {
            var v = formatAs.stripName(name.substr(1), raw);
            var idx = v.name - 1;
            if (idx < array.length) {
                return formatValue(array[idx], v.fm);
            }
            if (partial) {
                return name;
            }
            throw new RangeError("Variable $" + v.name + " out of range. Parameters array length: " + array.length);
        });
    },

    value: function (query, value, raw) {
        return query.replace(/\$1(?![0-9])(\^|~|#|:raw|:name|:json|:csv|:value)?/g, function (name) {
            var v = formatAs.stripName(name, raw);
            return formatValue(value, v.fm);
        });
    },

    stripName: function (name, raw) {
        var mod = name.match(/\^|~|#|:raw|:name|:json|:csv|:value/);
        if (mod) {
            return {
                name: name.substr(0, mod.index),
                fm: fmMap[mod[0]] | (raw ? fmFlags.raw : 0)
            };
        } else {
            return {
                name: name,
                fm: raw ? fmFlags.raw : null
            };
        }
    }
};

////////////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === undefined || value === null;
}

/////////////////////////////////////////
// Wraps a text string in single quotes;
function TEXT(text) {
    return "'" + text + "'";
}

////////////////////////////////////////////////
// Replaces each single-quote symbol ' with two,
// for compliance with PostgreSQL strings.
function safeText(text) {
    return text.replace(/'/g, "''");
}

/////////////////////////////////////////////
// Throws an exception, if flag 'raw' is set.
function throwIfRaw(raw) {
    if (raw) {
        throw new TypeError("Values null/undefined cannot be used as raw text.");
    }
}

////////////////////////////////////////////
// Recursively resolves parameter-function,
// with the optional calling context.
function resolveFunc(value, obj) {
    while (value instanceof Function) {
        value = obj ? value.call(obj) : value();
    }
    return value;
}

///////////////////////////////////////////////////////////////////////////////////
// 'pg-promise' query formatting solution;
//
// It implements two types of formatting, depending on the 'values' passed:
//
// 1. format "$1, $2, etc", when 'values' is of type string, boolean, number, date,
//    function or null (or an array of the same types, plus undefined values);
// 2. format $*propName*, when 'values' is an object (not null and not Date),
//    and where * is any of the supported open-close pairs: {}, (), [], <>, //
//
// NOTES:
// 1. Raw-text values can be injected using syntax: $1^,$2^,... or $*propName^*
// 2. If 'values' is an object that supports function formatDBType, either its
//    own or inherited, the actual value and the formatting syntax are determined
//    by the result returned from that function.
//
// When formatting fails, the function throws an error.
function $formatQuery(query, values, raw, options) {
    if (typeof query !== 'string') {
        throw new TypeError("Parameter 'query' must be a text string.");
    }
    if (values && typeof values === 'object') {
        var ctf = values['formatDBType']; // custom type formatting;
        if (ctf instanceof Function) {
            return $formatQuery(query, resolveFunc(ctf, values), raw || values._rawDBType, options);
        }
        if (values instanceof Array) {
            // $1, $2,... formatting to be applied;
            return formatAs.array(query, values, raw, options);
        }
        if (!(values instanceof Date || values instanceof Buffer)) {
            // $*propName* formatting to be applied;
            return formatAs.object(query, values, raw, options);
        }
    }
    // $1 formatting to be applied, if values != undefined;
    return values === undefined ? query : formatAs.value(query, values, raw);
}

//////////////////////////////////////////////////////
// Formats a standard PostgreSQL function call query;
function $formatFunction(funcName, values, capSQL) {
    var sql = capSQL ? 'SELECT * FROM ' : 'select * from ';
    return sql + funcName + '(' + formatCSV(values) + ')';
}

/**
 * @namespace formatting
 * @description
 * Namespace for all query-formatting functions.
 */
var $as = {

    /**
     * @method formatting.text
     * @description
     * Converts a value into PostgreSQL text presentation, escaped as required.
     *
     * Escaping the result means:
     *  1. Every single-quote (apostrophe) is replaced with two
     *  2. The resulting text is wrapped in apostrophes
     *
     * @param {value|function} value
     * Value to be converted, or a function that returns the value.
     *
     * If the `value` resolves as `null` or `undefined`, while `raw`=`true`,
     * it will throw {@link external:TypeError TypeError} = `Values null/undefined cannot be used as raw text.`
     *
     * @param {boolean} [raw=false]
     * Indicates when not to escape the resulting text.
     *
     * @returns {string}
     *
     * - `null` string, if the `value` resolves as `null` or `undefined`
     * - escaped result of `value.toString()`, if the `value` isn't a string
     * - escaped string version, if `value` is a string.
     *
     *  The result is not escaped, if `raw` was passed in as `true`.
     */
    text: function (value, raw) {
        value = resolveFunc(value);
        if (isNull(value)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof value !== 'string') {
            value = value.toString();
        }
        return raw ? value : TEXT(safeText(value));
    },

    /**
     * @method formatting.name
     * @description
     * Properly escapes an sql name or identifier, fixing double-quote symbols
     * and wrapping the result in double quotes.
     *
     * Implements a safe way to format SQL Names that neutralizes SQL Injection.
     *
     * @param {String|function} name
     * SQL name or identifier, or a function that returns it.
     *
     * The name must be at least 1 character long.
     *
     * If `name` doesn't resolve into a non-empty string, it throws {@link external:TypeError TypeError} = `An sql name/identifier must be a non-empty text string.`
     *
     * @returns {string}
     * The SQL Name/Identifier properly escaped for compliance with the PostgreSQL standard
     * for SQL names and identifiers.
     */
    name: function (name) {
        name = resolveFunc(name);
        if (typeof name !== 'string' || !name.length) {
            throw new TypeError("An sql name/identifier must be a non-empty text string.");
        }
        // replace each double quote with two, and then wrap in double quotes;
        // NOTE: Escaping double-quotes within the name prevents SQL injection.
        return '"' + name.replace(/"/g, '""') + '"';
    },

    /**
     * @method formatting.value
     * @description
     * Represents an open value, one to be formatted according to its type, properly escaped,
     * but without surrounding quotes for text types.
     *
     * @param {value|function} value
     * Value to be converted, or a function that returns the value.
     *
     * If `value` resolves as `null` or `undefined`, it will throw {@link external:TypeError TypeError} = `Open values cannot be null or undefined.`
     *
     * @returns {string}
     * Formatted and properly escaped string, but without surrounding quotes for text types.
     */
    value: function (value) {
        value = resolveFunc(value);
        if (isNull(value)) {
            throw new TypeError("Open values cannot be null or undefined.");
        }
        return safeText(formatValue(value, fmFlags.raw));
    },

    /**
     * @method formatting.buffer
     * @description
     * Converts an object of type `Buffer` into a hex string compatible with PostgreSQL type `bytea`.
     *
     * @param {Buffer|function} obj
     * Object to be converted, or a function that returns one.
     *
     * @param {boolean} [raw=false]
     * Indicates when not to wrap the resulting string in quotes.
     *
     * The generated hex string doesn't need to be escaped.
     *
     * @returns {string}
     */
    buffer: function (obj, raw) {
        obj = resolveFunc(obj);
        if (isNull(obj)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (obj instanceof Buffer) {
            var s = "\\x" + obj.toString("hex");
            return raw ? s : TEXT(s);
        }
        throw new TypeError(TEXT(obj) + " is not a Buffer object.");
    },

    /**
     * @method formatting.bool
     * @description
     * Converts a truthy value into PostgreSQL boolean presentation.
     *
     * @param {boolean|function} value
     * Value to be converted, or a function that returns the value.
     *
     * @returns {string}
     */
    bool: function (value) {
        value = resolveFunc(value);
        if (isNull(value)) {
            return 'null';
        }
        return value ? 'true' : 'false';
    },

    /**
     * @method formatting.date
     * @description
     * Converts a `Date`-type value into PostgreSQL date/time presentation,
     * as a UTC string, wrapped in quotes (unless flag `raw` is set).
     *
     * @param {date|function} d
     * Date object to be converted, or a function that returns one.
     *
     * @param {boolean} [raw=false]
     * Indicates when not to escape the value.
     *
     * @returns {string}
     */
    date: function (d, raw) {
        d = resolveFunc(d);
        if (isNull(d)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (d instanceof Date) {
            // UTC date string is what PostgreSQL understands automatically;
            var s = d.toUTCString();
            // NOTE: Many languages use apostrophes in month names;
            return raw ? s : TEXT(safeText(s));
        }
        throw new TypeError(TEXT(d) + " is not a Date object.");
    },

    /**
     * @method formatting.number
     * @description
     * Converts a numeric value into its PostgreSQL number presentation,
     * with support for `NaN`, `+Infinity` and `-Infinity`.
     *
     * @param {number|function} num
     * Number to be converted, or a function that returns one.
     *
     * @returns {string}
     */
    number: function (num) {
        num = resolveFunc(num);
        if (isNull(num)) {
            return 'null';
        }
        if (typeof num !== 'number') {
            throw new TypeError(TEXT(num) + " is not a number.");
        }
        if (isFinite(num)) {
            return num.toString();
        }
        // Converting NaN/+Infinity/-Infinity according to Postgres documentation:
        // http://www.postgresql.org/docs/9.4/static/datatype-numeric.html#DATATYPE-FLOAT
        //
        // NOTE: strings for 'NaN'/'+Infinity'/'-Infinity' are not case-sensitive.
        if (num === Number.POSITIVE_INFINITY) {
            return TEXT("+Infinity");
        }
        if (num === Number.NEGATIVE_INFINITY) {
            return TEXT("-Infinity");
        }
        return TEXT("NaN");
    },

    /**
     * @method formatting.array
     * @description
     * Converts an array of values into its PostgreSQL presentation as an Array-Type
     * constructor string: `array[]`.
     *
     * @param {array|function} arr
     * Array to be converted, or a function that returns one.
     *
     * @returns {string}
     */
    array: function (arr) {
        arr = resolveFunc(arr);
        if (isNull(arr)) {
            return 'null';
        }
        if (arr instanceof Array) {
            return formatArray(arr);
        }
        throw new TypeError(TEXT(arr) + " is not an Array object.");
    },

    /**
     * @method formatting.csv
     * @description
     * Converts a single value or an array of values into a CSV string, with all values formatted
     * according to their type.
     *
     * @param {array|value|function} values
     * Value(s) to be converted, or a function that returns it.
     *
     * @returns {string}
     */
    csv: function (values) {
        return formatCSV(resolveFunc(values));
    },

    /**
     * @method formatting.json
     * @description
     * Converts any value into JSON (using `JSON.stringify`), and returns it as
     * a valid string, with single-quote symbols fixed, unless flag `raw` is set.
     *
     * @param {object|function} obj
     * Object/Value to be converted, or a function that returns it.
     *
     * @param {boolean} [raw=false]
     * Indicates when not to escape the result.
     *
     * @returns {string}
     */
    json: function (obj, raw) {
        obj = resolveFunc(obj);
        if (isNull(obj)) {
            throwIfRaw(raw);
            return 'null';
        }
        var s = JSON.stringify(obj);
        return raw ? s : TEXT(safeText(s));
    },

    /**
     * @method formatting.func
     * @description
     * Calls the function to get the actual value, and then formats the result
     * according to its type + `raw` flag.
     *
     * @param {function} func
     * Function to be called, with support for nesting.
     *
     * @param {boolean} [raw=false]
     * Indicates when not to escape the result.
     *
     * @param {object} [obj]
     * `this` context to be passed into the function on all nested levels.
     *
     * @returns {string}
     */
    func: function (func, raw, obj) {
        if (isNull(func)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof func !== 'function') {
            throw new TypeError(TEXT(func) + " is not a function.");
        }
        var fm = raw ? fmFlags.raw : null;
        if (isNull(obj)) {
            return formatValue(resolveFunc(func), fm);
        }
        if (typeof obj === 'object') {
            return formatValue(resolveFunc(func, obj), fm, obj);
        }
        throw new TypeError(TEXT(obj) + " is not an object.");
    },

    /**
     * @method formatting.format
     * @description
     * Replaces variables in a string according to the type of `values`:
     *
     * - Replaces `$1` occurrences when `values` is of type `string`, `boolean`, `number`, `Date`, `Buffer` or when it is `null`.
     * - Replaces variables `$1`, `$2`, ...`$9999` when `values` is an array of parameters. When a variable is out of range,
     *   it throws {@link external:RangeError RangeError} = `Variable $n out of range. Parameters array length: x`, unless
     *   option `partial` is used.
     * - Replaces `$*propName*`, where `*` is any of `{}`, `()`, `[]`, `<>`, `//`, when `values` is an object
     *   that's not a `Date`, `Buffer` or `null`. Special property name `this` refers to the formatting object itself,
     *   to be injected as a JSON string. When referencing a property that doesn't exist in the formatting object, it throws
     *   {@link external:Error Error} = `Property 'PropName' doesn't exist`, unless option `partial` is used.
     *
     * By default, each variable is automatically formatted according to its type, unless it is a special variable:
     * - Raw-text variables end with `:raw` or symbol `^`, and prevent escaping the text. Such variables are not
     *   allowed to be `null` or `undefined`, or the method will throw {@link external:TypeError TypeError} = `Values null/undefined cannot be used as raw text.`
     *   - `$1:raw`, `$2:raw`,..., and `$*propName:raw*` (see `*` above)
     *   - `$1^`, `$2^`,..., and `$*propName^*` (see `*` above)
     * - Open-value variables end with `:value` or symbol `#`, to be escaped, but not wrapped in quotes. Such variables are
     *   not allowed to be `null` or `undefined`, or the method will throw {@link external:TypeError TypeError} = `Open values cannot be null or undefined.`
     *   - `$1:value`, `$2:value`,..., and `$*propName:value*` (see `*` above)
     *   - `$1#`, `$2#`,..., and `$*propName#*` (see `*` above)
     * - SQL name variables end with `:name` or symbol `~` (tilde), and provide proper escaping for SQL names/identifiers:
     *   - `$1:name`, `$2:name`,..., and `$*propName:name*` (see `*` above)
     *   - `$1~`, `$2~`,..., and `$*propName~*` (see `*` above)
     * - JSON override ends with `:json` to format the value of any type as a JSON string
     * - CSV override ends with `:csv` to format an array as a properly escaped comma-separated list of values.
     *
     * @param {string} query
     * Query string with formatting variables in it.
     *
     * @param {array|object|value} [values]
     * Formatting parameter(s) / variable value(s).
     *
     * @param {object} [options]
     * Formatting Options.
     *
     * @param {boolean} [options.partial=false]
     * Indicates that we intend to do only a partial replacement, i.e. throw no error when encountering a variable or
     * property name that's not valid within the formatting parameter(s).
     *
     * @returns {string}
     * Formatted query string.
     */
    format: function (query, values, options) {
        return $formatQuery(query, values, false, options);
    }
};

Object.freeze($as);

module.exports = {
    formatQuery: $formatQuery,
    formatFunction: $formatFunction,
    as: $as
};

/**
 * @external Error
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */

/**
 * @external TypeError
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError
 */

/**
 * @external RangeError
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RangeError
 */

