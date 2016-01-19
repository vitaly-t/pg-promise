'use strict';

var fs = require('fs');
var utils = require('./utils');

/**
 * @constructor QueryFile
 * @summary SQL query file provider.
 * @description
 *
 * Reads a file with SQL and prepares it for execution, also parses and
 * minifies it, if required.
 *
 * The SQL can be of any complexity, with both single and multi-line comments.
 *
 * If the file contains more than one query, you will not be able to get the
 * individual results, because the library doesn't support results from multiple
 * queries.
 *
 * The type is available from the library's root: `pgp.QueryFile`.
 *
 * @param {String} file
 * Name/path of the SQL file with the query. If there is any problem reading
 * the file, it will be reported when executing the query.
 *
 * @param {Object} [options]
 * A set of configuration options.
 *
 * @param {Boolean} [options.debug]
 * When in debug mode, the query file is checked for its last modification
 * time on every query request, so if it changes, the file is read afresh.
 *
 * The default for this property is `true` when `NODE_ENV` = `development`,
 * or `false` otherwise.
 *
 * @param {Boolean} [options.minify=false]
 * Parses and minifies the SQL:
 * 1. Removes all comments
 * 2. Normalizes multi-line strings
 * 3. Removes trailing empty symbols
 * 4. Flattens SQL into a single line
 *
 * Failure to parse SQL will result in {@link errors.SQLParsingError SQLParseError}.
 */
function QueryFile(file, options) {

    if (!(this instanceof QueryFile)) {
        return new QueryFile(file, options);
    }

    var sql, error, ready, modTime, opt = {
        debug: process.env.NODE_ENV === 'development',
        minify: false
    };

    if (options && typeof options === 'object') {
        if (options.debug !== undefined) {
            opt.debug = !!options.debug;
        }
        if (options.minify !== undefined) {
            opt.minify = !!options.minify;
        }
    }

    Object.freeze(opt);

    /**
     * @method QueryFile.prepare
     * @summary Prepares the query for execution.
     * @description
     * If the the query hasn't been prepared yet, it will read the file
     * and process the contents according the parameters passed into the
     * constructor.
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
                    sql = utils.minifySQL(sql, file);
                }
                ready = true;
                error = undefined;
            } catch (e) {
                sql = undefined;
                error = e;
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
     * @summary Error, if thrown while preparing the query.
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
     * @summary File name/path passed into the constructor.
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
     * @summary Set of options, as configured during the object's construction.
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
