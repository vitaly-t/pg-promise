'use strict';

/**
 * @class ConnectionContext
 * @private
 * @summary Internal connection context.
 *
 * @param {object} cc
 * Connection Context.
 *
 * @param {object} cc.cn
 * Connection details
 *
 * @param {*} cc.dc
 * Database Context
 *
 * @param {object} cc.options
 * Library's Initialization Options
 *
 * @param {object} cc.db
 * Database Session we're attached to, if any.
 *
 * @param {number} cc.level
 * Task Level
 *
 * @param {number} cc.txLevel
 * Transaction Level
 */
class ConnectionContext {
    // cn, dc, options, db, level, txLevel
    constructor(cc) {

        this.cn = cc.cn; // connection details;
        this.dc = cc.dc; // database context;
        this.options = cc.options; // library options;
        this.db = cc.db; // database session;
        this.level = cc.level; // task level;
        this.txLevel = cc.txLevel; // transaction level;
    }

    connect(db) {
        this.db = db;
    }

    disconnect() {
        if (this.db) {
            this.db.done();
            this.db = null;
        }
    }

    clone() {
        return new ConnectionContext(this);
    }
}

/**
 * Connection Context
 * @module context
 * @author Vitaly Tomilov
 * @private
 */
module.exports = ConnectionContext;
