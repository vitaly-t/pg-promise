'use strict';

const npm = {
    con: require('manakin').local,
    utils: require('./utils')
};

/**
 * @class DatabasePool
 * @private
 */
class DatabasePool {

    constructor() {
        this.dbMap = {}; // map of used database connections
        this.dbs = []; // all database objects
    }

    /**
     * @method DatabasePool.register
     * @private
     * @description
     *  - Registers each database object, to make sure no duplicates connections are used,
     *    and if they are, produce a warning;
     *  - Registers each Pool object, to be able to release them all when requested.
     *
     * @param {Database} db - The new Database object being registered.
     */
    register(db) {
        const cnKey = DatabasePool.normalizeConnection(db.$cn);
        if (cnKey in this.dbMap) {
            this.dbMap[cnKey]++;
            if (!db.$config.options.noWarnings) {
                npm.con.warn('WARNING: Creating a duplicate database object for the same connection.\n%s\n',
                    npm.utils.getLocalStack(5));
            }
        } else {
            this.dbMap[cnKey] = 1;
        }
        this.dbs.push(db);
    }

    /**
     * @method DatabasePool.unregister
     * @param db
     */
    unregister(db) {
        const cnKey = DatabasePool.normalizeConnection(db.$cn);
        if (!--this.dbMap[cnKey]) {
            delete this.dbMap[cnKey];
        }
    }

    /**
     * @method DatabasePool.shutDown
     * @private
     */
    shutDown() {
        this.dbs.forEach(db => {
            db.$destroy();
        });
        this.dbs.length = 0;
        this.dbMap = {};
    }

    /**
     * @method DatabasePool.normalizeConnection
     * @static
     * @private
     * @description
     * For connections that are objects it reorders the keys alphabetically,
     * and then serializes the result into a JSON string.
     *
     * @param {string|object} cn - connection string or object
     */
    static normalizeConnection(cn) {
        if (typeof cn === 'object') {
            const obj = {}, keys = Object.keys(cn).sort();
            keys.forEach(name => {
                obj[name] = cn[name];
            });
            cn = obj;
        }
        return JSON.stringify(cn);
    }
}

module.exports = new DatabasePool();
