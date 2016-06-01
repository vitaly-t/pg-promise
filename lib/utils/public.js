'use strict';

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
 * Input text string.
 *
 * @returns {string}
 * Camelized text string.
 *
 */
function camelize(text) {
    text = text.replace(/[\-_\s\.]+(.)?/g, function (match, chr) {
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
 * Input text string.
 *
 * If it doesn't contain any symbols to make up a variable name the result will be an empty string.
 *
 * @returns {string}
 * Camelized text string that can be used as an open property name.
 *
 */
function camelizeVar(text) {
    text = text.replace(/[^a-zA-Z0-9\$_\-\s]/g, '').replace(/^[0-9_\-\s]+/, '');
    return camelize(text);
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
                            throw new Error("Empty or duplicate camelized folder name: " + p);
                        }
                    }
                    tree[dirName] = t;
                }
            }
        } else {
            if (path.extname(file).toLowerCase() === '.sql') {
                var name = camelizeVar(file.replace(/\.[^/.]+$/, ''));
                if (!name.length || name in tree) {
                    if (!options.ignoreErrors) {
                        throw new Error("Empty or duplicate camelized file name: " + p);
                    }
                }
                tree[name] = p;
                if (cb) {
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
 * Synchronously enumerates all SQL files (within a given directory) into a camelized SQL tree, to allow named references from JavaScript.
 *
 * @param {string} dir
 * Directory name where SQL files are located.
 *
 * @param {object} [options]
 * Search options.
 *
 * @param {boolean} [options.recursive=false]
 * Search for sql files in sub-directories.
 *
 * Sub-directories that do not contain a single SQL file (on any level) are skipped.
 *
 * @param {boolean} [options.ignoreErrors=false]
 * Ignore the following type of errors:
 * - access errors, when there is no read access to a file or folder
 * - empty or duplicate camelized property names
 *
 * This flag does not affect errors related to invalid input parameters.
 *
 * @param {function} [cb]
 * A callback function that takes three arguments:
 * - `file` - full sql file name
 * - `propName` - name of the property that represents the sql file
 * - `propPath` - property resolution path (full property name)
 *
 * If the function returns anything other than `undefined`, it overrides the corresponding property value in the tree. 
 *
 * @returns {object}
 * Camelized SQL tree object.
 *
 * @example
 *
 * var pgp = require('pg-promise');
 *
 * // generating an SQL tree for dynamic access:
 * var sql = pgp.utils.enumSql('../sql', {recursive: true}, file=> {
 *     return new pgp.QueryFile(file, {minify: true});
 * });
 *
 */
// istanbul ignore next
function enumSql(dir, options, cb) {
    if (!dir || typeof dir !== 'string') {
        throw new TypeError("Parameter 'dir' must be a non-empty text string.");
    }
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
 * Object to be serialized.
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

module.exports = {
    camelize: camelize,
    camelizeVar: camelizeVar,
    enumSql: enumSql,
    objectToCode: objectToCode
};
