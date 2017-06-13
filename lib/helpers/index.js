'use strict';

const $npm = {
    concat: require('./methods/concat'),
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
 * Namespace for query-formatting generators, available as `pgp.helpers`, after initializing the library.
 *
 * It is a set of types and methods for generating queries in a fast, flexible and reliable way.
 *
 * See also: $[Performance Boost].
 *
 * @property {function} TableName
 * {@link helpers.TableName TableName} class constructor.
 *
 * @property {function} ColumnSet
 * {@link helpers.ColumnSet ColumnSet} class constructor.
 *
 * @property {function} Column
 * {@link helpers.Column Column} class constructor.
 *
 * @property {function} insert
 * {@link helpers.insert insert} static method.
 *
 * @property {function} update
 * {@link helpers.update update} static method.
 *
 * @property {function} values
 * {@link helpers.values values} static method.
 *
 * @property {function} sets
 * {@link helpers.sets sets} static method.
 *
 * @property {function} concat
 * {@link helpers.concat concat} static method.
 */
module.exports = config => {
    const res = {
        insert: (data, columns, table) => {
            const capSQL = config.options && config.options.capSQL;
            return $npm.insert(data, columns, table, capSQL);
        },
        update: (data, columns, table, options) => {
            const capSQL = config.options && config.options.capSQL;
            return $npm.update(data, columns, table, options, capSQL);
        },
        concat: $npm.concat,
        values: $npm.values,
        sets: $npm.sets,
        TableName: $npm.TableName,
        ColumnSet: $npm.ColumnSet,
        Column: $npm.Column
    };
    Object.freeze(res);
    return res;
};
