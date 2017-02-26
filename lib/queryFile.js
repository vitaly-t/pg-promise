'use strict';

var $npm = {
    fs: require('fs'),
    os: require('os'),
    path: require('path'),
    minify: require('pg-minify'),
    utils: require('./utils'),
    format: require('./formatting').as.format,
    QueryFileError: require('./errors/queryFile')
};

/**
 * @constructor QueryFile
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
 * For any given SQL file you should only create a single instance of this class throughout the application.
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
 * {@link utils}
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
 * var path = require('path');
 *
 * // Helper for linking to external query files:
 * function sql(file) {
 *     var fullPath = path.join(__dirname, file); // generating full path;
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
 * var db = require('./db'); // our database module;
 * var sql = require('./sql').users; // our sql for users;
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

    var sql, error, ready, modTime, after, filePath = file, opt = {
        debug: $npm.utils.isDev(),
        minify: false,
        compress: false
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
    }

    Object.freeze(opt);

    if ($npm.utils.isText(filePath) && !$npm.utils.isPathAbsolute(filePath)) {
        filePath = $npm.path.join($npm.utils.startDir, filePath);
    }

    // Custom Type Formatting support:
    this.formatDBType = function () {
        this.prepare(true);
        return this.query;
    };

    /**
     * @method QueryFile.prepare
     * @summary Prepares the query for execution.
     * @description
     * If the the query hasn't been prepared yet, it will read the file and process the contents according
     * to the parameters passed into the constructor.
     *
     * This method is primarily for internal use by the library.
     *
     * @param {boolean} [throwErrors=false]
     * Throw any error encountered.
     *
     */
    this.prepare = function (throwErrors) {
        var lastMod;
        if (opt.debug && ready) {
            try {
                lastMod = $npm.fs.statSync(filePath).mtime.getTime();
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
            sql = $npm.fs.readFileSync(filePath, 'utf8');
            modTime = lastMod || $npm.fs.statSync(filePath).mtime.getTime();
            if (opt.minify && !after) {
                sql = $npm.minify(sql, {compress: opt.compress});
            }
            if (opt.params !== undefined) {
                sql = $npm.format(sql, opt.params, {partial: true});
            }
            if (opt.minify && after) {
                sql = $npm.minify(sql, {compress: opt.compress});
            }
            ready = true;
            error = undefined;
        } catch (e) {
            sql = undefined;
            error = new $npm.QueryFileError(e, this);
            if (throwErrors) {
                throw error;
            }
        }
    };

    /**
     * @name QueryFile#query
     * @type {string}
     * @default undefined
     * @readonly
     * @summary Prepared query string.
     * @description
     * When property {@link QueryFile#error error} is set, the query is `undefined`.
     *
     * This property is primarily for internal use by the library.
     */
    Object.defineProperty(this, 'query', {
        get: () => sql
    });

    /**
     * @name QueryFile#error
     * @type {errors.QueryFileError}
     * @default undefined
     * @readonly
     * @description
     * When in an error state, it is set to a {@link errors.QueryFileError QueryFileError} object. Otherwise, it is `undefined`.
     *
     * This property is primarily for internal use by the library.
     */
    Object.defineProperty(this, 'error', {
        get: () => error
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
        get: () => file
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
        get: () => opt
    });

    this.prepare();
}

/**
 * @method QueryFile.toString
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
    var gap = $npm.utils.messageGap(level + 1);
    var lines = [
        'QueryFile {'
    ];
    this.prepare();
    lines.push(gap + 'file: "' + this.file + '"');
    lines.push(gap + 'options: ' + JSON.stringify(this.options));
    if (this.error) {
        lines.push(gap + 'error: ' + this.error.toString(level + 1));
    } else {
        lines.push(gap + 'query: "' + this.query + '"');
    }
    lines.push($npm.utils.messageGap(level) + '}');
    return lines.join($npm.os.EOL);
};

QueryFile.prototype.inspect = function () {
    return this.toString();
};

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
 */
