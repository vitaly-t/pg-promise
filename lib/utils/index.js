'use strict';

var pub = require('./public');
var prv = require('./private');

/**
 * @namespace utils
 *
 * @description
 * **Added in v.4.3.6**
 *
 * Namespace for general-purpose static functions, available as `pgp.utils`, before and after initializing the library.
 *
 * Its main purpose however is to simplify developing projects with large number of SQL files
 * (see [Automatic SQL Trees](https://github.com/vitaly-t/pg-promise/issues/153)).
 *
 * @property {function} camelize
 * {@link utils.camelize camelize} - camelizes a text string.
 *
 * @property {function} camelizeVar
 * {@link utils.camelizeVar camelizeVar} - camelizes a text string as a variable.
 *
 * @property {function} enumSql
 * {@link utils.enumSql enumSql} - enumerates SQL files in a directory.
 *
 * @property {function} objectToCode
 * {@link utils.objectToCode objectToCode} - generates code from an object.
 *
 */
module.exports = {

    ///////////////////////////
    // public methods:

    camelize: pub.camelize,
    camelizeVar: pub.camelizeVar,
    objectToCode: pub.objectToCode,
    enumSql: pub.enumSql,

    ///////////////////////////
    // private methods:

    lock: prv.lock,
    isText: prv.isText,
    isNull: prv.isNull,
    isObject: prv.isObject,
    addReadProp: prv.addReadProp,
    addReadProperties: prv.addReadProperties,
    getSafeConnection: prv.getSafeConnection,
    InternalError: prv.InternalError,
    messageGap: prv.messageGap,
    inherits: prv.inherits

};
