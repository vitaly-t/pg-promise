'use strict';

var $npm = {
    con: require('manakin').local,
    events: require('./events'),
    utils: require('./utils')
};

var dbs = {}, pools = [];

/**
 *  - Registers each database object, to make sure no duplicates connections are used,
 *    and if they are, produce a warning;
 *  - Registers each Pool object, to be able to release them all when requested.
 *
 * @param {Database} db - The new Database object being registered.
 *
 * @private
 */
function register(db) {
    var cnKey = normalizeConnection(db.$cn);
    if (cnKey in dbs) {
        if (!db.$config.options.noWarnings) {
            $npm.con.warn('WARNING: Creating a duplicate database object for the same connection.\n%s\n',
                $npm.utils.getLocalStack(5));
        }
    } else {
        dbs[cnKey] = db;
    }
    pools.push(db.$pool);
}

function shutDown() {
    pools.forEach(p => {
        p.end(); // Mr. Dead Pool :)
    });
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
