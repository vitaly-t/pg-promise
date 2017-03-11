'use strict';

var $npm = {
    fs: require('fs'),
    path: require('path'),
    utils: require('./'),
    package: require('../../package.json')
};

var EOL = require('os').EOL;

/**
 * @method utils.camelize
 * @description
 * Camelizes a text string.
 *
 * Case-changing characters include:
 * - _hyphen_
 * - _underscore_
 * - _period_
 * - _space_
 *
 * @param {string} text
 * Input text string.
 *
 * @returns {string}
 * Camelized text string.
 *
 * @see
 * {@link utils.camelizeVar camelizeVar}
 *
 */
function camelize(text) {
    text = text.replace(/[\-_\s\.]+(.)?/g, (match, chr) => {
        return chr ? chr.toUpperCase() : '';
    });
    return text.substr(0, 1).toLowerCase() + text.substr(1);
}

/**
 * @method utils.camelizeVar
 * @description
 * Camelizes a text string, while making it compliant with JavaScript variable names:
 * - contains symbols `a-z`, `A-Z`, `0-9`, `_` and `$`
 * - cannot have leading digits
 *
 * First, it removes all symbols that do not meet the above criteria, except for _hyphen_, _period_ and _space_,
 * and then it forwards into {@link utils.camelize camelize}.
 *
 * @param {string} text
 * Input text string.
 *
 * If it doesn't contain any symbols to make up a valid variable name, the result will be an empty string.
 *
 * @returns {string}
 * Camelized text string that can be used as an open property name.
 *
 * @see
 * {@link utils.camelize camelize}
 *
 */
function camelizeVar(text) {
    text = text.replace(/[^a-zA-Z0-9\$_\-\s\.]/g, '').replace(/^[0-9_\-\s\.]+/, '');
    return camelize(text);
}

function _enumSql(dir, options, cb, namePath) {
    var tree = {};
    $npm.fs.readdirSync(dir).forEach(file => {
        var stat, fullPath = $npm.path.join(dir, file);
        try {
            stat = $npm.fs.statSync(fullPath);
        } catch (e) {
            // while it is very easy to test manually, it is very difficult to test for
            // access-denied errors automatically; therefore excluding from the coverage:
            // istanbul ignore next
            if (options.ignoreErrors) {
                return; // on to the next file/folder;
            }
            // istanbul ignore next
            throw e;
        }
        if (stat.isDirectory()) {
            if (options.recursive) {
                var dirName = camelizeVar(file);
                var np = namePath ? (namePath + '.' + dirName) : dirName;
                var t = _enumSql(fullPath, options, cb, np);
                if (Object.keys(t).length) {
                    if (!dirName.length || dirName in tree) {
                        if (!options.ignoreErrors) {
                            throw new Error('Empty or duplicate camelized folder name: ' + fullPath);
                        }
                    }
                    tree[dirName] = t;
                }
            }
        } else {
            if ($npm.path.extname(file).toLowerCase() === '.sql') {
                var name = camelizeVar(file.replace(/\.[^/.]+$/, ''));
                if (!name.length || name in tree) {
                    if (!options.ignoreErrors) {
                        throw new Error('Empty or duplicate camelized file name: ' + fullPath);
                    }
                }
                tree[name] = fullPath;
                if (cb) {
                    var result = cb(fullPath, name, namePath ? (namePath + '.' + name) : name);
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
 * Synchronously enumerates all SQL files (within a given directory) into a camelized SQL tree.
 *
 * All property names within the tree are camelized via {@link utils.camelizeVar camelizeVar},
 * so they can be used in the code directly, as open property names.
 *
 * @param {string} dir
 * Directory path where SQL files are located, either absolute or relative to the current directory.
 *
 * SQL files are identified by using `.sql` extension (case-insensitive).
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
 * This flag does not affect errors related to invalid input parameters, or if you pass in a
 * non-existing directory.
 *
 * @param {function} [cb]
 * A callback function that takes three arguments:
 * - `file` - SQL file path, relative or absolute, according to how you specified the search directory
 * - `name` - name of the property that represents the SQL file
 * - `path` - property resolution path (full property name)
 *
 * If the function returns anything other than `undefined`, it overrides the corresponding property value in the tree.
 *
 * @returns {object}
 * Camelized SQL tree object, with each value being an SQL file path (unless changed via the callback).
 *
 * @see
 * {@link utils.objectToCode objectToCode},
 * {@link utils.buildSqlModule buildSqlModule}
 *
 * @example
 *
 * // simple SQL tree generation for further processing:
 * var tree = pgp.utils.enumSql('../sql', {recursive: true});
 *
 * @example
 *
 * // generating an SQL tree for dynamic use of names:
 * var sql = pgp.utils.enumSql(__dirname, {recursive: true}, file=> {
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
    if (!$npm.utils.isText(dir)) {
        throw new TypeError('Parameter \'dir\' must be a non-empty text string.');
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
 * @see
 * {@link utils.enumSql enumSql},
 * {@link utils.buildSqlModule buildSqlModule}
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
 * var code = "var load = require('./loadSql');" + EOL + EOL + "module.exports = " +
 *         pgp.utils.objectToCode(tree, value => {
 *             return 'load(' + JSON.stringify(value) + ')';
 *         }) + ';';
 *
 * // saving the module:
 * fs.writeFileSync('sql.js', code);
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
 * module.exports = file => {
 *     return new QueryFile(file, {minify: true});
 * };
 *
 */
function objectToCode(obj, cb) {

    if (!obj || typeof obj !== 'object') {
        throw new TypeError('Parameter \'obj\' must be a non-null object.');
    }

    cb = (typeof cb === 'function') ? cb : null;

    return '{' + generate(obj, 1) + EOL + '}';

    function generate(obj, level) {
        var code = '', gap = $npm.utils.messageGap(level);
        var idx = 0;
        for (var prop in obj) {
            var value = obj[prop];
            if (idx) {
                code += ',';
            }
            if (value && typeof value === 'object') {
                code += EOL + gap + prop + ': {';
                code += generate(value, level + 1);
                code += EOL + gap + '}';
            } else {
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
 * @method utils.buildSqlModule
 * @description
 * Synchronously generates a Node.js module with a camelized SQL tree, based on a configuration object that has the format shown below.
 *
 * This method is normally to be used on a grunt/gulp watch that triggers when the file structure changes in your SQL directory,
 * although it can be invoked manually as well.
 *
 * ```js
 * {
 *    // Required Properties:
 *    
 *    "dir" // {string}: relative or absolute directory where SQL files are located (see API for method enumSql, parameter `dir`)
 *
 *    // Optional Properties:
 *    
 *    "recursive" // {boolean}: search for sql files recursively (see API for method enumSql, option `recursive`)
 *
 *    "ignoreErrors" // {boolean}: ignore common errors (see API for method enumSql, option `ignoreErrors`)
 *
 *    "output" // {string}: relative or absolute destination file path; when not specified, no file is created,
 *             // but you still can use the code string that's always returned by the method.
 *     
 *    "module": {
 *        "path" // {string}: relative path to a module exporting a function which takes a file path
 *               // and returns a proper value (typically, a new QueryFile object); by default, it uses `./loadSql`.
 *
 *        "name" // {string}: local variable name for the SQL-loading module; by default, it uses `load`.
 *    }
 * }
 * ```
 *
 * @param {object|string} [config]
 * Configuration parameter for generating the code.
 *
 * - When it is a non-null object, it is assumed to be a configuration object (see the format above).
 * - When it is a text string - it is the relative path to either a JSON file that contains the configuration object,
 *   or a Node.js module that exports one. The path is relative to the application's entry point file.
 * - When `config` isn't specified, the method will try to locate the default `sql-config.json` file in the directory of your
 *   application's entry point file, and if not found - throw {@link external:Error Error} = `Default SQL configuration file not found`.
 *
 * @returns {string}
 * Generated code.
 *
 * @see
 * {@link utils.enumSql enumSql},
 * {@link utils.objectToCode objectToCode}
 *
 * @example
 *
 * // generate SQL module automatically, from sql-config.json in the module's start-up folder:
 *
 * pgp.utils.buildSqlModule();
 *
 * // see generated file below:
 *
 * @example
 *
 * /////////////////////////////////////////////////////////////////////////
 * // This file was automatically generated by pg-promise v.4.3.8
 * //
 * // Generated on: 6/2/2016, at 2:15:23 PM
 * // Total files: 15
 * //
 * // API: http://vitaly-t.github.io/pg-promise/utils.html#.buildSqlModule
 * /////////////////////////////////////////////////////////////////////////
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
 */
function buildSqlModule(config) {

    if ($npm.utils.isText(config)) {
        var path = $npm.utils.isPathAbsolute(config) ? config : $npm.path.join($npm.utils.startDir, config);
        config = require(path);
    } else {
        if ($npm.utils.isNull(config)) {
            var defConfig = $npm.path.join($npm.utils.startDir, 'sql-config.json');
            // istanbul ignore else;
            if (!$npm.fs.existsSync(defConfig)) {
                throw new Error('Default SQL configuration file not found: ' + defConfig);
            }
            // cannot test this automatically, because it requires that file 'sql-config.json'
            // resides within the Jasmine folder, since it is the client during the test.
            // istanbul ignore next;
            config = require(defConfig);
        } else {
            if (!config || typeof config !== 'object') {
                throw new TypeError('Invalid parameter \'config\' specified.');
            }
        }
    }

    if (!$npm.utils.isText(config.dir)) {
        throw new Error('Property \'dir\' must be a non-empty string.');
    }

    var total = 0;

    var tree = enumSql(config.dir, {recursive: config.recursive, ignoreErrors: config.ignoreErrors}, () => {
        total++;
    });

    var modulePath = './loadSql', moduleName = 'load';
    if (config.module && typeof config.module === 'object') {
        if ($npm.utils.isText(config.module.path)) {
            modulePath = config.module.path;
        }
        if ($npm.utils.isText(config.module.name)) {
            moduleName = config.module.name;
        }
    }

    var d = new Date();

    var header =
        '/////////////////////////////////////////////////////////////////////////' + EOL +
        '// This file was automatically generated by pg-promise v.' + $npm.package.version + EOL +
        '//' + EOL +
        '// Generated on: ' + d.toLocaleDateString() + ', at ' + d.toLocaleTimeString() + EOL +
        '// Total files: ' + total + EOL +
        '//' + EOL +
        '// API: http://vitaly-t.github.io/pg-promise/utils.html#.buildSqlModule' + EOL +
        '/////////////////////////////////////////////////////////////////////////' + EOL + EOL +
        '\'use strict\';' + EOL + EOL +
        'var ' + moduleName + ' = require(\'' + modulePath + '\');' + EOL + EOL +
        'module.exports = ';

    var code = header + objectToCode(tree, value => {
            return moduleName + '(' + JSON.stringify(value) + ')';
        }) + ';';

    if ($npm.utils.isText(config.output)) {
        var p = config.output;
        if (!$npm.utils.isPathAbsolute(p)) {
            p = $npm.path.join($npm.utils.startDir, p);
        }
        $npm.fs.writeFileSync(p, code);
    }

    return code;
}


/**
 * @namespace utils
 *
 * @description
 * Namespace for general-purpose static functions, available as `pgp.utils`, before and after initializing the library.
 *
 * Its main purpose is to simplify developing projects with either large or dynamic number of SQL files.
 *
 * See also:
 * - [Automatic SQL Trees](https://github.com/vitaly-t/pg-promise/issues/153)
 * - [SQL Files](https://github.com/vitaly-t/pg-promise/wiki/SQL-Files)
 *
 * @property {function} camelize
 * {@link utils.camelize camelize} - camelizes a text string
 *
 * @property {function} camelizeVar
 * {@link utils.camelizeVar camelizeVar} - camelizes a text string as a variable
 *
 * @property {function} enumSql
 * {@link utils.enumSql enumSql} - enumerates SQL files in a directory
 *
 * @property {function} objectToCode
 * {@link utils.objectToCode objectToCode} - generates code from an object
 *
 * @property {function} buildSqlModule
 * {@link utils.buildSqlModule buildSqlModule} - generates a complete Node.js module
 *
 */
module.exports = {
    camelize: camelize,
    camelizeVar: camelizeVar,
    enumSql: enumSql,
    objectToCode: objectToCode,
    buildSqlModule: buildSqlModule
};

Object.freeze(module.exports);
