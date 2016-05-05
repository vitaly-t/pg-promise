'use strict';

var $npm = {
    insert: require('./methods/insert'),
    update: require('./methods/update'),
    ColumnSet: require('./columnSet')
};

/**
 * @namespace helpers
 * @private
 * @description
 * **NOTE: Due to be introduced with `pg-promise` v.4.1.0, it is currently under development.**
 *
 * Namespace for all query-formatting helper functions, available as `pgp.helpers` after initializing the library.
 */
module.exports = function (config) {
    var res = {
        insert: function (columns, obj, table) {
            var capSQL = config.options && config.options.capSQL;
            return $npm.insert(columns, obj, table, capSQL);
        },
        update: function (columns, obj, table) {
            var capSQL = config.options && config.options.capSQL;
            return $npm.update(columns, obj, table, capSQL);
        },
        ColumnSet: $npm.ColumnSet
    };
    Object.freeze(res);
    return res;
};
