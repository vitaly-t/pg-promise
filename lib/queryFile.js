'use strict';

var fs = require('fs');
var os = require('os');
var minify = require('pg-minify');
var format = require('./formatting').as.format;

/**
 * @constructor QueryFile
 *
 * @summary Represents an external SQL file
 *
 * @description
 *
 * Reads a file with SQL and prepares it for execution, also parses and minifies it, if required.
 *
 * The SQL can be of any complexity, with both single and multi-line comments.
 *
 * For any given SQL file you should only create a single instance of this class throughout the
 * application.
 *
 * The type is available from the library's root: `pgp.QueryFile`.
 *
 * @param {String} file
 * Name/path of the SQL file with the query. If there is any problem reading the file, it will be
 * reported when executing the query.
 *
 * @param {Object} [options]
 * A set of configuration options.
 *
 * @param {Boolean} [options.debug]
 * When in debug mode, the query file is checked for its last modification time on every query request,
 * so if it changes, the file is read afresh.
 *
 * The default for this property is `true` when `NODE_ENV` = `development`,
 * or `false` otherwise.
 *
 * @param {Boolean} [options.minify=false]
 * Parses and minifies the SQL using $[pg-minify].
 *
 * If option `compress` is set, then the default for `minify` is also `true`.
 *
 * Failure to parse SQL will result in $[SQLParsingError].
 *
 * @param {Boolean} [options.compress=false]
 * Sets option `compress` as supported by $[pg-minify], to uglify the SQL.
 *
 * This option has no meaning, if `minify` is explicitly set
 * to `false`. However, if `minify` is not specified and `compress`
 * is specified as `true`, then `minify` defaults to `true`.
 *
 * @param {Array|Object|value} [options.params]
 * Static formatting parameters to be applied to the SQL, using the same method {@link formatting.format as.format},
 * but with option `partial` = `true`.
 *
 * Most of the time query formatting is fully dynamic, and applied just before executing the query.
 * In some cases though you may need to pre-format SQL with static values. Examples of it can be a
 * schema name, or a configurable table name.
 *
 * This option makes two-step SQL formatting easy: you can pre-format the SQL initially, and then
 * apply the second-step dynamic formatting when executing the query.
 *
 * @example
 * // File sql.js
 *
 * // Proper way to organize an sql provider:
 * //
 * // - have all sql files for Users in ./sql/users
 * // - have all sql files for Products in ./sql/products
 * // - have your sql provider module as ./sql/index.js
 *
 * var QueryFile = require('pg-promise').QueryFile;
 *
 * // Helper for linking to external query files:
 * function sql(file) {
 *     var relativePath = './db/sql/';
 *     return new QueryFile(relativePath + file, {minify: true});
 * }
 *
 * var sqlProvider = {
 *     // external queries for Users:
 *     users: {
 *         add: sql('users/create.sql'),
 *         search: sql('users/search.sql'),
 *         report: sql('users/report.sql'),
 *     },
 *     // external queries for Products:
 *     products: {
 *         add: sql('products/add.sql'),
 *         quote: sql('products/quote.sql'),
 *         search: sql('products/search.sql'),
 *     }
 * };
 *
 * module.exports = sqlProvider;
 *
 * @example
 * // Testing our SQL provider
 *
 * var db = require('./db'); // our database module;
 * var sql = require('./sql').users; // our sql for users;
 *
 * module.exports = {
 *     addUser: function (name, age) {
 *         return db.none(sql.add, [name, age]);
 *     },
 *     findUser: function (name) {
 *         return db.any(sql.search, name);
 *     }
 * };
 *
 */
function QueryFile(file, options) {

    if (!(this instanceof QueryFile)) {
        return new QueryFile(file, options);
    }

    var sql, error, ready, modTime, opt = {
        debug: process.env.NODE_ENV === 'development',
        minify: false,
        compress: false
    };

    if (options && typeof options === 'object') {
        if (options.debug !== undefined) {
            opt.debug = !!options.debug;
        }
        if (options.minify !== undefined) {
            opt.minify = !!options.minify;
        }
        if (options.compress !== undefined) {
            opt.compress = !!options.compress;
        }
        if (opt.compress && options.minify === undefined) {
            opt.minify = true;
        }
        if (options.params !== undefined) {
            opt.params = options.params;
        }
    }

    Object.freeze(opt);

    /**
     * @method QueryFile.prepare
     * @summary Prepares the query for execution.
     * @description
     * If the the query hasn't been prepared yet, it will read the file
     * and process the contents according to the parameters passed into
     * the constructor.
     *
     * This method is meant primarily for internal use by the library.
     */
    this.prepare = function () {
        var lastMod;
        if (opt.debug && ready) {
            try {
                lastMod = fs.statSync(file).mtime.getTime();
                if (lastMod !== modTime) {
                    ready = false;
                }
            } catch (e) {
                sql = undefined;
                ready = false;
                error = e;
                return;
            }
        }
        if (!ready) {
            try {
                sql = fs.readFileSync(file, 'utf8');
                modTime = lastMod || fs.statSync(file).mtime.getTime();
                if (opt.minify) {
                    sql = minify(sql, {compress: opt.compress});
                }
                if (opt.params !== undefined) {
                    sql = format(sql, opt.params, {partial: true});
                }
                ready = true;
                error = undefined;
            } catch (e) {
                sql = undefined;
                error = e;
                if (e instanceof minify.SQLParsingError) {
                    e.file = file;
                    e.message += os.EOL + "File: " + file;
                }
            }
        }
    };

    /**
     * @name QueryFile#query
     * @type String
     * @default undefined
     * @readonly
     * @summary Prepared query string.
     * @description
     * When property {@link QueryFile#error error} is set, the query is `undefined`.
     *
     * This property is meant primarily for internal use by the library.
     */
    Object.defineProperty(this, 'query', {
        get: function () {
            return sql;
        }
    });

    /**
     * @name QueryFile#error
     * @type Error
     * @default undefined
     * @readonly
     * @description
     * Error, if thrown while preparing the query.
     *
     * This property is meant primarily for internal use by the library.
     */
    Object.defineProperty(this, 'error', {
        get: function () {
            return error;
        }
    });

    /**
     * @name QueryFile#file
     * @type String
     * @readonly
     * @description
     * File name that was passed into the constructor.
     *
     * This property is meant primarily for internal use by the library.
     */
    Object.defineProperty(this, 'file', {
        get: function () {
            return file;
        }
    });

    /**
     * @name QueryFile#options
     * @type Object
     * @readonly
     * @description
     * Set of options, as configured during the object's construction.
     *
     * This property is meant primarily for internal use by the library.
     */
    Object.defineProperty(this, 'options', {
        get: function () {
            return opt;
        }
    });

    this.prepare();
}

// well-formatted output when passed into console.log();
QueryFile.prototype.inspect = function () {
    return this.error || this.query;
};

module.exports = QueryFile;
