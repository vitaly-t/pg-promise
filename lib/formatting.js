'use strict';

// Converts value into Postgres format;
// All data types are supported;
// It can only fail when a function-parameter throws an error.
function formatValue(val, raw, obj) {
    if (isDBNull(val)) {
        checkNullRaw(raw);
        return 'null';
    }
    switch (typeof(val)) {
        case 'string':
            return $as.text(val, raw);
        case 'boolean':
            return $as.bool(val);
        case 'number':
            return $as.number(val);
        case 'object':
            if (val instanceof Date) {
                return $as.date(val, raw);
            }
            if (val instanceof Array) {
                return $as.array(val);
            }
            return $as.json(val, raw);
        case 'function':
            return $as.func(val, raw, obj);
        default:
            break; // this may never happen;
    }
}

// Converts array of values into PostgreSQL array constructor array[...],
// as per PostgreSQL documentation: http://www.postgresql.org/docs/9.4/static/arrays.html
// Arrays of any dimension are supported.
function formatArray(arr) {
    function loop(a) {
        return '[' + a.map(function (v) {
                return (v instanceof Array) ? loop(v) : formatValue(v);
            }).join(',') + ']';
    }

    return 'array' + loop(arr);
}

// Formats array of javascript-type parameters as a csv list,
// so it can be passed into a function.
// Both single value and array or values are supported.
function formatCSV(values) {
    if (Array.isArray(values)) {
        return values.map(function (v) {
            return formatValue(v);
        }).join(',');
    } else {
        if (values !== undefined) {
            return formatValue(values);
        }
    }
    return '';
}

///////////////////////////////////////////////////////////////
// Returns an array of unique variable names from a text string;
//
// Variables are defined using syntax "${varName}", with
// optional ${varName^}, for injecting raw text values.
//
// Variables follow javascript naming convention:
// - a valid variable starts with a letter, underscore or '$' symbol,
//   followed by any combination of letters, digits, underscores and '$'.
// - leading and trailing spaces around variable names are ignored.
function enumVars(txt) {
    var v, names = [];
    var reg = /\$\{\s*[a-z\$_][a-z0-9\$_]*\^?\s*}/gi;
    while (v = reg.exec(txt)) {
        var svn = v[0].replace(/^\$\{\s*|\s*}$/g, ''); // stripped variable name;
        if (names.indexOf(svn) === -1) {
            names.push(svn);
        }
    }
    return names;
}

// query formatting helper;
var formatAs = {

    // Replaces each "${propName}" with the corresponding property value;
    // Each ${propName^} is replaced with raw-text value.
    object: function (query, obj) {
        var names = enumVars(query); // extract all variables;
        for (var i = 0; i < names.length; i++) {
            var name = names[i]; // variable/property name;
            var raw = name[name.length - 1] === '^'; // raw-text flag;
            var sName = raw ? name.substring(0, name.length - 1) : name; // stripped name;
            if (!(sName in obj)) {
                // property must exist as the object's own or inherited;
                throw new Error("Property '" + sName + "' doesn't exist.");
            }
            var prop = obj[sName]; // property value;
            var v = formatValue(prop, raw, obj);
            // replacing special symbols '$' and '^' with '\$' and '\^',
            // so they can be used within a replacement Reg-Ex further;
            var map = {'$': '\\$', '^': '\\^'};
            name = name.replace(/[\$\^]/g, function (k) {
                return map[k];
            });
            if (!raw) {
                name += "(?!\\^)"; // name not followed by ^
            }
            // Replacing all occurrences of the 'name' variable with the 'value';
            query = query.replace(new RegExp("\\$\\{\\s*" + name + "\\s*}", 'g'), v);
        }
        return query;
    },

    // Replaces "$1, $2,.." with corresponding array values;
    // Variables "$1^, $2^,.." are replaced with their raw-text values.
    array: function (query, arr) {
        for (var i = 0; i < arr.length; i++) {
            // a valid variable name cannot be followed by a digit:
            var pattern = '\\$' + (i + 1) + '(?!\\d)';
            if (query.search(pattern) === -1) {
                // Either more values passed in the array than variables in
                // the query, or the variable name was skipped by mistake;
                throw new Error("No variable $" + (i + 1) + " found for the value with index " + i);
            }
            // check for raw-text variables presence:
            var raw = query.search(new RegExp(pattern + '\\^')) !== -1;
            var v = formatValue(arr[i], raw);
            if (raw) {
                // replacing $1^ variables ahead of $1 ones;
                query = query.replace(new RegExp(pattern + '\\^', 'g'), v);
                v = formatValue(arr[i]);
            }
            query = query.replace(new RegExp(pattern, 'g'), v);
        }
        return query;
    },
    
    // Replaces each occurrence of "$1" with the value passed;
    // Each "$1^" is replaced with its raw-text equivalent.
    value: function (query, value) {
        if (query.search(/\$1(?!\d)/) === -1) {
            throw new Error("No variable $1 found to replace with the value passed.");
        }
        var raw = query.search(/\$1(?!\d)\^/) !== -1; // raw-text flag;
        var v = formatValue(value, raw);
        if (raw) {
            // replacing $1^ ahead of $1;
            query = query.replace(/\$1(?!\d)\^/g, v);
            v = formatValue(value);
        }
        return query.replace(/\$1(?!\d)/g, v);
    }
};

// Null verification for the database values;
function isDBNull(val) {
    return val === undefined || val === null;
}

// Wraps text in single quotes;
function TEXT(text) {
    return "'" + text + "'";
}

function checkNullRaw(raw) {
    if (raw) {
        throw new Error("Values null/undefined cannot be used as raw text.");
    }
}

///////////////////////////////////////////////////////
// Global functions and properties - all start with $
///////////////////////////////////////////////////////

// 'pg-promise' own query formatting solution;
//
// It implements two types of formatting, depending on the 'values' passed:
//
// 1. format "$1, $2, etc", when 'values' is of type string, boolean, number, date, function or null
//    (or an array of the same types, plus undefined values);
// 2. format ${propName}, when 'values' is an object (not null and not Date)
//
// Raw text values can be injected using syntax: $1^,$2^ and ${propName^};
//
// When formatting fails, the function throws an error.
function $formatQuery(query, values) {
    if (typeof(query) !== 'string') {
        throw new Error("Parameter 'query' must be a text string.");
    }
    if (Array.isArray(values)) {
        // "$1, $2,.." formatting to be applied;
        query = formatAs.array(query, values);
    } else {
        if (values && typeof(values) === 'object' && !(values instanceof Date)) {
            // "${propName}" formatting to be applied;
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

// Formats a proper function call query;
// Example: 'select * from funcName(p1,p2,p3)'
function $formatFunction(funcName, values) {
    return 'select * from ' + funcName + '(' + formatCSV(values) + ')';
}

// Conversion helpers, exposed via 'pgp.as' namespace;
var $as = {
    text: function (txt, raw) {
        if (isDBNull(txt)) {
            checkNullRaw(raw);
            return 'null';
        }
        if (typeof(txt) !== 'string') {
            txt = txt.toString();
        }
        return raw ? txt : TEXT(txt.replace(/'/g, "''"));
    },
    bool: function (val) {
        if (isDBNull(val)) {
            return 'null';
        }
        return val ? 'true' : 'false';
    },
    date: function (d, raw) {
        if (isDBNull(d)) {
            checkNullRaw(raw);
            return 'null';
        }
        if (d instanceof Date) {
            // UTC date string is what PostgreSQL understands automatically:
            var s = d.toUTCString();
            return raw ? s : TEXT(s);
        } else {
            throw new Error(TEXT(d) + " is not a Date object.");
        }
    },
    number: function (num) {
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
        if (isDBNull(arr)) {
            return 'null';
        }
        if (arr instanceof Array) {
            return formatArray(arr);
        } else {
            throw new Error(TEXT(arr) + " is not an Array object.");
        }
    },
    func: function (func, raw, obj) {
        if (isDBNull(func)) {
            checkNullRaw(raw);
            return 'null';
        }
        if (typeof(func) !== 'function') {
            throw new Error(TEXT(func) + " is not a function.");
        }
        if (isDBNull(obj)) {
            return formatValue(func(), raw);
        } else {
            if (typeof(obj) !== 'object') {
                throw new Error(TEXT(obj) + " is not an object.");
            }
            return formatValue(func.call(obj), raw);
        }
    },
    json: function (obj, raw) {
        if (isDBNull(obj)) {
            checkNullRaw(raw);
            return 'null';
        }
        var s = JSON.stringify(obj);
        return raw ? s : TEXT(s.replace(/'/g, "''"));
    },
    csv: function (values) {
        return formatCSV(values);
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
