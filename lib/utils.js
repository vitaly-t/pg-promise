'use strict';

var os = require('os');
var errors = require('./errors');

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
// Parses and minifies SQL:
// - removes all comments;
// - replaces line breaks within string with \n
// - flattens result into a single line
function minifySQL(sql, file) {

    if (!sql.length) {
        return '';
    }

    var idx = 0, // current index;
        s = '', // resulting code;
        len = sql.length, // sql length;
        emptyLine = true, // set while no symbols encountered on the current line;
        emptyLetters = '', // empty letters on a new line;
        EOL = getEOL(sql), // end of line.
        regLB = new RegExp(EOL, 'g');

    do {
        if (sql[idx] === '-' && idx < len - 1 && sql[idx + 1] === '-') {
            var lb = sql.indexOf(EOL, idx + 2);
            if (lb < 0) {
                break;
            }
            if (emptyLine) {
                emptyLetters = '';
                idx = lb + EOL.length - 1; // last symbol of the line break;
            } else {
                idx = lb - 1; // just before the line break;
            }
            continue;
        }
        if (sql[idx] === '/' && idx < len - 1 && sql[idx + 1] === '*') {
            var end = sql.indexOf('*/', idx + 2);
            if (end < 0) {
                throwParsingError("unclosed multi-line comment.");
            }
            idx = end + 1;
            if (emptyLine) {
                emptyLetters = '';
            }
            var lb = sql.indexOf(EOL, idx + 1);
            if (lb > idx) {
                var gapIdx = lb - 1;
                while ((sql[gapIdx] === ' ' || sql[gapIdx] === '\t') && --gapIdx > idx);
                if (emptyLine && gapIdx === idx) {
                    idx = lb + EOL.length - 1; // last symbol of the line break;
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
            var closeIdx = idx;
            do {
                closeIdx = sql.indexOf(symbol, closeIdx + 1);
                if (closeIdx > 0) {
                    var shIdx = closeIdx;
                    while (++shIdx < len && sql[shIdx] === '\'');
                    if ((shIdx - closeIdx) % 2) {
                        closeIdx = shIdx - 1;
                        break;
                    }
                    closeIdx = shIdx === len ? -1 : shIdx;
                }
            } while (closeIdx > 0);
            if (closeIdx < 0) {
                throwParsingError("unclosed text block.");
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

    function throwParsingError(error) {
        var pos = getIndexPos(sql, idx, EOL);
        throw new errors.SQLParsingError(error, file, pos);
    }
}

function getIndexPos(text, idx, eol) {
    var line = 1, col = 1, pos = 0;
    do {
        pos = text.indexOf(eol, pos);
        if (pos == -1) {
            break;
        }
        pos += eol.length;
        if (pos <= idx) {
            line++;
        }
    } while (pos < idx);
    if (idx >= eol.length) {
        var lastIdx = text.lastIndexOf(eol, idx - eol.length);
        if (lastIdx === -1) {
            col = idx;
        } else {
            col = idx - lastIdx - eol.length + 1;
        }
    } else {
        col = idx + 1;
    }
    return {
        line: line,
        col: col
    };
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
    getIndexPos: getIndexPos,
    addProperties: addProperties,
    addReadProp: addReadProp,
    parsePromiseLib: parsePromiseLib,
    getSafeConnection: getSafeConnection
};
