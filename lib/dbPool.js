'use strict';

var $npm = {
    ConnectionParameters: require('pg/lib/connection-parameters'), // TODO: still needed?
    events: require('./events'),
    utils: require('./utils')
};

var dbPool = {};

// TODO: pass in just the pool, once it is working?

function register(db) {
    var cnKey = normalizeConnection(db.$cn);
    if (cnKey in dbPool) {
        if (!db.$config.options.noWarnings) {
            $npm.con.warn('WARNING: Creating a duplicate database object for the same connection.\n%s\n',
                $npm.utils.getLocalStack(5));
        }
    } else {
        dbPool[cnKey] = db;
    }
}

function shutDown() {
    for (var name in dbPool) {
        dbPool[name].$pool.end(); // Mr. Dead Pool :)
    }
}

/**
 * For connections that are objects it reorders the keys alphabetically,
 * and then serializes the result into a JSON string.
 *
 * @param {string|object} cn - connection string or object
 *
 * @private
 */
function normalizeConnection(cn) {
    // TODO: Normalize based on the ConnectionParameters instead?
    if (typeof cn === 'object') {
        var obj = {}, keys = Object.keys(cn).sort();
        keys.forEach(name => {
            obj[name] = cn[name];
        });
        cn = obj;
    }
    return JSON.stringify(cn);
}

module.exports = {
    register,
    shutDown
};
