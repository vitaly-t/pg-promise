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

//////////////////////////////
// Internal error container;
function InternalError(message) {
    this.message = message;
}

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
    addReadProp: addReadProp,
    getSafeConnection: getSafeConnection,
    InternalError: InternalError
};
