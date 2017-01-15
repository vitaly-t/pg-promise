'use strict';

/**
 * @constructor PromiseAdapter
 * @summary Adapter for the primary promise operations.
 * @description
 * Provides compatibility with promise libraries that cannot be recognized automatically,
 * via functions that implement the primary operations with promises:
 *
 *  - construct a new promise with a callback function
 *  - resolve a promise with some result data
 *  - reject a promise with a reason
 *
 * The type is available from the library's root: `pgp.PromiseAdapter`.
 *
 * @param {function} create
 * A function that takes a callback parameter and returns a new promise object.
 * The callback parameter is expected to be `function(resolve, reject)`.
 *
 * Passing in anything other than a function will throw `Adapter requires a function to create a promise.`
 *
 * @param {function} resolve
 * A function that takes an optional data parameter and resolves a promise with it.
 *
 * Passing in anything other than a function will throw `Adapter requires a function to resolve a promise.`
 *
 * @param {function} reject
 * A function that takes an optional error parameter and rejects a promise with it.
 *
 * Passing in anything other than a function will throw `Adapter requires a function to reject a promise.`
 *
 * @returns {PromiseAdapter}
 */
function PromiseAdapter(create, resolve, reject) {

    if (!(this instanceof PromiseAdapter)) {
        return new PromiseAdapter(create, resolve, reject);
    }

    this.create = create;
    this.resolve = resolve;
    this.reject = reject;

    if (typeof create !== 'function') {
        throw new TypeError('Adapter requires a function to create a promise.');
    }

    if (typeof resolve !== 'function') {
        throw new TypeError('Adapter requires a function to resolve a promise.');
    }

    if (typeof reject !== 'function') {
        throw new TypeError('Adapter requires a function to reject a promise.');
    }
}

module.exports = PromiseAdapter;
