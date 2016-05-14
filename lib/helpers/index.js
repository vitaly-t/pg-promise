'use strict';

var $npm = {
    insert: require('./methods/insert'),
    update: require('./methods/update'),
    values: require('./methods/values'),
    sets: require('./methods/sets'),
    TableName: require('./tableName'),
    ColumnSet: require('./columnSet'),
    Column: require('./column')
};

/**
 * @namespace helpers
 * @description
 *
 * Namespace for query-formatting generators, available as `pgp.helpers`, after initializing the library.
 *
 * It is a set of types and methods for generating queries in a fast, flexible and reliable way.
 *
 * See also: $[Performance Boost].
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
 * @property {Function} values
 * {@link helpers.values values} static method.
 *
 * @property {Function} sets
 * {@link helpers.sets sets} static method.
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
        values: $npm.values,
        sets: $npm.sets,
        TableName: $npm.TableName,
        ColumnSet: $npm.ColumnSet,
        Column: $npm.Column
    };
    Object.freeze(res);
    return res;
};
