'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    format: require('../../formatting').as.format,
    utils: require('../../utils')
};

// istanbul ignore next;
/**
 * @method helpers.sets
 * @private
 * @description
 * Generates a string of comma-separated set commands.
 *
 * @param {Object} data
 * Data source object.
 *
 * @param {Array|helpers.Column|helpers.ColumnSet} [columns]
 * Columns for which to return set commands.
 *
 * @returns {String}
 *
 */
function sets(data, columns) {

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new TypeError("Invalid parameter 'data' specified.");
    }

    if (!(columns instanceof $npm.ColumnSet)) {
        columns = new $npm.ColumnSet(columns || data);
    }

    return $npm.format(columns.getUpdates(data), columns.prepare(data));
}

module.exports = sets;
