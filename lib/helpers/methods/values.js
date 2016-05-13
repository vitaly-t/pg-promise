'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

// istanbul ignore next;
/**
 * @method helpers.values
 * @private
 * @description
 * Generates a string of comma-separated value groups for either one object or an array of objects.
 *
 * @param {Object|Object[]} data
 * A source object with properties - values, or an array of such objects.
 *
 * @param {Array|helpers.Column|helpers.ColumnSet} [columns]
 * Columns for which to return values.
 *
 * @returns {String}
 *
 */
function values(data, columns) {

    if (!data || typeof data !== 'object') {
        throw new TypeError("Invalid parameter 'data' specified.");
    }

    var isArray = Array.isArray(data);

    if (isArray && !data.length) {
        throw new TypeError("Cannot generate values from an empty array.");
    }

    if (!(columns instanceof $npm.ColumnSet)) {
        if (isArray && $npm.utils.isNull(columns)) {
            throw new TypeError("Parameter 'columns' is required when generating a multi-value string.");
        }
        columns = new $npm.ColumnSet(columns || data);
    }

    if (!columns.columns.length) {
        throw new Error("Cannot generate values without any columns.");
    }

    var format = $npm.formatting.as.format;

    if (isArray) {
        return data.$map(function (d, index) {
            if (!d || typeof d !== 'object') {
                throw new Error("Invalid values object at index " + index + ".");
            }
            return '(' + format(columns.variables, columns.prepare(d)) + ')';
        }).join();
    }
    return '(' + format(columns.variables, columns.prepare(data)) + ')';
}

module.exports = values;
