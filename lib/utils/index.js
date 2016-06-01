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
 */
module.exports = {

    ///////////////////////////
    // public methods:

    camelize: pub.camelize,
    camelizeVar: pub.camelizeVar,
    enumSql: pub.enumSql,
    objectToCode: pub.objectToCode,

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
