'use strict';

////////////////////////////////////////////////////
// Converts a single value into its Postgres format.
// All known data types are supported.
//
// It can only fail in the following cases:
//   1. function-parameter or custom type throw an error;
//   2. 'value' = null/undefined, while 'raw' = true;
//   3. function-parameter returns null/undefined,
//      while 'raw' = true.
function formatValue(value, isRaw, isName, obj) {
    if (isName) {
        if (value instanceof Function) {
            return formatValue(resolveFunc(value, obj), false, true, obj);
        }
        if (value && typeof value === 'object') {
            var ctf = value['formatDBType']; // custom type formatting;
            if (ctf instanceof Function) {
                return formatValue(resolveFunc(ctf, value), false, true, obj);
            }
        }
        return $as.name(value);
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
        case 'function':
            return $as.func(value, isRaw, obj);
        default:
            // type = 'object';
            var ctf = value['formatDBType']; // custom type formatting;
            if (ctf instanceof Function) {
                return formatValue(resolveFunc(ctf, value), isRaw || value._rawDBType, false, obj);
            }
            if (value instanceof Date) {
                return $as.date(value, isRaw);
            }
            if (value instanceof Array) {
                return $as.array(value);
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
        return '[' + a.map(function (v) {
                return v instanceof Array ? loop(v) : formatValue(v);
            }).join(',') + ']';
    }

    return 'array' + loop(array);
}

///////////////////////////////////////////////////////////////
// Formats array of javascript-type parameters as a csv string,
// so it can be passed into a PostgreSQL function.
// Both single value and array or values are supported.
function formatCSV(values) {
    if (values instanceof Array) {
        return values.map(function (v) {
            return formatValue(v);
        }).join(',');
    }
    return values === undefined ? '' : formatValue(values);
}

///////////////////////////////
// Query formatting helpers;
var formatAs = {

    // Replaces each $*propName* with the corresponding property value,
    // where * is one of the following open-close pairs: {}, (), [], <>, //
    // NOTE: Combinations of different open-close symbols are not allowed.
    //
    // Symbol ^ in the end of a property name is recognized for injecting
    // raw-text values, while symbol ~ is for injecting quoted identifiers.
    //
    // A valid property name consists of any combination of letters,
    // digits, underscores or '$', and they are case-sensitive.
    // Leading and trailing spaces around property names are ignored.
    //
    // Property with name 'this' refers to the formatting object itself,
    // to be injected as a JSON-formatted string.
    object: function (query, obj, raw) {
        var pattern = /\$(?:({)|(\()|(<)|(\[)|(\/))\s*[a-z0-9\$_]+[\^~]?\s*(?:(?=\2)(?=\3)(?=\4)(?=\5)}|(?=\1)(?=\3)(?=\4)(?=\5)\)|(?=\1)(?=\2)(?=\4)(?=\5)>|(?=\1)(?=\2)(?=\3)(?=\5)]|(?=\1)(?=\2)(?=\3)(?=\4)\/)/gi;
        return query.replace(pattern, function (name) {
            var svn = name.replace(/^\$[{(<[/]|[\s})>\]/]/g, ''); // stripped variable name;
            var ls = svn[svn.length - 1], isRaw = ls === '^', isName = ls === '~';
            var prop = (isRaw || isName) ? svn.substring(0, svn.length - 1) : svn;
            isRaw = isRaw || raw;
            if (prop in obj) {
                return formatValue(obj[prop], isRaw, isName, obj);
            }
            if (prop === 'this') {
                return formatValue(obj, isRaw, isName);
            }
            // property must exist as the object's own or inherited;
            throw new Error("Property '" + prop + "' doesn't exist.");
        });
    },

    // Replaces "$1, $2,...$9999" with the corresponding array values.
    // Variables "$1^, $2^,..." are replaced with their raw-text equivalents.
    // Variables "$1~, $2~,..." are formatted as quoted identifiers.
    array: function (query, array, raw) {
        return query.replace(/\$([1-9][0-9]{0,3}[\^~]?)/g, function (name, idx) {
            var ls = name[name.length - 1], isRaw = raw || ls === '^', isName = ls === '~';
            idx = parseInt(idx) - 1; // also strips off '^'/'~', if there is any;
            return idx < array.length ? formatValue(array[idx], isRaw, isName) : name;
        });
    },

    // Replaces each occurrence of "$1" with the value passed.
    // Each "$1^" is replaced with its raw-text equivalent.
    // Each "$1~" is replaced with the quoted identifier.
    value: function (query, value, raw) {
        return query.replace(/\$1(?![0-9])[\^~]?/g, function (name) {
            var ls = name[name.length - 1], r = raw || ls === '^', isName = ls === '~';
            return formatValue(value, r, isName);
        });
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
        throw new Error("Values null/undefined cannot be used as raw text.");
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
function $formatQuery(query, values, raw) {
    if (typeof query !== 'string') {
        throw new TypeError("Parameter 'query' must be a text string.");
    }
    if (values && typeof values === 'object') {
        var ctf = values['formatDBType']; // custom type formatting;
        if (ctf instanceof Function) {
            return $formatQuery(query, resolveFunc(ctf, values), raw || values._rawDBType);
        }
        if (values instanceof Array) {
            // $1, $2,... formatting to be applied;
            return formatAs.array(query, values, raw);
        }
        if (!(values instanceof Date)) {
            // $*propName* formatting to be applied;
            return formatAs.object(query, values, raw);
        }
    }
    // $1 formatting to be applied, if values != undefined;
    return values === undefined ? query : formatAs.value(query, values, raw);
}

//////////////////////////////////////////////////////
// Formats a standard PostgreSQL function call query;
function $formatFunction(funcName, values) {
    return 'select * from ' + funcName + '(' + formatCSV(values) + ')';
}

/**
 * @namespace formatting
 * @description
 * Namespace for the type conversion helpers.
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
     * @param {value|Function} value
     * Value to be converted, or a function that returns the value.
     *
     * If it is a function, it can be a nested one, to be called until a non-function
     * value is returned.
     *
     * @param {Boolean} [raw=false]
     * Indicates when not to escape the resulting text.
     *
     * @returns {String}
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
     * @param {String|Function} name
     * SQL name or identifier, or a function that returns it.
     *
     * The name must be at least 1 character long.
     *
     * If `name` is a function, it can be a nested one, to be called until a non-function
     * value is returned, which is expected to be a text string of at least 1 character long.
     *
     * @returns {String}
     * The SQL Name/Identifier properly escaped for compliance with the PostgreSQL standard
     * for SQL names and identifiers.
     *
     * When `name` doesn't resolve into a non-empty string, an error is thrown:
     * `An sql name/identifier must be a non-empty text string.`
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
     * @method formatting.bool
     * @description
     * Converts a truthy value into PostgreSQL boolean presentation.
     *
     * @param {Boolean|Function} value
     * Value to be converted, or a function that returns the value.
     *
     * @returns {String}
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
     * @param {Date|Function} d
     * Date object to be converted, or a function that returns one.
     *
     * @param {Boolean} [raw=false]
     * Indicates when not to escape the value.
     *
     * @returns {String}
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
     * @param {Number|Function} num
     * Number to be converted, or a function that returns one.
     *
     * @returns {String}
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
     * @param {Array|Function} arr
     * Array to be converted, or a function that returns one.
     *
     * @returns {String}
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
     * Converts a single value or an array of values into a CSV string,
     * with all values formatted according to their type.
     *
     * @param {Array|value|Function} values
     * Value(s) to be converted, or a function that returns it.
     *
     * @returns {String}
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
     * @param {Object|Function} obj
     * Object/Value to be converted, or a function that returns it.
     *
     * @param {Boolean} [raw=false]
     * Indicates when not to escape the result.
     *
     * @returns {String}
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
     * @param {Function} func
     * Function to be called, with support for nesting.
     *
     * @param {Boolean} [raw=false]
     * Indicates when not to escape the result.
     *
     * @param {Object} [obj]
     * `this` context to be passed into the function on all nested levels.
     *
     * @returns {String}
     */
    func: function (func, raw, obj) {
        if (isNull(func)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof func !== 'function') {
            throw new TypeError(TEXT(func) + " is not a function.");
        }
        if (isNull(obj)) {
            return formatValue(resolveFunc(func), raw);
        }
        if (typeof obj === 'object') {
            return formatValue(resolveFunc(func, obj), raw, false, obj);
        }
        throw new TypeError(TEXT(obj) + " is not an object.");
    },

    /**
     * @method formatting.format
     * @description
     * Replaces variables in a string with the values passed in.
     *
     * @param {String} query
     * Query string with formatting variables in it.
     *
     * @param {Array|value} [values]
     * Formatting variable value(s).
     *
     * @returns {String}
     * Formatted query string.
     */
    format: function (query, values) {
        return $formatQuery(query, values);
    }
};

module.exports = {
    formatQuery: $formatQuery,
    formatFunction: $formatFunction,
    as: $as
};
