/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const npm = {
    con: require('manakin').local,
    utils: require('./utils')
};

/**
 * @class DatabasePool
 * @static
 * @private
 */
class DatabasePool {

    /**
     * @method DatabasePool.register
     * @static
     * @description
     *  - Registers each database object, to make sure no duplicates connections are used,
     *    and if they are, produce a warning;
     *  - Registers each Pool object, to be able to release them all when requested.
     *
     * @param {Database} db - The new Database object being registered.
     */
    static register(db) {
        const cnKey = DatabasePool.createContextKey(db);
        npm.utils.addReadProp(db, '$cnKey', cnKey, true);
        if (cnKey in DatabasePool.dbMap) {
            DatabasePool.dbMap[cnKey]++;
            /* istanbul ignore if */
            if (!db.$config.options.noWarnings) {
                npm.con.warn('WARNING: Creating a duplicate database object for the same connection.\n%s\n',
                    npm.utils.getLocalStack(5));
            }
        } else {
            DatabasePool.dbMap[cnKey] = 1;
        }
        DatabasePool.dbs.push(db);
    }

    /**
     * @method DatabasePool.unregister
     * @static
     * @param db
     */
    static unregister(db) {
        const cnKey = db.$cnKey;
        if (!--DatabasePool.dbMap[cnKey]) {
            delete DatabasePool.dbMap[cnKey];
        }
    }

    /**
     * @method DatabasePool.shutDown
     * @static
     */
    static shutDown() {
        DatabasePool.dbs.forEach(db => {
            db.$destroy();
        });
        DatabasePool.dbs.length = 0;
        DatabasePool.dbMap = {};
    }

    /**
     * @method DatabasePool.createContextKey
     * @static
     * @description
     * For connections that are objects it reorders the keys alphabetically,
     * and then serializes the result into a JSON string.
     *
     * @param {Database} db - Database instance.
     */
    static createContextKey(db) {
        let cn = db.$cn;
        if (typeof cn === 'object') {
            const obj = {}, keys = Object.keys(cn).sort();
            keys.forEach(name => {
                obj[name] = cn[name];
            });
            cn = obj;
        }
        return npm.utils.toJson(npm.utils.getSafeConnection(cn)) + npm.utils.toJson(db.$dc);
    }
}

/////////////////////
// Static Properties:
DatabasePool.dbMap = {}; // map of used database context keys (connection + dc)
DatabasePool.dbs = []; // all database objects

module.exports = {DatabasePool};
