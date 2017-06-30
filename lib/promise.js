'use strict';

const PromiseAdapter = require('./adapter');

//////////////////////////////////////////
// Parses and validates a promise library;
function parsePromiseLib(pl) {

    let promise;
    if (pl instanceof PromiseAdapter) {
        promise = function (func) {
            return pl.create(func);
        };
        promise.resolve = pl.resolve;
        promise.reject = pl.reject;
        promise.all = pl.all;
        return promise;
    }
    const t = typeof pl;
    if (t === 'function' || t === 'object') {
        const Root = typeof pl.Promise === 'function' ? pl.Promise : pl;
        promise = function (func) {
            return new Root(func);
        };
        promise.resolve = Root.resolve;
        promise.reject = Root.reject;
        promise.all = Root.all;
        if (typeof promise.resolve === 'function' &&
            typeof promise.reject === 'function' &&
            typeof promise.all === 'function') {
            return promise;
        }
    }

    throw new TypeError('Invalid promise library specified.');
}

function init(promiseLib) {
    const result = {promiseLib};
    if (promiseLib) {
        result.promise = parsePromiseLib(promiseLib);
    } else {
        result.promise = parsePromiseLib(Promise);
        result.promiseLib = Promise;
    }
    return result;
}

module.exports = init;
