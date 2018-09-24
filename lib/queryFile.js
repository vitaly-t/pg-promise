/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

const npm = {
    fs: require('fs'),
    os: require('os'),
    path: require('path'),
    con: require('manakin').local,
    minify: require('pg-minify'),
    utils: require('./utils'),
    formatting: require('./formatting'),
    QueryFileError: require('./errors/queryFile')
};

/**
 * @class QueryFile
 * @description
 *
 * Represents an external SQL file. The type is available from the library's root: `pgp.QueryFile`.
 *
 * Reads a file with SQL and prepares it for execution, also parses and minifies it, if required.
 * The SQL can be of any complexity, with both single and multi-line comments.
 *
 * The type can be used in place of the `query` parameter, with any query method directly, plus as `text` in {@link PreparedStatement}
 * and {@link ParameterizedQuery}.
 *
 * It never throws any error, leaving it for query methods to reject with {@link errors.QueryFileError QueryFileError}.
 *
 * **IMPORTANT:** You should only create a single reusable object per file, in order to avoid repeated file reads,
 * as the IO is a very expensive resource. If you do not follow it, you will be seeing the following warning:
 * `Creating a duplicate QueryFile object for the same file`, which signals a bad-use pattern.
 *
 * @param {string} file
 * Path to the SQL file with the query, either absolute or relative to the application's entry point file.
 *
 * If there is any problem reading the file, it will be reported when executing the query.
 *
 * @param {QueryFile.Options} [options]
 * Set of configuration options, as documented by {@link QueryFile.Options}.
 *
 * @returns {QueryFile}
 *
 * @see
 * {@link errors.QueryFileError QueryFileError},
 * {@link QueryFile#toPostgres toPostgres}
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
 * const QueryFile = require('pg-promise').QueryFile;
 * const path = require('path');
 *
 * // Helper for linking to external query files:
 * function sql(file) {
 *     const fullPath = path.join(__dirname, file); // generating full path;
 *     return new QueryFile(fullPath, {minify: true});
 * }
 *
 * module.exports = {
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
 * @example
 * // Testing our SQL provider
 *
 * const db = require('./db'); // our database module;
 * const sql = require('./sql').users; // our sql for users;
 *
 * module.exports = {
 *     addUser: (name, age) => db.none(sql.add, [name, age]),
 *     findUser: name => db.any(sql.search, name)
 * };
 *
 */
function QueryFile(file, options) {

    if (!(this instanceof QueryFile)) {
        return new QueryFile(file, options);
    }

    let sql, error, ready, modTime, after, filePath = file;

    const opt = {
        debug: npm.utils.isDev(),
        minify: false,
        compress: false,
        noWarnings: false
    };

    if (options && typeof options === 'object') {
        if (options.debug !== undefined) {
            opt.debug = !!options.debug;
        }
        if (options.minify !== undefined) {
            after = options.minify === 'after';
            opt.minify = after ? 'after' : !!options.minify;
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
        if (options.noWarnings !== undefined) {
            opt.noWarnings = !!options.noWarnings;
        }
    }

    Object.freeze(opt);

    if (npm.utils.isText(filePath) && !npm.utils.isPathAbsolute(filePath)) {
        filePath = npm.path.join(npm.utils.startDir, filePath);
    }

    // istanbul ignore next:
    if (!opt.noWarnings) {
        if (filePath in usedPath) {
            usedPath[filePath]++;
            npm.con.warn('WARNING: Creating a duplicate QueryFile object for the same file - \n    %s\n%s\n', filePath, npm.utils.getLocalStack(3));
        } else {
            usedPath[filePath] = 0;
        }
    }

    this[npm.formatting.as.ctf.rawType] = true; // do not format the content when used as a formatting value

    /**
     * @method QueryFile#prepare
     * @summary Prepares the query for execution.
     * @description
     * If the query hasn't been prepared yet, it will read the file and process the content according
     * to the parameters passed into the constructor.
     *
     * This method is primarily for internal use by the library.
     *
     * @param {boolean} [throwErrors=false]
     * Throw any error encountered.
     *
     */
    this.prepare = function (throwErrors) {
        let lastMod;
        if (opt.debug && ready) {
            try {
                lastMod = npm.fs.statSync(filePath).mtime.getTime();
                if (lastMod === modTime) {
                    // istanbul ignore next;
                    // coverage for this works differently under Windows and Linux
                    return;
                }
                ready = false;
            } catch (e) {
                sql = undefined;
                ready = false;
                error = e;
                if (throwErrors) {
                    throw error;
                }
                return;
            }
        }
        if (ready) {
            return;
        }
        try {
            sql = npm.fs.readFileSync(filePath, 'utf8');
            modTime = lastMod || npm.fs.statSync(filePath).mtime.getTime();
            if (opt.minify && !after) {
                sql = npm.minify(sql, {compress: opt.compress});
            }
            if (opt.params !== undefined) {
                sql = npm.formatting.as.format(sql, opt.params, {partial: true});
            }
            if (opt.minify && after) {
                sql = npm.minify(sql, {compress: opt.compress});
            }
            ready = true;
            error = undefined;
        } catch (e) {
            sql = undefined;
            error = new npm.QueryFileError(e, this);
            if (throwErrors) {
                throw error;
            }
        }
    };

    /**
     * @name QueryFile#Symbol(QueryFile.$query)
     * @type {string}
     * @default undefined
     * @readonly
     * @private
     * @summary Prepared query string.
     * @description
     * When property {@link QueryFile#error error} is set, the query is `undefined`.
     *
     * **IMPORTANT:** This property is for internal use by the library only, never use this
     * property directly from your code.
     */
    Object.defineProperty(this, QueryFile.$query, {
        get() {
            return sql;
        }
    });

    /**
     * @name QueryFile#error
     * @type {errors.QueryFileError}
     * @default undefined
     * @readonly
     * @description
     * When in an error state, it is set to a {@link errors.QueryFileError QueryFileError} object. Otherwise, it is `undefined`.
     */
    Object.defineProperty(this, 'error', {
        get() {
            return error;
        }
    });

    /**
     * @name QueryFile#file
     * @type {string}
     * @readonly
     * @description
     * File name that was passed into the constructor.
     *
     * This property is primarily for internal use by the library.
     */
    Object.defineProperty(this, 'file', {
        get() {
            return file;
        }
    });

    /**
     * @name QueryFile#options
     * @type {QueryFile.Options}
     * @readonly
     * @description
     * Set of options, as configured during the object's construction.
     *
     * This property is primarily for internal use by the library.
     */
    Object.defineProperty(this, 'options', {
        get() {
            return opt;
        }
    });

    this.prepare();
}

// Hiding the query as a symbol within the type,
// to make it even more difficult to misuse it:
QueryFile.$query = Symbol('QueryFile.query');

const usedPath = {};

/**
 * @method QueryFile#toPostgres
 * @description
 * $[Custom Type Formatting], based on $[Symbolic CTF], i.e. the actual method is available only via {@link external:Symbol Symbol}:
 *
 * ```js
 * const ctf = pgp.as.ctf; // Custom Type Formatting symbols namespace
 * const query = qf[ctf.toPostgres]; // qf = an object of type QueryFile
 * ```
 *
 * This is a raw formatting type (`rawType = true`), i.e. when used as a query-formatting parameter, type `QueryFile` injects SQL as raw text.
 *
 * If you need to support type `QueryFile` outside of query methods, this is the only safe way to get the most current SQL.
 * And you would want to use this method dynamically, as it reloads the SQL automatically, if option `debug` is set.
 * See {@link QueryFile.Options Options}.
 *
 * @param {QueryFile} [self]
 * Optional self-reference, for ES6 arrow functions.
 *
 * @returns {string}
 * SQL string from the file, according to the {@link QueryFile.Options options} specified.
 *
 */
QueryFile.prototype[npm.formatting.as.ctf.toPostgres] = function (self) {
    self = this || self;
    self.prepare(true);
    return self[QueryFile.$query];
};

/**
 * @method QueryFile#toString
 * @description
 * Creates a well-formatted multi-line string that represents the object's current state.
 *
 * It is called automatically when writing the object into the console.
 *
 * @param {number} [level=0]
 * Nested output level, to provide visual offset.
 *
 * @returns {string}
 */
QueryFile.prototype.toString = function (level) {
    level = level > 0 ? parseInt(level) : 0;
    const gap = npm.utils.messageGap(level + 1);
    const lines = [
        'QueryFile {'
    ];
    this.prepare();
    lines.push(gap + 'file: "' + this.file + '"');
    lines.push(gap + 'options: ' + JSON.stringify(this.options));
    if (this.error) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    } else {
        lines.push(gap + 'query: "' + this[QueryFile.$query] + '"');
    }
    lines.push(npm.utils.messageGap(level) + '}');
    return lines.join(npm.os.EOL);
};

npm.utils.addInspection(QueryFile, function () {
    return this.toString();
});

module.exports = QueryFile;

/**
 * @typedef QueryFile.Options
 * @description
 * A set of configuration options as passed into the {@link QueryFile} constructor.
 *
 * @property {boolean} debug
 * When in debug mode, the query file is checked for its last modification time on every query request,
 * so if it changes, the file is read afresh.
 *
 * The default for this property is `true` when `NODE_ENV` = `development`,
 * or `false` otherwise.
 *
 * @property {boolean|string} minify=false
 * Parses and minifies the SQL using $[pg-minify]:
 * - `false` - do not use $[pg-minify]
 * - `true` - use $[pg-minify] to parse and minify SQL
 * - `'after'` - use $[pg-minify] after applying static formatting parameters
 *   (option `params`), as opposed to before it (default)
 *
 * If option `compress` is set, then the default for `minify` is `true`.
 *
 * Failure to parse SQL will result in $[SQLParsingError].
 *
 * @property {boolean} compress=false
 * Sets option `compress` as supported by $[pg-minify], to uglify the SQL:
 * - `false` - no compression to be applied, keep minimum spaces for easier read
 * - `true` - remove all unnecessary spaces from SQL
 *
 * This option has no meaning, if `minify` is explicitly set to `false`. However, if `minify` is not
 * specified and `compress` is specified as `true`, then `minify` defaults to `true`.
 *
 * @property {array|object|value} params
 *
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
 * @property {boolean} noWarnings=false
 * Suppresses all warnings produced by the class. It is not recommended for general use, only in specific tests
 * that may require it.
 *
 */
