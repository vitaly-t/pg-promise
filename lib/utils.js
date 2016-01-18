'use strict';

var os = require('os');

////////////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === null || value === undefined;
}

////////////////////////////////////////////////////////
// Verifies parameter for being a non-empty text string;
function isText(txt) {
    return txt && typeof txt === 'string' && /\S/.test(txt);
}

//////////////////////////////////////
// Verifies value for being an object,
// based on type and property names.
function isObject(value, properties) {
    if (value && typeof value === 'object') {
        for (var i = 0; i < properties.length; i++) {
            if (!(properties[i] in value)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

///////////////////////////////////////////////////
// Locks all properties in an object to read-only,
// or freezes the entire object for any changes.
function lock(obj, freeze, options) {
    if (options && options.noLocking) {
        return;
    }
    if (freeze) {
        Object.freeze(obj); // freeze the entire object, permanently;
    } else {
        var desc = {
            writable: false
        };
        for (var p in obj) {
            Object.defineProperty(obj, p, desc);
        }
    }
}

/////////////////////////////////////////////
// Adds properties from source to the target.
function addProperties(target, source) {
    for (var p in source) {
        target[p] = source[p];
    }
}

////////////////////////////////////////////
// Adds a read-only enumerable property.
function addReadProp(obj, name, value) {
    Object.defineProperty(obj, name, {
        value: value,
        enumerable: true,
        writable: false
    });
}

//////////////////////////////////////////
// Parses and validates a promise library;
function parsePromiseLib(lib) {

    var promise;
    if (lib instanceof PromiseAdapter) {
        promise = function (func) {
            return lib.create(func);
        };
        promise.resolve = lib.resolve;
        promise.reject = lib.reject;
        return promise;
    }
    var t = typeof lib;
    if (t === 'function' || t === 'object') {
        var root = lib.Promise instanceof Function ? lib.Promise : lib;
        promise = function (func) {
            return new root(func);
        };
        promise.resolve = root.resolve;
        promise.reject = root.reject;
        if (promise.resolve instanceof Function && promise.reject instanceof Function) {
            return promise;
        }
    }

    throw new TypeError("Invalid promise library specified.");
}

//////////////////////////////////////////////////////////////
// Converts a connection string or object into its safe copy:
// if password is present, it is masked with symbol '#'.
function getSafeConnection(cn) {
    if (typeof cn === 'object') {
        var copy = JSON.parse(JSON.stringify(cn));
        if (typeof copy.password === 'string') {
            copy.password = copy.password.replace(/./g, '#');
        }
        return copy;
    }
    // or else it is a connection string;
    return cn.replace(/:(?![\/])([^@]+)/, function (_, m) {
        return ':' + new Array(m.length + 1).join('#');
    });
}

////////////////////////////////////////
// Automatically determines and returns
// the type of End-of-Line in the text.
//
// istanbul ignore next: Under development
function getEOL(text) {
    var idx = 0, unix = 0, windows = 0;
    while (idx < text.length) {
        idx = text.indexOf('\n', idx);
        if (idx == -1) {
            break;
        }
        if (idx > 0 && text[idx - 1] === '\r') {
            windows++;
        } else {
            unix++;
        }
        idx++;
    }
    if (unix === windows) {
        return os.EOL;
    }
    return unix > windows ? '\n' : '\r\n';
}

////////////////////////////////////////////////
// Minifies SQL:
// - removes all comments;
// - replaces line breaks within string with \n
// - flattens result into a single line
//
// istanbul ignore next: Under development
function minifySQL(sql) {

    // TODO: Must allow for '' inside strings;
    // TODO: Must throw an error on invalid SQL?

    var idx = 0, // current index;
        s = '', // resulting code;
        len = sql.length, // sql length;
        emptyLine = true, // set while no symbols encountered on the current line;
        emptyLetters = '', // empty letters on a new line;
        EOL = getEOL(sql); // end of line.

    var regLB = new RegExp(EOL, 'g');

    do {
        if (sql[idx] === '-' && idx < len - 1 && sql[idx + 1] === '-') {
            var lb = sql.indexOf(EOL, idx + 2);
            if (lb < 0) {
                break;
            }
            if (emptyLine) {
                emptyLetters = '';
            } else {
                idx = lb - 1; // just before the line break;
            }
            continue;
        }
        if (sql[idx] === '/' && idx < len - 1 && sql[idx + 1] === '*') {
            var end = sql.indexOf('*/', idx + 2);
            if (end < 0) {
                break;
            }
            idx = end + 1;
            if (emptyLine) {
                emptyLetters = '';
            }
            var lb = sql.indexOf(EOL, idx + 1);
            if (lb > idx) {
                var gapIdx = lb - 1;
                while ((sql[gapIdx] === ' ' || sql[gapIdx] === '\t') && --gapIdx > idx);
                if (gapIdx === idx) {
                    if (emptyLine) {
                        idx = lb + EOL.length - 1; // last symbol of the line break;
                    }
                }
            }
            continue;
        }

        var symbol = sql[idx];
        var isSpace = symbol === ' ' || symbol === '\t';
        if (symbol === '\r' || symbol === '\n') {
            if (sql.indexOf(EOL, idx) === idx) {
                emptyLine = true;
            }
        } else {
            if (!isSpace) {
                emptyLine = false;
                s += emptyLetters;
                emptyLetters = '';
            }
        }
        if (emptyLine && isSpace) {
            emptyLetters += symbol;
        } else {
            s += symbol;
        }

        if (symbol === '\'') {
            var closeIdx = sql.indexOf(symbol, idx + 1);
            if (closeIdx < 0) {
                break;
            }
            s += sql.substr(idx + 1, closeIdx - idx).replace(regLB, '\\n');
            idx = closeIdx;
        }

    } while (++idx < len);

    return s
        .split(EOL)
        .map(function (line) {
            return line.replace(/^(\s)+|(\s)+$/g, '');
        })
        .filter(function (line) {
            return line.length > 0;
        }).join(' ');
}

var PromiseAdapter = require('./adapter');

/**
 * Utilities
 * @module utils
 * @author Vitaly Tomilov
 * @private
 */
module.exports = {
    lock: lock,
    getEOL: getEOL,
    isText: isText,
    isNull: isNull,
    isObject: isObject,
    minifySQL: minifySQL,
    addProperties: addProperties,
    addReadProp: addReadProp,
    parsePromiseLib: parsePromiseLib,
    getSafeConnection: getSafeConnection
};
