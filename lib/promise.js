'use strict';

var PromiseAdapter = require('./adapter');

//////////////////////////////////////////
// Parses and validates a promise library;
function parsePromiseLib(pl) {

    var promise;
    if (pl instanceof PromiseAdapter) {
        promise = function (func) {
            return pl.create(func);
        };
        promise.resolve = pl.resolve;
        promise.reject = pl.reject;
        return promise;
    }
    var t = typeof pl;
    if (t === 'function' || t === 'object') {
        var root = typeof pl.Promise === 'function' ? pl.Promise : pl;
        promise = function (func) {
            return new root(func);
        };
        promise.resolve = root.resolve;
        promise.reject = root.reject;
        if (typeof promise.resolve === 'function' && typeof promise.reject === 'function') {
            return promise;
        }
    }

    throw new TypeError("Invalid promise library specified.");
}

function init(promiseLib) {
    var result = {
        promiseLib: promiseLib
    };
    if (promiseLib) {
        result.promise = parsePromiseLib(promiseLib);
    } else {
        // istanbul ignore if
        // Excluding from coverage, because it is
        // only triggered for NodeJS prior to 0.12
        if (typeof Promise === 'undefined') {
            // ES6 Promise isn't supported, NodeJS is pre-0.12;
            throw new TypeError("Promise library must be specified.");
        }
        result.promise = parsePromiseLib(Promise);
        result.promiseLib = Promise;
    }
    return result;
}

module.exports = init;
