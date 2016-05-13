'use strict';

var $npm = {
    insert: require('./methods/insert'),
    update: require('./methods/update'),
    TableName: require('./tableName'),
    ColumnSet: require('./columnSet'),
    Column: require('./column')
};

/**
 * @namespace helpers
 * @description
 *
 * Namespace for automated query formatting helpers, available as `pgp.helpers`, after initializing the library.
 *
 * Types and methods that are found here are mainly to help with generating multi-insert and multi-update queries in
 * a reliable and flexible/extensible way, as well as single-insert and single-update queries.
 * 
 * To understand their importance, read $[Performance Boost].
 *
 * @property {Function} TableName
 * {@link helpers.TableName TableName} class constructor.
 *
 * @property {Function} ColumnSet
 * {@link helpers.ColumnSet ColumnSet} class constructor.
 *
 * @property {Function} Column
 * {@link helpers.Column Column} class constructor.
 *
 * @property {Function} insert
 * {@link helpers.insert insert} static method.
 *
 * @property {Function} update
 * {@link helpers.update update} static method.
 *
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
        TableName: $npm.TableName,
        ColumnSet: $npm.ColumnSet,
        Column: $npm.Column
    };
    Object.freeze(res);
    return res;
};
