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
 * Case-changing characters include:
 * - hyphen
 * - underscore
 * - period
 * - space
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
 * If it doesn't contain any symbols to make up a valid variable name, the result will be an empty string.
 *
 * @returns {string}
 * Camelized text string that can be used as an open property name.
 *
 */
function camelizeVar(text) {
    text = text.replace(/[^a-zA-Z0-9\$_\-\s\.]/g, '').replace(/^[0-9_\-\s\.]+/, '');
    return camelize(text);
}

function _enumSql(dir, options, cb, namePath) {
    var tree = {};
    fs.readdirSync(dir).forEach(function (file) {
        var stat, p = path.join(dir, file);
        try {
            stat = fs.statSync(p);
        } catch (e) {
            // while it is very easy to test manually, it is very difficult to test for
            // access-denied errors automatically; therefore excluding from the coverage:
            // istanbul ignore next
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
 * Synchronously enumerates all SQL files (for a given directory) into an SQL tree.
 *
 * All property names within the tree are camelized via {@link utils.camelizeVar camelizeVar},
 * so they can be used in the code directly - as open property names.
 *
 * @param {string} dir
 * Directory where SQL files are located.
 *
 * @param {object} [options]
 * Search options.
 *
 * @param {boolean} [options.recursive=false]
 * Include sub-directories into the search.
 *
 * Sub-directories without SQL files will be skipped from the result.
 *
 * @param {boolean} [options.ignoreErrors=false]
 * Ignore the following types of errors:
 * - access errors, when there is no read access to a file or folder
 * - empty or duplicate camelized property names
 *
 * This flag does not affect errors related to invalid input parameters.
 *
 * @param {function} [cb]
 * A callback function that takes three arguments:
 * - `file` - full sql file name
 * - `name` - name of the property that represents the sql file
 * - `path` - property resolution path (full property name)
 *
 * If the function returns anything other than `undefined`, it overrides the corresponding property value in the tree.
 *
 * @returns {object}
 * Camelized SQL tree object, with each value being an SQL file path.
 *
 * @example
 *
 * // simple SQL tree generation for further processing:
 * var tree = pgp.utils.enumSql('../sql', {recursive: true});
 *
 * @example
 *
 * // generating an SQL tree for dynamic-names queries:
 * var sql = pgp.utils.enumSql('../sql', {recursive: true}, file=> {
 *     return new pgp.QueryFile(file, {minify: true});
 * });
 *
 * @example
 *
 * var path = require('path');
 *
 * // replacing each relative path in the tree with a full one:
 * var tree = pgp.utils.enumSql('../sql', {recursive: true}, file=> {
 *     return path.join(__dirname, file);
 * });
 *
 */
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
 * Translates an object tree into a well-formatted JSON code string.
 *
 * @param {object} obj
 * Source tree object.
 *
 * @param {function} [cb]
 * A callback function to override property values for the code.
 *
 * It takes three arguments:
 *
 * - `value` - property value
 * - `name` - property name
 * - `obj` - current object (which contains the property)
 *
 * The returned value is used as is for the property value in the generated code.
 *
 * @returns {string}
 *
 * @example
 *
 * // Generating code for a simple object
 *
 * var tree = {one: 1, two: {item: 'abc'}};
 *
 * var code = pgp.utils.objectToCode(tree);
 *
 * console.log(code);
 * //=>
 * // {
 * //     one: 1,
 * //     two: {
 * //         item: "abc"
 * //     }
 * // }
 *
 * @example
 *
 * // Generating a Node.js module with an SQL tree
 *
 * var fs = require('fs');
 * var EOL = require('os').EOL;
 *
 * // generating an SQL tree from the folder:
 * var tree = pgp.utils.enumSql('./sql', {recursive: true});
 *
 * // generating the module's code:
 * var code = "var load = require('./loadSql');" + EOL + "module.exports = " +
 *         pgp.utils.objectToCode(tree, function (value) {
 *             return 'load(' + JSON.stringify(value) + ')';
 *         });
 *
 * // saving the module:
 * fs.writeFileSync('sql.js', code);
 * // see the output example below:
 *
 * @example
 *
 * // generated code example (file sql.js)
 *
 * var load = require('./loadSql');
 *
 * module.exports = {
 *     events: {
 *         add: load("../sql/events/add.sql"),
 *         delete: load("../sql/events/delete.sql"),
 *         find: load("../sql/events/find.sql"),
 *         update: load("../sql/events/update.sql")
 *     },
 *     products: {
 *         add: load("../sql/products/add.sql"),
 *         delete: load("../sql/products/delete.sql"),
 *         find: load("../sql/products/find.sql"),
 *         update: load("../sql/products/update.sql")
 *     },
 *     users: {
 *         add: load("../sql/users/add.sql"),
 *         delete: load("../sql/users/delete.sql"),
 *         find: load("../sql/users/find.sql"),
 *         update: load("../sql/users/update.sql")
 *     },
 *     create: load("../sql/create.sql"),
 *     init: load("../sql/init.sql"),
 *     drop: load("../sql/drop.sql")
 *};
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
 *
 */
function objectToCode(obj, cb) {

    if (!obj || typeof obj !== 'object') {
        throw new TypeError("Parameter 'obj' must be a non-null object.");
    }

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
