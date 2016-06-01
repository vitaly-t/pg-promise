'use strict';

var pub = require('./public');
var prv = require('./private');

/**
 * @namespace utils
 *
 * @description
 * **To be added in v.4.4.0**
 *
 * Namespace for general-purpose functions, available as `pgp.utils`, before and after initializing the library.
 *
 * @property {function} camelize
 * {@link utils.camelize camelize} static method.
 *
 * @property {function} camelizeVar
 * {@link utils.camelizeVar camelizeVar} static method.
 *
 * @property {function} enumSql
 * {@link utils.enumSql enumSql} static method.
 *
 * @property {function} objectToCode
 * {@link utils.objectToCode objectToCode} static method.
 *
 * @property {function} eachProp
 * {@link utils.eachProp eachProp} static method.
 *
 * @property {function} mapProp
 * {@link utils.mapProp mapProp} static method.
 *
 */
module.exports = {

    ///////////////////////////
    // public methods:

    camelize: pub.camelize,
    camelizeVar: pub.camelizeVar,
    enumSql: pub.enumSql,
    objectToCode: pub.objectToCode,
    eachProp: pub.eachProp,
    mapProp: pub.mapProp,
    
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
