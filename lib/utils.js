'use strict';

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
// Adds properties from source to the target,
// and locks the target for any override.
function addProperties(target, source) {
    for (var p in source) {
        target[p] = source[p];
    }
    lock(target);
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
    if (typeof cn === 'string') {
        return cn.replace(/:(?![\/])([^@]+)/, function (_, m) {
            return ':' + new Array(m.length + 1).join('#');
        });
    }
    if (cn && typeof cn === 'object') {
        var copy = JSON.parse(JSON.stringify(cn));
        if (typeof cn.password === 'string' && cn.password.length) {
            copy.password = copy.password.replace(/./g, '#');
        }
        return copy;
    }
    return cn;
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
    isText: isText,
    isNull: isNull,
    isObject: isObject,
    addProperties: addProperties,
    parsePromiseLib: parsePromiseLib,
    getSafeConnection: getSafeConnection
};
