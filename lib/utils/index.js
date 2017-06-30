'use strict';

const npm = {
    path: require('path'),
    patterns: require('../patterns')
};

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
        for (let i = 0; i < properties.length; i++) {
            if (!(properties[i] in value)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

///////////////////////////////////////////////////////////
// Approximates the environment as being for development.
//
// Proper configuration is having NODE_ENV = 'development', but this
// method only checks for 'dev' being present, and regardless of the case.
function isDev() {
    const env = global.process.env.NODE_ENV || '';
    return env.toLowerCase().indexOf('dev') !== -1;
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
        const desc = {
            writable: false,
            configurable: false,
            enumerable: true
        };
        for (let p in obj) {
            Object.defineProperty(obj, p, desc);
        }
    }
}

/////////////////////////////////////////////
// Adds properties from source to the target,
// making them read-only and enumerable.
function addReadProperties(target, source) {
    for (let p in source) {
        addReadProp(target, p, source[p]);
    }
}

///////////////////////////////////////////////////////
// Adds a read-only, non-deletable enumerable property.
function addReadProp(obj, name, value, hidden) {
    Object.defineProperty(obj, name, {
        value,
        configurable: false,
        enumerable: !hidden,
        writable: false
    });
}

//////////////////////////////////////////////////////////////
// Converts a connection string or object into its safe copy:
// if password is present, it is masked with symbol '#'.
function getSafeConnection(cn) {
    if (typeof cn === 'object') {
        const copy = JSON.parse(JSON.stringify(cn));
        if (typeof copy.password === 'string') {
            copy.password = copy.password.replace(/./g, '#');
        }
        return copy;
    }
    // or else it is a connection string;
    return cn.replace(/:(?![/])([^@]+)/, (_, m) => {
        return ':' + new Array(m.length + 1).join('#');
    });
}

///////////////////////////////////////////
// Returns a space gap for console output;
function messageGap(level) {
    return Array(1 + level * 4).join(' ');
}

/////////////////////////////////////////
// Provides platform-neutral inheritance;
function inherits(child, parent) {
    child.prototype.__proto__ = parent.prototype;
}

///////////////////////////////////////////////////////////////////////////
// Checks if the path is absolute;
//
// Though we do test it, we still skip it from the coverage,
// because it is platform-specific.
//
// istanbul ignore next
function isPathAbsolute(path) {
    // Based on: https://github.com/sindresorhus/path-is-absolute
    if (process.platform === 'win32') {
        const result = npm.patterns.splitDevice.exec(path);
        const device = result[1] || '';
        const isUnc = !!device && device.charAt(1) !== ':';
        return !!result[2] || isUnc;
    }
    return path.charAt(0) === '/';
}

function getLocalStack(startIdx) {
    // from the call stack, we take only lines starting with the client's
    // source code, and only those that contain a full path inside brackets,
    // indicating a reference to the client's source code:
    return new Error().stack.split('\n').slice(startIdx).filter(line => {
        return line.match(/\(.*(\\+|\/+).*\)/); // contains \ or / inside ()
    }).join('\n');
}

//////////////////////////////
// Internal error container;
function InternalError(error) {
    this.error = error;
}

const exp = {
    InternalError,
    getLocalStack,
    isPathAbsolute,
    lock,
    isText,
    isNull,
    isDev,
    isObject,
    addReadProp,
    addReadProperties,
    getSafeConnection,
    messageGap,
    inherits
};

const mainFile = process.argv[1];

// istanbul ignore next
exp.startDir = mainFile ? npm.path.dirname(mainFile) : process.cwd();

Object.freeze(exp);

module.exports = exp;
