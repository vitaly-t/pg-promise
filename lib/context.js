/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

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
 *
 * @param {object} cc.parentCtx
 * Connection Context of the parent operation, if any.
 *
 */
class ConnectionContext {

    constructor(cc) {
        this.cn = cc.cn; // connection details;
        this.dc = cc.dc; // database context;
        this.options = cc.options; // library options;
        this.db = cc.db; // database session;
        this.level = cc.level; // task level;
        this.txLevel = cc.txLevel; // transaction level;
        this.parentCtx = null; // parent context
        this.taskCtx = null; // task context
        this.start = null; // Date/Time when connected
    }

    connect(db) {
        this.db = db;
        this.start = new Date();
    }

    disconnect() {
        if (this.db) {
            this.db.release();
            this.db = null;
        }
    }

    clone() {
        const obj = new ConnectionContext(this);
        obj.parentCtx = this.taskCtx;
        return obj;
    }
}

/**
 * Connection Context
 * @module context
 * @author Vitaly Tomilov
 * @private
 */
module.exports = {ConnectionContext};
