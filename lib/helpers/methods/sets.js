'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    format: require('../../formatting').as.format,
    utils: require('../../utils')
};

/**
 * @method helpers.sets
 * @description
 * Generates a string of comma-separated `SET` commands for a single object,
 * in the same way as values are set with an `UPDATE` query.
 *
 * @param {Object} data
 * A simple, non-null and non-array source object.
 *
 * If it is anything else, the method will throw {@link external:TypeError TypeError} = `Invalid 'data' specified.`
 *
 * @param {Array|helpers.Column|helpers.ColumnSet} [columns]
 * Columns for which to return `SET` commands.
 *
 * When not specified, properties of the `data` object are used.
 *
 * @returns {String}
 *
 */
function sets(data, columns) {

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new TypeError("Invalid 'data' specified.");
    }

    if (!(columns instanceof $npm.ColumnSet)) {
        columns = new $npm.ColumnSet(columns || data);
    }

    return $npm.format(columns.getUpdates(data), columns.prepare(data));
}

module.exports = sets;
