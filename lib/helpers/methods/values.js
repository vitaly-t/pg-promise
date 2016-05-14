'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.values
 * @description
 * Generates a string of comma-separated value groups from either one object or an array of objects,
 * to be used as part of a query:
 *
 * - from a single object: `(val_1, val_2, ...)`
 * - from an array of objects: `(val_11, val_12, ...), (val_21, val_22), ...`
 *
 * @param {Object|Object[]} data
 * A source object with properties as values, or an array of such objects.
 *
 * If it is anything else, the method will throw {@link external:TypeError TypeError} = `Invalid 'data' specified.`
 *
 * @param {Array|helpers.Column|helpers.ColumnSet} [columns]
 * Columns for which to return values.
 *
 * It is optional when `data` is a single object, in which case the object's properties are used.
 * And it is required when `data` is an array of objects.
 *
 * @returns {String}
 *
 * @see
 *  {@link helpers.Column Column},
 *  {@link helpers.ColumnSet ColumnSet}
 *
 * @example
 *
 * var pgp = require('pg-promise')();
 *
 * var dataSingle = {val: 123, msg: 'hello'};
 * var dataMulti = [{val: 123, msg: 'hello'}, {val: 456, msg: 'world!'}];
 *
 * // Properties can be pulled automatically from a single object:
 *
 * pgp.helpers.values(dataSingle);
 * //=> (123,'hello')
 *
 * @example
 *
 * // Column details are required when using an array of objects:
 *
 * pgp.helpers.values(dataMulti, ['val', 'msg']);
 * //=> (123,'hello'),(456,'world!')
 *
 * @example
 *
 * // Column details from a reusable ColumnSet (recommended for performance):
 *
 * var cs = new pgp.helpers.ColumnSet(['val', 'msg']);
 *
 * pgp.helpers.values(dataMulti, cs);
 * //=> (123,'hello'),(456,'world!')
 *
 */
function values(data, columns) {

    if (!data || typeof data !== 'object') {
        throw new TypeError("Invalid 'data' specified.");
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
                throw new Error("Invalid object at index " + index + ".");
            }
            return '(' + format(columns.variables, columns.prepare(d)) + ')';
        }).join();
    }
    return '(' + format(columns.variables, columns.prepare(data)) + ')';
}

module.exports = values;
