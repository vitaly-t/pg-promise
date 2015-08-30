'use strict';

////////////////////////////////////////////////////
// Converts a single value into its Postgres format.
// All known data types are supported.
//
// It can only fail in the following cases:
//   1. function-parameter throws an error;
//   2. 'value' = null/undefined, while 'raw' = true;
//   3. function-parameter returns null/undefined,
//      while 'raw' = true.
function formatValue(value, raw, obj) {
    if (isNull(value)) {
        throwIfRaw(raw);
        return 'null';
    }
    switch (typeof value) {
        case 'string':
            return $as.text(value, raw);
        case 'boolean':
            return $as.bool(value);
        case 'number':
            return $as.number(value);
        case 'function':
            return $as.func(value, raw, obj);
        default:
            // type = 'object';
            var ctf = value['formatDBType']; // custom type formatter;
            if (ctf instanceof Function) {
                return formatValue(resolveFunc(ctf, value), raw);
            }
            if (value instanceof Date) {
                return $as.date(value, raw);
            }
            if (value instanceof Array) {
                return $as.array(value);
            }
            return $as.json(value, raw);
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
    // raw-text values.
    //
    // A valid property name consists of any combination of letters,
    // digits, underscores or '$', and they are case-sensitive.
    // Leading and trailing spaces around property names are ignored.
    object: function (query, obj) {
        var pattern = /\$(?:({)|(\()|(<)|(\[)|(\/))\s*[a-z0-9\$_]+\^?\s*(?:(?=\2)(?=\3)(?=\4)(?=\5)}|(?=\1)(?=\3)(?=\4)(?=\5)\)|(?=\1)(?=\2)(?=\4)(?=\5)>|(?=\1)(?=\2)(?=\3)(?=\5)]|(?=\1)(?=\2)(?=\3)(?=\4)\/)/gi;
        return query.replace(pattern, function (name) {
            var svn = name.replace(/^\$[{(<[/]|[\s})>\]/]/g, ''); // stripped variable name;
            var raw = svn[svn.length - 1] === '^';
            var prop = raw ? svn.substring(0, svn.length - 1) : svn;
            if (!(prop in obj)) {
                // property must exist as the object's own or inherited;
                throw new Error("Property '" + prop + "' doesn't exist.");
            }
            return formatValue(obj[prop], raw, obj);
        });
    },

    // Replaces "$1, $2,...$9999" with the corresponding array values.
    // Variables "$1^, $2^,..." are replaced with their raw-text equivalents.
    array: function (query, array) {
        return query.replace(/\$([1-9][0-9]{0,3}\^?)/g, function (name, idx) {
            var raw = name[name.length - 1] === '^';
            idx = parseInt(idx) - 1; // also strips off '^', if there is any;
            return idx < array.length ? formatValue(array[idx], raw) : name;
        });
    },

    // Replaces each occurrence of "$1" with the value passed.
    // Each "$1^" is replaced with its raw-text equivalent.
    value: function (query, value) {
        return query.replace(/\$1(?![0-9])\^?/g, function (name) {
            var raw = name[name.length - 1] === '^';
            return formatValue(value, raw);
        });
    }
};

////////////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === undefined || value === null;
}

////////////////////////////////////////////
// Wraps text in single quotes;
function TEXT(text) {
    return "'" + text + "'";
}

////////////////////////////////////////////
// Replaces each single-quote symbol '
// with two, for PostgreSQL compliance.
function fixQuotes(text) {
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

///////////////////////////////////////////////////////
// Export functions and properties - all start with $
///////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////
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
// 3. If 'values' supports function formatDBType, either its own or inherited,
//    the actual value and the formatting meaning of it are both overridden with
//    the result returned by that function.
//
// When formatting fails, the function throws an error.
function $formatQuery(query, values) {
    if (typeof query !== 'string') {
        throw new Error("Parameter 'query' must be a text string.");
    }
    if (values && typeof values === 'object') {
        var ctf = values['formatDBType']; // custom type formatter;
        if (ctf instanceof Function) {
            return $formatQuery(query, resolveFunc(ctf, values));
        }
        if (values instanceof Array) {
            // $1, $2,... formatting to be applied;
            return formatAs.array(query, values);
        }
        if (!(values instanceof Date)) {
            // $*propName* formatting to be applied;
            return formatAs.object(query, values);
        }
    }
    // $1 formatting to be applied, if values != undefined;
    return values === undefined ? query : formatAs.value(query, values);
}

//////////////////////////////////////////////////////
// Formats a standard PostgreSQL function call query;
function $formatFunction(funcName, values) {
    return 'select * from ' + funcName + '(' + formatCSV(values) + ')';
}

///////////////////////////////////////////////////////
// Conversion helpers, exposed via 'pgp.as' namespace;
var $as = {
    text: function (text, raw) {
        text = resolveFunc(text);
        if (isNull(text)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof text !== 'string') {
            text = text.toString();
        }
        return raw ? text : TEXT(fixQuotes(text));
    },
    bool: function (value) {
        value = resolveFunc(value);
        if (isNull(value)) {
            return 'null';
        }
        return value ? 'true' : 'false';
    },
    date: function (d, raw) {
        d = resolveFunc(d);
        if (isNull(d)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (d instanceof Date) {
            // UTC date string is what PostgreSQL understands automatically;
            var s = d.toUTCString();
            return raw ? s : TEXT(s);
        }
        throw new Error(TEXT(d) + " is not a Date object.");
    },
    number: function (num) {
        num = resolveFunc(num);
        if (isNull(num)) {
            return 'null';
        }
        if (typeof num !== 'number') {
            throw new Error(TEXT(num) + " is not a number.");
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
    array: function (arr) {
        arr = resolveFunc(arr);
        if (isNull(arr)) {
            return 'null';
        }
        if (arr instanceof Array) {
            return formatArray(arr);
        }
        throw new Error(TEXT(arr) + " is not an Array object.");
    },
    csv: function (values) {
        return formatCSV(resolveFunc(values));
    },
    json: function (obj, raw) {
        obj = resolveFunc(obj);
        if (isNull(obj)) {
            throwIfRaw(raw);
            return 'null';
        }
        var s = JSON.stringify(obj);
        return raw ? s : TEXT(fixQuotes(s));
    },
    func: function (func, raw, obj) {
        if (isNull(func)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof func !== 'function') {
            throw new Error(TEXT(func) + " is not a function.");
        }
        if (isNull(obj)) {
            return formatValue(resolveFunc(func), raw);
        }
        if (typeof obj === 'object') {
            return formatValue(resolveFunc(func, obj), raw);
        }
        throw new Error(TEXT(obj) + " is not an object.");
    },
    format: function (query, values) {
        return $formatQuery(query, values);
    }
};

module.exports = {
    formatQuery: $formatQuery,
    formatFunction: $formatFunction,
    as: $as
};
