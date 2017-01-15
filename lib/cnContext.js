'use strict';

/**
 * @constructor ConnectionContext
 * @private
 * @summary Connection context object.
 * @param {object} cn
 * @param {} dc
 * @param {object} options
 * @param {object} db
 * @param {number} txLevel
 */
function ConnectionContext(cn, dc, options, db, txLevel) {

    this.cn = cn; // connection details;
    this.dc = dc; // database context;
    this.options = options; // library options;
    this.db = db; // database session;
    this.txLevel = txLevel; // transaction level;

    this.connect = function (db) {
        this.db = db;
    };

    this.disconnect = function () {
        if (this.db) {
            this.db.done();
            this.db = null;
        }
    };

    this.clone = function () {
        return new ConnectionContext(this.cn, this.dc, this.options, this.db, this.txLevel);
    };
}

/**
 * Connection Context
 * @module context
 * @author Vitaly Tomilov
 * @private
 */
module.exports = ConnectionContext;
