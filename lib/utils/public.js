'use strict';

/////////////////////////////////////////
// NOTE: This file is under development!
/////////////////////////////////////////

var fs = require('fs');
var path = require('path');
var prv = require('./private');
var EOL = require('os').EOL;

/**
 * @method utils.camelize
 * @description
 * Camelizes a text string.
 *
 * @param {string} text
 *
 * @returns {string}
 */
function camelize(text) {
    text = text.replace(/[\-_\s]+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return text.substr(0, 1).toLowerCase() + text.substr(1);
}

/**
 * @method utils.camelizeVar
 * @description
 * Camelizes a text string, while making it compliant with JavaScript variable names:
 * - contains symbols `a-Z`, `A-Z`, `0-9`, `_` and `$`
 * - cannot have leading digits
 *
 * @param {string} text
 *
 * @returns {string}
 */
function camelizeVar(text) {
    text = text.replace(/[^a-zA-Z0-9\$_\-\s]/g, '').replace(/^[0-9_\-\s]+/, '');
    return camelize(text);
}

function removeExt(fileName) {
    return fileName.replace(/\.[^/.]+$/, '');
}

function isSqlFile(file) {
    return path.extname(file).toLowerCase() === '.sql';
}

// istanbul ignore next
function _enumSql(dir, options, cb, namePath) {
    var tree = {};
    fs.readdirSync(dir).forEach(function (file) {
        var stat, p = path.join(dir, file);
        try {
            stat = fs.statSync(p);
        } catch (e) {
            if (options.ignoreErrors) {
                return;
            } else {
                throw e;
            }
        }
        if (stat.isDirectory()) {
            if (options.recursive) {
                var dirName = camelizeVar(file);
                var np = namePath ? (namePath + '.' + dirName) : dirName;
                var t = _enumSql(p, options, cb, np);
                if (Object.keys(t).length) {
                    if (!dirName.length || dirName in tree) {
                        if (!options.ignoreErrors) {
                            throw new Error("Empty or duplicate camelized folder name: " + file);
                        }
                    }
                    tree[dirName] = t;
                }
            }
        } else {
            if (isSqlFile(file)) {
                var name = camelizeVar(removeExt(file));
                if (!name.length || name in tree) {
                    if (!options.ignoreErrors) {
                        throw new Error("Empty or duplicate camelized file name: " + p);
                    }
                }
                tree[name] = p;
                if (cb) {
                    // file, name, namePath
                    var result = cb(p, name, namePath ? (namePath + '.' + name) : name);
                    if (result !== undefined) {
                        tree[name] = result;
                    }
                }
            }
        }
    });
    return tree;
}

/**
 * @method utils.enumSql
 * @description
 * Synchronously enumerates all SQL files within a given directory, and into a camelized path tree, to allow named references from JavaScript.
 *
 * @param {string} dir
 *
 * @param {object} [options]
 *
 * @param {boolean} [options.recursive=false]
 *
 * @param {boolean} [options.ignoreErrors=false]
 *
 * @param {function} [cb]
 *
 * @returns {object}
 */
function enumSql(dir, options, cb) {
    if (!options || typeof options !== 'object') {
        options = {};
    }
    cb = (typeof cb === 'function') ? cb : null;
    return _enumSql(dir, options, cb, '');
}

/**
 *
 * @method utils.objectToCode
 * @description
 * Serializes a simple object into a code string as a JSON tree.
 *
 * @param {object} obj
 *
 * @param {function} [cb]
 * A callback function to override property values.
 *
 * It takes three arguments:
 *
 * - `value` - property value
 * - `name` - property name
 * - `obj` - current object (which contains the property)
 *
 * @returns {string}
 *
 * @example
 *
 * // Generating a JavaScript module with complete SQL tree
 *
 * var fs = require('fs');
 * var EOL = require('os').EOL;
 * var utils = require('pg-promise').utils;
 *
 * // generating an SQL tree from the folder:
 * var tree = utils.enumSql('./sql', {recursive: true});
 *
 * // generating the module's code:
 * var code = "var load = require('./loadSql');" + EOL + "module.exports = " +
 *         utils.objectToCode(tree, function (value) {
 *             return 'load(' + JSON.stringify(value) + ')';
 *         });
 *
 * // saving the module:
 * fs.writeFileSync('sql.js', code);
 *
 * @example
 *
 * // loadSql.js module example
 *
 * var QueryFile = require('pg-promise').QueryFile;
 *
 * module.exports = function(file) {
 *     return new QueryFile(file, {minify: true});
 * };
 */
// istanbul ignore next;
function objectToCode(obj, cb) {

    cb = (typeof cb === 'function') ? cb : null;

    return '{' + generate(obj, 1) + EOL + '}';

    function generate(obj, level) {
        var code = '', gap = prv.messageGap(level);
        var idx = 0;
        for (var prop in obj) {
            var value = obj[prop];
            if (value && typeof value === 'object') {
                if (idx) {
                    code += ',';
                }
                code += EOL + gap + prop + ': {';
                code += generate(value, level + 1);
                code += EOL + gap + '}';
            } else {
                if (idx) {
                    code += ',';
                }
                code += EOL + gap + prop + ': ';
                if (cb) {
                    code += cb(value, prop, obj);
                } else {
                    code += JSON.stringify(value);
                }
            }
            idx++;
        }
        return code;
    }
}

/**
 * @method utils.eachProp
 * @description
 * Recursively iterates through all properties of an object.
 *
 * @param {object} obj
 * The object to iterate through.
 *
 * @param {function} cb
 * A callback function that takes a single argument - an object with the following properties:
 *
 * - `value` - property value
 * - `name` - property name
 * - `obj` - current object (which contains the property)
 * - `level` - current recursion level
 * - `index` - property index in the current object
 * - `parent` - name of the parent property (when `level` > 0)
 *
 * @see {@link utils.mapProp mapProp}
 *
 */
// istanbul ignore next;
function eachProp(obj, cb) {
    if (!obj || typeof obj !== 'object') {
        throw new TypeError("Parameter 'obj' must be a non-null object.");
    }
    if (typeof cb !== 'function') {
        throw new TypeError("Parameter 'cb' must be a function.");
    }

    loop(obj, cb, 0);

    function loop(obj, cb, level, parent) {
        var index = 0;
        for (var prop in obj) {
            var val = obj[prop];
            if (val && typeof val === 'object') {
                loop(val, cb, level + 1, prop);
            } else {
                cb({value: val, name: prop, obj: obj, level: level, index: index, parent: parent});
            }
            index++;
        }
    }
}

/**
 * @method utils.mapProp
 * @description
 * Recursively iterates through all properties of an object, and creates a new object with property
 * values from the callback function.
 *
 * @param {object} obj
 * The object to iterate through.
 *
 * @param {function} cb
 * A callback function to return new property values.
 *
 * It takes a single argument - an object with the following properties:
 *
 * - `value` - original property value
 * - `name` - property name
 * - `src` - current original object
 * - `dest` - current destination object
 * - `level` - current recursion level
 * - `index` - property index in the current object
 * - `parent` - name of the parent property (when `level` > 0)
 *
 * @returns {object}
 * A new object of the same structure as the original, with values from the callback function.
 *
 * @see {@link utils.eachProp eachProp}
 */
// istanbul ignore next;
function mapProp(obj, cb) {
    if (!obj || typeof obj !== 'object') {
        throw new TypeError("Parameter 'obj' must be a non-null object.");
    }
    if (typeof cb !== 'function') {
        throw new TypeError("Parameter 'cb' must be a function.");
    }

    var res = {};

    loop(obj, res, cb, 0);

    function loop(obj, dest, cb, level, parent) {
        var index = 0;
        for (var prop in obj) {
            var val = obj[prop];
            if (val && typeof val === 'object') {
                dest[prop] = {};
                loop(val, dest[prop], cb, level + 1, prop);
            } else {
                dest[prop] = cb({
                    value: val,
                    name: prop,
                    src: obj,
                    dest: dest,
                    level: level,
                    index: index,
                    parent: parent
                });
            }
            index++;
        }
    }

    return res;
}

module.exports = {
    camelize: camelize,
    camelizeVar: camelizeVar,
    enumSql: enumSql,
    eachProp: eachProp,
    mapProp: mapProp,
    objectToCode: objectToCode
};
