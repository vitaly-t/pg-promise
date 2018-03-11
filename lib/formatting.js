/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

const npm = {
    pgUtils: require('pg/lib/utils'),
    patterns: require('./patterns'),
    utils: require('./utils')
};

// Format Modification Flags;
const fmFlags = {
    raw: 1, // Raw-Text variable
    alias: 2, // SQL Alias
    name: 4, // SQL Name/Identifier
    json: 8, // JSON modifier
    csv: 16, // CSV modifier
    value: 32 // escaped, but without ''
};

// Format Modification Map;
const fmMap = {
    '^': fmFlags.raw,
    ':raw': fmFlags.raw,
    ':alias': fmFlags.alias,
    '~': fmFlags.name,
    ':name': fmFlags.name,
    ':json': fmFlags.json,
    ':csv': fmFlags.csv,
    ':list': fmFlags.csv,
    ':value': fmFlags.value,
    '#': fmFlags.value
};

// Global symbols for Custom Type Formatting:
const ctfSymbols = {
    toPostgres: Symbol.for('ctf.toPostgres'),
    rawType: Symbol.for('ctf.rawType')
};

Object.freeze(ctfSymbols);

const maxVariable = 100000; // maximum supported variable is '$100000'

////////////////////////////////////////////////////
// Converts a single value into its Postgres format.
function formatValue(value, fm, cc) {

    if (typeof value === 'function') {
        return formatValue(resolveFunc(value, cc), fm, cc);
    }

    const ctf = getCTF(value); // Custom Type Formatting
    if (ctf) {
        fm |= ctf.rawType ? fmFlags.raw : 0;
        return formatValue(resolveFunc(ctf.toPostgres, value), fm, cc);
    }

    const isRaw = !!(fm & fmFlags.raw);
    fm &= ~fmFlags.raw;

    switch (fm) {
        case fmFlags.alias:
            return $as.alias(value);
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
            return $to.text(value, isRaw);
        case 'boolean':
            return $to.bool(value);
        case 'number':
            return $to.number(value);
        case 'symbol':
            throw new TypeError('Type Symbol has no meaning for PostgreSQL: ' + value.toString());
        default:
            if (value instanceof Date) {
                return $to.date(value, isRaw);
            }
            if (value instanceof Array) {
                return $to.array(value);
            }
            if (value instanceof Buffer) {
                return $to.buffer(value, isRaw);
            }
            return $to.json(value, isRaw);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Converts array of values into PostgreSQL Array Constructor: array[...], as per PostgreSQL documentation:
// http://www.postgresql.org/docs/9.6/static/arrays.html
//
// Arrays of any depth/dimension are supported.
//
// Top-level empty arrays are formatted as literal '{}' to avoid the necessity of explicit type casting,
// as the server cannot automatically infer type of an empty non-literal array.
function formatArray(array) {
    const loop = a => '[' + a.map(v => v instanceof Array ? loop(v) : formatValue(v)).join() + ']';
    return array.length ? ('array' + loop(array)) : '\'{}\'';
}

///////////////////////////////////////////////////////////////////
// Formats array/object/value as a list of comma-separated values.
function formatCSV(values) {
    if (values instanceof Array) {
        return values.map(v => formatValue(v)).join();
    }
    if (typeof values === 'object' && values !== null) {
        return Object.keys(values).map(v => formatValue(values[v])).join();
    }
    return values === undefined ? '' : formatValue(values);
}

///////////////////////////////
// Query formatting helpers;
const formatAs = {

    object(query, obj, raw, options) {
        options = options && typeof options === 'object' ? options : {};
        return query.replace(npm.patterns.namedParameters, name => {
            const v = formatAs.stripName(name.replace(/^\$[{(<[/]|[\s})>\]/]/g, ''), raw),
                c = npm.utils.getIfHas(obj, v.name);
            if (!c.valid) {
                throw new Error('Invalid property name \'' + v.name + '\'.');
            }
            if (c.has) {
                return formatValue(c.value, v.fm, c.target);
            }
            if (v.name === 'this') {
                return formatValue(obj, v.fm);
            }
            if ('default' in options) {
                const d = options.default, value = typeof d === 'function' ? d.call(obj, v.name, obj) : d;
                return formatValue(value, v.fm, obj);
            }
            if (options.partial) {
                return name;
            }
            // property must exist as the object's own or inherited;
            throw new Error('Property \'' + v.name + '\' doesn\'t exist.');
        });
    },

    array(query, array, raw, options) {
        options = options && typeof options === 'object' ? options : {};
        return query.replace(npm.patterns.multipleValues, name => {
            const v = formatAs.stripName(name.substr(1), raw);
            const idx = v.name - 1;
            if (idx >= maxVariable) {
                throw new RangeError('Variable $' + v.name + ' exceeds supported maximum of $' + maxVariable);
            }
            if (idx < array.length) {
                return formatValue(array[idx], v.fm);
            }
            if ('default' in options) {
                const d = options.default, value = typeof d === 'function' ? d.call(array, idx, array) : d;
                return formatValue(value, v.fm);
            }
            if (options.partial) {
                return name;
            }
            throw new RangeError('Variable $' + v.name + ' out of range. Parameters array length: ' + array.length);
        });
    },

    value(query, value, raw) {
        return query.replace(npm.patterns.singleValue, name => {
            const v = formatAs.stripName(name, raw);
            return formatValue(value, v.fm);
        });
    },

    stripName(name, raw) {
        const mod = name.match(npm.patterns.hasValidModifier);
        if (mod) {
            return {
                name: name.substr(0, mod.index),
                fm: fmMap[mod[0]] | (raw ? fmFlags.raw : 0)
            };
        }
        return {
            name,
            fm: raw ? fmFlags.raw : null
        };
    }
};

////////////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === undefined || value === null;
}

//////////////////////////////////////////////////////////////////
// Checks if the value supports Custom Type Formatting,
// to return {toPostgres, rawType}, if it does, or null otherwise.
function getCTF(value) {
    if (!isNull(value)) {
        const toPostgres = value[ctfSymbols.toPostgres];
        if (typeof toPostgres === 'function') {
            verifyCTF(toPostgres);
            return {toPostgres, rawType: !!value[ctfSymbols.rawType]};
        }
        // For backward compatibility:
        if (typeof value.toPostgres === 'function') {
            verifyCTF(value.toPostgres);
            return {toPostgres: value.toPostgres, rawType: !!value.rawType};
        }
    }
    return null;
}

////////////////////////////////////
// Validates CTF callback function;
function verifyCTF(f) {
    if (f.constructor.name !== 'Function') {
        throw new Error('CTF does not support asynchronous toPostgres functions.');
    }
}

/////////////////////////////////////////
// Wraps a text string in single quotes;
function wrapText(text) {
    return '\'' + text + '\'';
}

////////////////////////////////////////////////
// Replaces each single-quote symbol ' with two,
// for compliance with PostgreSQL strings.
function safeText(text) {
    return text.replace(/'/g, '\'\'');
}

/////////////////////////////////////////////
// Throws an exception, if flag 'raw' is set.
function throwIfRaw(raw) {
    if (raw) {
        throw new TypeError('Values null/undefined cannot be used as raw text.');
    }
}

/////////////////////////////////////////////////////////////////////////////
// Recursively resolves parameter-function, with an optional Calling Context.
function resolveFunc(value, cc) {
    while (typeof value === 'function') {
        if (value.constructor.name !== 'Function') {
            // Constructor name for asynchronous functions have different names:
            // - 'GeneratorFunction' for ES6 generators
            // - 'AsyncFunction' for ES7 async functions
            throw new Error('Cannot use asynchronous functions with query formatting.');
        }
        value = value.call(cc, cc);
    }
    return value;
}

///////////////////////////////////////////////////////////////////////////////////
// It implements two types of formatting, depending on the 'values' passed:
//
// 1. format '$1, $2, etc', when 'values' is of type string, boolean, number, date,
//    function or null (or an array of the same types, plus undefined values);
// 2. format $*propName*, when 'values' is an object (not null and not Date),
//    and where * is any of the supported open-close pairs: {}, (), [], <>, //
//
function $formatQuery(query, values, raw, options) {
    if (typeof query !== 'string') {
        throw new TypeError('Parameter \'query\' must be a text string.');
    }
    const ctf = getCTF(values);
    if (ctf) {
        // Custom Type Formatting
        return $formatQuery(query, resolveFunc(ctf.toPostgres, values), raw || ctf.rawType, options);
    }
    if (typeof values === 'object' && values !== null) {
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
    const sql = capSQL ? 'SELECT * FROM ' : 'select * from ';
    return sql + funcName + '(' + formatCSV(values) + ')';
}

function $formatSqlName(name) {
    return '"' + name.replace(/"/g, '""') + '"';
}

/**
 * @namespace formatting
 * @description
 * Namespace for all query-formatting functions, available from `pgp.as` before and after initializing the library.
 *
 * @property {formatting.ctf} ctf
 * Namespace for symbols used by $[Custom Type Formatting].
 *
 * @property {function} alias
 * {@link formatting.alias alias} - formats an SQL alias.
 *
 * @property {function} name
 * {@link formatting.name name} - formats an SQL Name/Identifier.
 *
 * @property {function} text
 * {@link formatting.text text} - formats a text string.
 *
 * @property {function} number
 * {@link formatting.number number} - formats a number.
 *
 * @property {function} buffer
 * {@link formatting.buffer buffer} - formats a `Buffer` object.
 *
 * @property {function} value
 * {@link formatting.value value} - formats text as an open value.
 *
 * @property {function} json
 * {@link formatting.json json} - formats any value as JSON.
 *
 * @property {function} array
 * {@link formatting.array array} - formats an array of any depth.
 *
 * @property {function} csv
 * {@link formatting.csv csv} - formats an array as a list of comma-separated values.
 *
 * @property {function} func
 * {@link formatting.func func} - formats the value returned from a function.
 *
 * @property {function} format
 * {@link formatting.format format} - formats a query, according to parameters.
 *
 */
const $as = {

    /**
     * @namespace formatting.ctf
     * @description
     * Namespace for ES6 symbols used by $[Custom Type Formatting], available from `pgp.as.ctf` before and after initializing the library.
     *
     * It was added to avoid explicit/enumerable extension of types that need to be used as formatting parameters, to keep their type signature intact.
     *
     * @property {external:Symbol} toPostgres
     * Property name for the $[Custom Type Formatting] callback function `toPostgres`.
     *
     * @property {external:Symbol} rawType
     * Property name for the $[Custom Type Formatting] flag `rawType`.
     *
     * @example
     * const ctf = pgp.as.ctf; // Custom Type Formatting symbols
     *
     * class MyType {
     *     constructor() {
     *         this[ctf.rawType] = true; // set it only when toPostgres returns a pre-formatted result
     *     }
     *
     *     [ctf.toPostgres](self) {
     *         // self = this
     *
     *         // return the custom/actual value here
     *     }
     * }
     *
     * const a = new MyType();
     *
     * const s = pgp.as.format('$1', a); // will be custom-formatted
     */
    ctf: ctfSymbols,

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
    text(value, raw) {
        value = resolveFunc(value);
        if (isNull(value)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof value !== 'string') {
            value = value.toString();
        }
        return $to.text(value, raw);
    },

    /**
     * @method formatting.name
     * @description
     * Properly escapes an sql name or identifier, fixing double-quote symbols and wrapping the result in double quotes.
     *
     * Implements a safe way to format $[SQL Names] that neutralizes SQL Injection.
     *
     * When formatting a query, a variable makes use of this method via modifier `:name` or `~`. See method {@link formatting.format format}.
     *
     * @param {string|function|array|object} name
     * SQL name or identifier, or a function that returns it.
     *
     * The name must be at least 1 character long.
     *
     * If `name` doesn't resolve into a non-empty string, it throws {@link external:TypeError TypeError} = `Invalid sql name: ...`
     *
     * If the `name` contains only a single `*` (trailing spaces are ignored), then `name` is returned exactly as is (unescaped).
     *
     * - If `name` is an Array, it is formatted as a comma-separated list of $[SQL Names]
     * - If `name` is a non-Array object, its keys are formatted as a comma-separated list of $[SQL Names]
     *
     * Passing in an empty array/object will throw {@link external:Error Error} = `Cannot retrieve sql names from an empty array/object.`
     *
     * @returns {string}
     * The SQL Name/Identifier, properly escaped for compliance with the PostgreSQL standard for $[SQL Names] and identifiers.
     *
     * @see
     * {@link formatting.alias alias},
     * {@link formatting.format format}
     *
     * @example
     *
     * // automatically list object properties as sql names:
     * format('INSERT INTO table(${this~}) VALUES(${one}, ${two})', {
     *     one: 1,
     *     two: 2
     * });
     * //=> INSERT INTO table("one","two") VALUES(1, 2)
     *
     */
    name(name) {
        name = resolveFunc(name);
        if (name) {
            if (typeof name === 'string') {
                return /^\s*\*(\s*)$/.test(name) ? name : $formatSqlName(name);
            }
            if (typeof name === 'object') {
                const keys = Array.isArray(name) ? name : Object.keys(name);
                if (!keys.length) {
                    throw new Error('Cannot retrieve sql names from an empty array/object.');
                }
                return keys.map(value => {
                    if (!value || typeof value !== 'string') {
                        throw new Error('Invalid sql name: ' + JSON.stringify(value));
                    }
                    return $formatSqlName(value);
                }).join();
            }
        }
        throw new TypeError('Invalid sql name: ' + JSON.stringify(name));
    },

    /**
     * @method formatting.alias
     * @description
     * Simpler (non-verbose) version of method {@link formatting.name name}, to handle only a regular string-identifier
     * that's used as an SQL alias, i.e. it doesn't support `*` or an array/object of names, which in the context of
     * an SQL alias would be incorrect.
     *
     * The surrounding double quotes are not added when the alias uses a simple syntax:
     *  - it is a same-case single word, without spaces
     *  - it can contain underscores, and can even start with them
     *  - it can contain digits and `$`, but cannot start with those
     *
     * When formatting a query, a variable makes use of this method via modifier `:alias`. See method {@link formatting.format format}.
     *
     * @param {string|function} name
     * SQL alias name, or a function that returns it.
     *
     * The name must be at least 1 character long.
     *
     * If `name` doesn't resolve into a non-empty string, it throws {@link external:TypeError TypeError} = `Invalid sql alias: ...`
     *
     * @returns {string}
     * The SQL alias, properly escaped for compliance with the PostgreSQL standard for $[SQL Names] and identifiers.
     *
     * @see
     * {@link formatting.name name},
     * {@link formatting.format format}
     *
     */
    alias(name) {
        name = resolveFunc(name);
        if (name && typeof name === 'string') {
            const m = name.match(/^([a-z_][a-z0-9_$]*|[A-Z_][A-Z0-9_$]*)$/);
            if (m && m[0] === name) {
                return name;
            }
            return '"' + name.replace(/"/g, '""') + '"';
        }
        throw new TypeError('Invalid sql alias: ' + JSON.stringify(name));
    },

    /**
     * @method formatting.value
     * @description
     * Represents an open value, one to be formatted according to its type, properly escaped, but without surrounding quotes for text types.
     *
     * When formatting a query, a variable makes use of this method via modifier `:value` or `#`. See method {@link formatting.format format}.
     *
     * @param {value|function} value
     * Value to be converted, or a function that returns the value.
     *
     * If `value` resolves as `null` or `undefined`, it will throw {@link external:TypeError TypeError} = `Open values cannot be null or undefined.`
     *
     * @returns {string}
     * Formatted and properly escaped string, but without surrounding quotes for text types.
     *
     * @see {@link formatting.format format}
     *
     */
    value(value) {
        value = resolveFunc(value);
        if (isNull(value)) {
            throw new TypeError('Open values cannot be null or undefined.');
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
    buffer(obj, raw) {
        obj = resolveFunc(obj);
        if (isNull(obj)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (obj instanceof Buffer) {
            return $to.buffer(obj, raw);
        }
        throw new TypeError(wrapText(obj) + ' is not a Buffer object.');
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
    bool(value) {
        value = resolveFunc(value);
        if (isNull(value)) {
            return 'null';
        }
        return $to.bool(value);
    },

    /**
     * @method formatting.date
     * @description
     * Converts a `Date`-type value into PostgreSQL date/time presentation,
     * wrapped in quotes (unless flag `raw` is set).
     *
     * @param {Date|function} d
     * Date object to be converted, or a function that returns one.
     *
     * @param {boolean} [raw=false]
     * Indicates when not to escape the value.
     *
     * @returns {string}
     */
    date(d, raw) {
        d = resolveFunc(d);
        if (isNull(d)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (d instanceof Date) {
            return $to.date(d, raw);
        }
        throw new TypeError(wrapText(d) + ' is not a Date object.');
    },

    /**
     * @method formatting.number
     * @description
     * Converts a numeric value into its PostgreSQL number presentation,
     * with support for special values `NaN`, `+Infinity` and `-Infinity`.
     *
     * @param {number|function} num
     * Number to be converted, or a function that returns one.
     *
     * @returns {string}
     */
    number(num) {
        num = resolveFunc(num);
        if (isNull(num)) {
            return 'null';
        }
        if (typeof num !== 'number') {
            throw new TypeError(wrapText(num) + ' is not a number.');
        }
        return $to.number(num);
    },

    /**
     * @method formatting.array
     * @description
     * Converts an array of values into its PostgreSQL presentation as an Array-Type constructor string: `array[]`.
     *
     * Top-level empty arrays are formatted as literal `{}`, to avoid the necessity of explicit type casting,
     * as the server cannot automatically infer type of an empty non-literal array.
     *
     * @param {Array|function} arr
     * Array to be converted, or a function that returns one.
     *
     * @returns {string}
     */
    array(arr) {
        arr = resolveFunc(arr);
        if (isNull(arr)) {
            return 'null';
        }
        if (arr instanceof Array) {
            return $to.array(arr);
        }
        throw new TypeError(wrapText(arr) + ' is not an Array object.');
    },

    /**
     * @method formatting.csv
     * @description
     * Converts a single value or an array of values into a CSV (comma-separated values) string, with all values formatted
     * according to their JavaScript type.
     *
     * When formatting a query, a variable makes use of this method via modifier `:csv`, with alias `:list` supported from v7.5.1
     *
     * When `values` is an object that's not `null` or `Array`, its properties are enumerated for the actual values.
     *
     * @param {Array|Object|value|function} values
     * Value(s) to be converted, or a function that returns it.
     *
     * @returns {string}
     *
     * @see {@link formatting.format format}
     */
    csv(values) {
        return formatCSV(resolveFunc(values));
    },

    /**
     * @method formatting.json
     * @description
     * Converts any value into JSON (using `JSON.stringify`), and returns it as a valid string, with single-quote
     * symbols fixed, unless flag `raw` is set.
     *
     * When formatting a query, a variable makes use of this method via modifier `:json`. See method {@link formatting.format format}.
     *
     * @param {*} data
     * Object/value to be converted, or a function that returns it.
     *
     * @param {boolean} [raw=false]
     * Indicates when not to escape the result.
     *
     * @returns {string}
     *
     * @see {@link formatting.format format}
     */
    json(data, raw) {
        data = resolveFunc(data);
        if (isNull(data)) {
            throwIfRaw(raw);
            return 'null';
        }
        return $to.json(data, raw);
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
     * @param {*} [cc]
     * Calling Context: `this` + the only value to be passed into the function on all nested levels.
     *
     * @returns {string}
     */
    func(func, raw, cc) {
        if (isNull(func)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof func !== 'function') {
            throw new TypeError(wrapText(func) + ' is not a function.');
        }
        const fm = raw ? fmFlags.raw : null;
        return formatValue(resolveFunc(func, cc), fm, cc);
    },

    /**
     * @method formatting.format
     * @description
     * Replaces variables in a string according to the type of `values`:
     *
     * - Replaces `$1` occurrences when `values` is of type `string`, `boolean`, `number`, `Date`, `Buffer` or when it is `null`.
     *
     * - Replaces variables `$1`, `$2`, ...`$100000` when `values` is an array of parameters. It throws a {@link external:RangeError RangeError}
     * when the values or variables are out of range.
     *
     * - Replaces `$*propName*`, where `*` is any of `{}`, `()`, `[]`, `<>`, `//`, when `values` is an object that's not a
     * `Date`, `Buffer`, {@link QueryFile} or `null`. Special property name `this` refers to the formatting object itself,
     *   to be injected as a JSON string. When referencing a property that doesn't exist in the formatting object, it throws
     *   {@link external:Error Error} = `Property 'PropName' doesn't exist`, unless option `partial` is used.
     *
     * - Supports $[Nested Named Parameters] of any depth.
     *
     * By default, each variable is automatically formatted according to its type, unless it is a special variable:
     *
     * - Raw-text variables end with `:raw` or symbol `^`, and prevent escaping the text. Such variables are not
     *   allowed to be `null` or `undefined`, or the method will throw {@link external:TypeError TypeError} = `Values null/undefined cannot be used as raw text.`
     *   - `$1:raw`, `$2:raw`,..., and `$*propName:raw*` (see `*` above)
     *   - `$1^`, `$2^`,..., and `$*propName^*` (see `*` above)
     *
     * - Open-value variables end with `:value` or symbol `#`, to be escaped, but not wrapped in quotes. Such variables are
     *   not allowed to be `null` or `undefined`, or the method will throw {@link external:TypeError TypeError} = `Open values cannot be null or undefined.`
     *   - `$1:value`, `$2:value`,..., and `$*propName:value*` (see `*` above)
     *   - `$1#`, `$2#`,..., and `$*propName#*` (see `*` above)
     *
     * - SQL name variables end with `:name` or symbol `~` (tilde), and provide proper escaping for SQL names/identifiers:
     *   - `$1:name`, `$2:name`,..., and `$*propName:name*` (see `*` above)
     *   - `$1~`, `$2~`,..., and `$*propName~*` (see `*` above)
     *
     * - Modifier `:alias` - non-verbose $[SQL Names] escaping.
     *
     * - JSON override ends with `:json` to format the value of any type as a JSON string
     *
     * - CSV override ends with `:csv` or `:list` to format an array as a properly escaped comma-separated list of values.
     *
     * @param {string|QueryFile|object} query
     * A query string, a {@link QueryFile} or any object that implements $[Custom Type Formatting], to be formatted according to `values`.
     *
     * @param {array|object|value} [values]
     * Formatting parameter(s) / variable value(s).
     *
     * @param {object} [options]
     * Formatting Options.
     *
     * @param {boolean} [options.partial=false]
     * Indicates that we intend to do only a partial replacement, i.e. throw no error when encountering a variable or
     * property name that's missing within the formatting parameters.
     *
     * This option has no meaning when option `default` is present.
     *
     * @param {*} [options.default]
     * Sets a default value for every variable that's missing, consequently preventing errors when encountering a variable
     * or property name that's missing within the formatting parameters.
     *
     * It can also be set to a function, to be called with two parameters that depend on the type of formatting being used,
     * and to return the actual default value:
     *
     * - Named Parameters formatting:
     *   - `name` - name of the property missing in the formatting object
     *   - `obj` - the formatting object, and is the same as `this` context
     *
     * - Regular variable formatting:
     *   - `index` - element's index that's outside of the formatting array's range
     *   - `arr` - the formatting array, and is the same as `this` context
     *
     * @returns {string}
     * Formatted query string.
     *
     * The function will throw an error, if any occurs during formatting.
     */
    format(query, values, options) {
        const ctf = getCTF(query);
        if (ctf) {
            query = ctf.toPostgres.call(query, query);
        }
        return $formatQuery(query, values, false, options);
    }
};

/* Pre-parsed type formatting */
const $to = {
    array(arr) {
        return formatArray(arr);
    },
    bool(value) {
        return value ? 'true' : 'false';
    },
    buffer(obj, raw) {
        const s = '\\x' + obj.toString('hex');
        return raw ? s : wrapText(s);
    },
    date(d, raw) {
        const s = npm.pgUtils.prepareValue(d);
        return raw ? s : wrapText(s);
    },
    json(data, raw) {
        const s = JSON.stringify(data);
        return raw ? s : wrapText(safeText(s));
    },
    number(num) {
        if (Number.isFinite(num)) {
            return num.toString();
        }
        // Converting NaN/+Infinity/-Infinity according to Postgres documentation:
        // http://www.postgresql.org/docs/9.6/static/datatype-numeric.html#DATATYPE-FLOAT
        //
        // NOTE: strings for 'NaN'/'+Infinity'/'-Infinity' are not case-sensitive.
        if (num === Number.POSITIVE_INFINITY) {
            return wrapText('+Infinity');
        }
        if (num === Number.NEGATIVE_INFINITY) {
            return wrapText('-Infinity');
        }
        return wrapText('NaN');
    },
    text(value, raw) {
        return raw ? value : wrapText(safeText(value));
    }
};

Object.freeze($as);

module.exports = {
    formatQuery: $formatQuery,
    formatFunction: $formatFunction,
    resolveFunc,
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

/**
 * @external Symbol
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
 */
