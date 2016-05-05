'use strict';

var $npm = {
    insert: require('./methods/insert'),
    update: require('./methods/update'),
    ColumnSet: require('./columnSet'),
    Column: require('./column')
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
        insert: function (table, cols, obj) {
            var capSQL = config.options && config.options.capSQL;
            return $npm.insert(table, cols, obj, capSQL);
        },
        update: function (table, cols, obj) {
            var capSQL = config.options && config.options.capSQL;
            return $npm.update(table, cols, obj, capSQL);
        },
        ColumnSet: $npm.ColumnSet,
        Column: $npm.Column // should we really export it?
    };
    Object.freeze(res);
    return res;
};
