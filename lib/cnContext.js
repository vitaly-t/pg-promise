'use strict';

/**
 * @class ConnectionContext
 * @private
 * @summary Connection context object.
 * @param {object} cn
 * @param {} dc
 * @param {object} options
 * @param {object} db
 * @param {number} txLevel
 */
class ConnectionContext {
    constructor(cn, dc, options, db, txLevel) {
        this.cn = cn; // connection details;
        this.dc = dc; // database context;
        this.options = options; // library options;
        this.db = db; // database session;
        this.txLevel = txLevel; // transaction level;
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
        return new ConnectionContext(this.cn, this.dc, this.options, this.db, this.txLevel);
    }
}

/**
 * Connection Context
 * @module context
 * @author Vitaly Tomilov
 * @private
 */
module.exports = ConnectionContext;
