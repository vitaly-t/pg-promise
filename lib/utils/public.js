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
 * Enumerates all SQL files within a given directory, and into a camelized path tree, to allow named references from JavaScript.
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
            var val = obj[prop];
            if (val && typeof val === 'object') {
                if (idx) {
                    code += ',';
                }
                code += EOL + gap + prop + ': {';
                code += generate(val, level + 1);
                code += EOL + gap + '}';
            } else {
                if (idx) {
                    code += ',';
                }
                code += EOL + gap + prop + ': ';
                if (cb) {
                    code += cb(val);
                } else {
                    code += JSON.stringify(val);
                }
            }
            idx++;
        }
        return code;
    }
}

// istanbul ignore next;
function forEachProp(obj, cb) {
    for (var prop in obj) {
        var val = obj[prop];
        if (val && typeof val === 'object') {
            forEachProp(val, cb);
        } else {
            cb(val);
        }
    }
}

module.exports = {
    camelize: camelize,
    camelizeVar: camelizeVar,
    enumSql: enumSql,
    objectToCode: objectToCode
};
