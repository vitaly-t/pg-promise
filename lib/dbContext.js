'use strict';

/**
 * @constructor DatabaseContext
 * @private
 * @summary Database connection context object.
 * @param {Object} cn
 * @param {Object} options
 * @param {Object} db
 * @param {Number} txLevel
 */
function DatabaseContext(cn, options, db, txLevel) {

    this.cn = cn; // connection details;
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
        return new DatabaseContext(this.cn, this.options, this.db, this.txLevel);
    };
}

/**
 * Database Context
 * @module context
 * @author Vitaly Tomilov
 * @private
 */
module.exports = DatabaseContext;
