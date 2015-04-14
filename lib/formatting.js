'use strict';

// Null verification for the database values;
function isDBNull(val) {
    return val === undefined || val === null;
}

// Wraps text in single quotes;
function wrapText(text) {
    return "'" + text + "'";
}

// Converts value into Postgres format;
// Supported types: text, boolean, date, number, null, undefined and array;
// When value type is not supported, it returns null.
function formatValue(val, raw) {
    if (isDBNull(val)) {
        if (raw) {
            throw new Error(errors.rawNull());
        }
        return 'null';
    }
    switch (typeof(val)) {
        case 'string':
            return $as.text(val, raw);
        case 'boolean':
            return $as.bool(val);
        case 'function':
            return null; // error: functions are not supported;
        default:
            if (val instanceof Date) {
                return $as.date(val, raw);
            } else {
                if (val instanceof Array) {
                    return $as.array(val);
                } else {
                    // an unknown object or a number;
                    return typeof(val) === 'object' ? null : val.toString();
                }
            }
    }
}

// Converts array of values into PostgreSQL array constructor `array[...]`,
// as per PostgreSQL documentation: http://www.postgresql.org/docs/9.4/static/arrays.html
// Arrays of any dimension are supported.
function formatArray(arr, idx) {
    var s = '';
    if (!idx) {
        idx = []; // indexes;
        s = 'array';
    }
    s += '[';
    for (var i = 0; i < arr.length; i++) {
        if (i) {
            s += ',';
        }
        var v = arr[i];
        if (v instanceof Array) {
            idx.push(i);
            s += formatArray(v, idx);
        } else {
            var value = formatValue(v);
            if (value === null) {
                idx.push(i);
                throw new Error(errors.arrayType(v, idx.join(',')));
            }
            s += value;
        }
    }
    return s + ']';
}

// Formats array of javascript-type parameters as a csv list,
// so it can be passed into a function.
// Both single value and array or values are supported.
function formatCSV(values) {
    var s = '';
    if (Array.isArray(values)) {
        for (var i = 0; i < values.length; i++) {
            if (i) {
                s += ',';
            }
            var v = formatValue(values[i]);
            if (v === null) {
                // error: cannot convert;
                throw new Error(errors.arrayType(values[i], i));
            }
            s += v;
        }
    } else {
        if (values !== undefined) {
            s = formatValue(values);
            if (s === null) {
                // error: cannot convert;
                throw new Error(errors.paramType(values));
            }
        }
    }
    return s;
}

/////////////////////////////////////////////////////////////
// Returns array of unique variable names in a text string;
//
// Variables are defined using syntax "${varName}", with
// optional ${varName^} for injecting raw text values.
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
var formatWith = {

    // Replaces each "${propName}" with the corresponding
    // property's value from the object - parameter;
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
            var v = formatValue(prop, raw);
            if (v === null) {
                // error: cannot convert;
                throw new Error("Cannot convert type '" + typeof(prop) + "' of property '" + sName + "'");
            }
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
            if (v === null) {
                // error: cannot convert;
                throw new Error(errors.arrayType(arr[i], i));
            }
            if (raw) {
                // replacing $1^ variables ahead of $1 ones;
                query = query.replace(new RegExp(pattern + '\\^', 'g'), v);
                v = formatValue(arr[i]);
            }
            query = query.replace(new RegExp(pattern, 'g'), v);
        }
        return query;
    },

    // Replaces "$1" with the value passed;
    value: function (query, value) {
        if (query.search(/\$1(?!\d)/) === -1) {
            throw new Error("No variable $1 found to replace with the value passed.");
        }
        var raw = query.search(/\$1(?!\d)\^/) !== -1; // raw-text flag;
        var v = formatValue(value, raw);
        if (v === null) {
            // error: cannot convert;
            throw new Error(errors.paramType(value));
        }
        if (raw) {
            // replacing $1^ ahead of $1;
            query = query.replace(/\$1(?!\d)\^/g, v);
            v = formatValue(value); // can never fail here, so no check needed;
        }
        return query.replace(/\$1(?!\d)/g, v);
    }
};

///////////////////////////////////////////////////////
// Global functions and properties - all start with $
///////////////////////////////////////////////////////

// 'pg-promise' own query formatting solution;
//
// It implements two types of formatting, depending on the 'values' passed:
//
// 1. format "$1, $2, etc", when 'values' is simple (text, boolean, number, date or null)
//    or an array of such simple values;
// 2. format ${propName}, when 'values' is an object (not null and not Date)
//
// Raw text values can be injected using syntax: $1^,$2^ and ${propName^};
//
// When fails, the function throws an error.
function $formatQuery(query, values) {
    if (typeof(query) !== 'string') {
        throw new Error("Parameter 'query' must be a text string.");
    }
    if (Array.isArray(values)) {
        // "$1, $2,.." formatting to be applied;
        query = formatWith.array(query, values);
    } else {
        if (values && typeof(values) === 'object' && !(values instanceof Date)) {
            // "${propName}" formatting to be applied;
            query = formatWith.object(query, values);
        } else {
            if (values !== undefined) {
                // "$1" formatting to be applied;
                query = formatWith.value(query, values);
            }
        }
    }
    return query;
}

// Formats a proper function call query;
// Example: 'select * from funcName(p1,p2,p3)'
function $funcQuery(funcName, values) {
    return 'select * from ' + funcName + '(' + formatCSV(values) + ')';
}

// Value wrapper to be exposed through 'pgp.as' namespace;
var $as = {
    text: function (txt, raw) {
        if (isDBNull(txt)) {
            if (raw) {
                throw new Error(errors.rawNull());
            }
            return 'null';
        }
        if (typeof(txt) !== 'string') {
            txt = txt.toString();
        }
        return raw ? txt : wrapText(txt.replace(/'/g, "''"));
    },
    bool: function (val) {
        if (isDBNull(val)) {
            return 'null';
        }
        return val ? 'true' : 'false';
    },
    date: function (d, raw) {
        if (isDBNull(d)) {
            if (raw) {
                throw new Error(errors.rawNull());
            }
            return 'null';
        }
        if (d instanceof Date) {
            // UTC date string is what PostgreSQL understands automatically:
            var s = d.toUTCString();
            return raw ? s : wrapText(s);
        } else {
            throw new Error(wrapText(d) + " doesn't represent a valid Date object.");
        }
    },
    array: function (arr) {
        if (isDBNull(arr)) {
            return 'null';
        }
        if (arr instanceof Array) {
            return formatArray(arr);
        } else {
            throw new Error(wrapText(arr) + " doesn't represent a valid Array object.");
        }
    },
    csv: function (values) {
        return formatCSV(values);
    },
    format: function (query, values) {
        return $formatQuery(query, values);
    }
};

// common error messages during formatting;
var errors = {
    arrayType: function (value, index) {
        return "Cannot convert type '" + typeof(value) + "' of the array element with index " + index;
    },
    paramType: function (value) {
        return "Cannot convert type '" + typeof(value) + "' of the parameter.";
    },
    rawNull: function () {
        return "Values null/undefined cannot be used as raw text.";
    }
};

module.exports = {
    formatQuery: $formatQuery,
    funcQuery: $funcQuery,
    as: $as
};
