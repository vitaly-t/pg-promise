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
        insert: function (data, columns, table) {
            var capSQL = config.options && config.options.capSQL;
            return $npm.insert(data, columns, table, capSQL);
        },
        update: function (data, columns, table, options) {
            var capSQL = config.options && config.options.capSQL;
            return $npm.update(data, columns, table, options, capSQL);
        },
        ColumnSet: $npm.ColumnSet
    };
    Object.freeze(res);
    return res;
};
