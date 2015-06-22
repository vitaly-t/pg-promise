'use strict';

////////////////////////////////////////////////////
// Converts a single value into its Postgres format.
// All data types are supported.
//
// It can only fail in the following cases:
//   1. function-parameter throws an error;
//   2. 'value' = null/undefined and 'raw' = true;
//   3. function-parameter returns null/undefined,
//      while 'raw' = true.
function formatValue(val, raw, obj) {
    if (isDBNull(val)) {
        throwIfRaw(raw);
        return 'null';
    }
    switch (typeof(val)) {
        case 'string':
            return $as.text(val, raw);
        case 'boolean':
            return $as.bool(val);
        case 'number':
            return $as.number(val);
        case 'function':
            return $as.func(val, raw, obj);
        default:
            // type = 'object';
            if (val instanceof Date) {
                return $as.date(val, raw);
            }
            if (val instanceof Array) {
                return $as.array(val);
            }
            return $as.json(val, raw);
    }
}

//////////////////////////////////////////////////////////////////////////
// Converts array of values into PostgreSQL array constructor: array[...],
// as per PostgreSQL documentation: http://www.postgresql.org/docs/9.4/static/arrays.html
// Arrays of any depth/dimension are supported.
function formatArray(arr) {
    function loop(a) {
        return '[' + a.map(function (v) {
                return (v instanceof Array) ? loop(v) : formatValue(v);
            }).join(',') + ']';
    }

    return 'array' + loop(arr);
}

///////////////////////////////////////////////////////////////
// Formats array of javascript-type parameters as a csv string,
// so it can be passed into a PostgreSQL function.
// Both single value and array or values are supported.
function formatCSV(values) {
    if (Array.isArray(values)) {
        return values.map(function (v) {
            return formatValue(v);
        }).join(',');
    }
    return (values === undefined) ? '' : formatValue(values);
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
            var svn = name.replace(/^\$[{(<[/]|[\s})>\]/]*/g, ''); // stripped variable name;
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
    array: function (query, arr) {
        return query.replace(/\$([1-9][0-9]{0,3}\^?)/g, function (name, idx) {
            var raw = name[name.length - 1] === '^';
            idx = parseInt(idx) - 1; // also strips off '^', if there is any;
            return (idx < arr.length) ? formatValue(arr[idx], raw) : name;
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

//////////////////////////////////////////////
// Null verification for the database values;
function isDBNull(val) {
    return val === undefined || val === null;
}

////////////////////////////////
// Wraps text in single quotes;
function TEXT(text) {
    return "'" + text + "'";
}

////////////////////////////////////////
// Replaces each single-quote symbol '
// with two, for PostgreSQL compliance.
function fixQuotes(text) {
    return text.replace(/'/g, "''");
}

//////////////////////////////////////////////
// Throws an exception, if flag 'raw' is set.
function throwIfRaw(raw) {
    if (raw) {
        throw new Error("Values null/undefined cannot be used as raw text.");
    }
}

////////////////////////////////////////////
// Recursively resolves parameter-function,
// with the optional calling context.
function resolveFunc(val, obj) {
    while (typeof(val) === 'function') {
        val = obj ? val.call(obj) : val();
    }
    return val;
}

///////////////////////////////////////////////////////
// Global functions and properties - all start with $
///////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////
// 'pg-promise' own query formatting solution;
//
// It implements two types of formatting, depending on the 'values' passed:
//
// 1. format "$1, $2, etc", when 'values' is of type string, boolean, number, date,
//    function or null (or an array of the same types, plus undefined values);
// 2. format $*propName*, when 'values' is an object (not null and not Date),
//    and where * is any of the supported open-close pairs: {}, (), [], <>, //
//
// Raw-text values can be injected using syntax: $1^,$2^,... or $*propName^*
//
// When formatting fails, the function throws an error.
function $formatQuery(query, values) {
    if (typeof(query) !== 'string') {
        throw new Error("Parameter 'query' must be a text string.");
    }
    if (Array.isArray(values)) {
        // "$1, $2,..." formatting to be applied;
        query = formatAs.array(query, values);
    } else {
        if (values && typeof(values) === 'object' && !(values instanceof Date)) {
            // $*propName* formatting to be applied;
            query = formatAs.object(query, values);
        } else {
            if (values !== undefined) {
                // "$1" formatting to be applied;
                query = formatAs.value(query, values);
            }
        }
    }
    return query;
}

//////////////////////////////////////////////////////
// Formats a standard PostgreSQL function call query;
function $formatFunction(funcName, values) {
    return 'select * from ' + funcName + '(' + formatCSV(values) + ')';
}

///////////////////////////////////////////////////////
// Conversion helpers, exposed via 'pgp.as' namespace;
var $as = {
    text: function (txt, raw) {
        txt = resolveFunc(txt);
        if (isDBNull(txt)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof(txt) !== 'string') {
            txt = txt.toString();
        }
        return raw ? txt : TEXT(fixQuotes(txt));
    },
    bool: function (val) {
        val = resolveFunc(val);
        if (isDBNull(val)) {
            return 'null';
        }
        return val ? 'true' : 'false';
    },
    date: function (d, raw) {
        d = resolveFunc(d);
        if (isDBNull(d)) {
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
        if (isDBNull(num)) {
            return 'null';
        }
        if (typeof(num) !== 'number') {
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
        if (isDBNull(arr)) {
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
        if (isDBNull(obj)) {
            throwIfRaw(raw);
            return 'null';
        }
        var s = JSON.stringify(obj);
        return raw ? s : TEXT(fixQuotes(s));
    },
    func: function (func, raw, obj) {
        if (isDBNull(func)) {
            throwIfRaw(raw);
            return 'null';
        }
        if (typeof(func) !== 'function') {
            throw new Error(TEXT(func) + " is not a function.");
        }
        if (isDBNull(obj)) {
            return formatValue(resolveFunc(func), raw);
        }
        if (typeof(obj) === 'object') {
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
