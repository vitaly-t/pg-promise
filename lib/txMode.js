'use strict';

/**
 * @enum {Number} isolationLevel
 * @readonly
 * @summary Transaction Isolation Level.
 */
var isolationLevel = {
    /** Isolation level not specified. */
    none: 0,

    /** ISOLATION LEVEL SERIALIZABLE */
    serializable: 1,

    /** ISOLATION LEVEL REPEATABLE READ */
    repeatableRead: 2,

    /** ISOLATION LEVEL READ COMMITTED */
    readCommitted: 3
};

Object.freeze(isolationLevel);

/**
 * @constructor module:txMode.TransactionMode
 * @description
 * **Alternative Syntax:** `TransactionMode({tiLevel, readOnly, deferrable})`
 *
 * Constructs a complete transaction opening command,
 * based on Transaction Mode parameters:
 *  - isolation level
 *  - access mode
 *  - deferrable mode
 *
 * @param {isolationLevel|Object} [tiLevel]
 * Transaction Isolation Level
 *
 * @param {Boolean} [readOnly]
 * Sets transaction access mode based on the read-only flag:
 *  - `undefined` - access mode not specified (default)
 *  - `true` - access mode is set as `READ ONLY`
 *  - `false` - access mode is set as `READ WRITE`
 *
 * @param {Boolean} [deferrable]
 * Sets transaction deferrable mode based on the boolean value:
 *  - `undefined` - deferrable mode not specified (default)
 *  - `true` - mode is set as `DEFERRABLE`
 *  - `false` - mode is set as `NOT DEFERRABLE`
 *
 * @returns {TransactionMode}
 *
 * @see $[BEGIN]
 */
function TransactionMode(tiLevel, readOnly, deferrable) {

    if (!(this instanceof TransactionMode)) {
        return new TransactionMode(tiLevel, readOnly, deferrable);
    }

    if (tiLevel && typeof tiLevel === 'object') {
        readOnly = tiLevel.readOnly;
        deferrable = tiLevel.deferrable;
        tiLevel = tiLevel.tiLevel;
    }

    var isolationLevel, accessMode, deferrableMode, capBegin, begin = 'begin';

    tiLevel = (tiLevel > 0) ? parseInt(tiLevel) : 0;

    if (tiLevel > 0 && tiLevel < 4) {
        var values = ['serializable', 'repeatable read', 'read committed'];
        isolationLevel = 'isolation level ' + values[tiLevel - 1];
    }

    if (readOnly) {
        accessMode = 'read only';
    } else {
        if (readOnly !== undefined) {
            accessMode = 'read write';
        }
    }

    if (deferrable) {
        deferrableMode = 'deferrable';
    } else {
        if (deferrable !== undefined) {
            deferrableMode = 'not deferrable';
        }
    }

    if (isolationLevel) {
        begin += ' ' + isolationLevel;
    }

    if (accessMode) {
        begin += ' ' + accessMode;
    }

    if (deferrableMode) {
        begin += ' ' + deferrableMode;
    }

    capBegin = begin.toUpperCase();

    this.begin = function (cap) {
        return cap ? capBegin : begin;
    };
}

/**
 * Transaction Mode library
 * @module txMode
 * @author Vitaly Tomilov
 *
 * @description
 * Extends the default `BEGIN` with Transaction Mode parameters:
 *  - isolation level
 *  - access mode
 *  - deferrable mode
 *
 * @see $[BEGIN]
 */
module.exports = {
    isolationLevel: isolationLevel,
    TransactionMode: TransactionMode
};
