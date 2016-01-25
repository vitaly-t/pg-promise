'use strict';

var $npm = {
    context: require('./dbContext')
};

var $p;

/**
 * @constructor Database
 * @param {String|Object} cn
 * Connection object or string
 */
function Database(cn, options) {
    /**
     * @method pg-promise.Database.connect
     * @summary Retrieves a new or existing connection from the pool, based on the
     * current connection parameters.
     * @description
     * This method initiates a shared connection for executing a chain of queries
     * on the same connection. The connection must be released in the end of the
     * chain by calling method `done()` of the connection object.
     * This is a legacy, low-level approach to chaining queries on the same connection.
     * A newer and simpler approach is via method {@link module:pg-promise.Database#task task},
     * which allocates and releases the shared connection automatically.
     * @returns {external:Promise} Connection result:
     * <ul>
     * <li>resolves with the connection object, if successful. The object has method `done()` that must
     *   be called in the end of the query chain, in order to release the connection back to the pool.</li>
     * <li>rejects with the connection error when fails.</li>
     * </ul>
     * @see {@link module:pg-promise.Database#task task}
     */
    this.connect = function () {
        var ctx = createContext();
        var self = {
            // Generic query method;
            query: function (query, values, qrm) {
                if (!ctx.db) {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
                return $npm.query.call(this, ctx, query, values, qrm);
            },
            // Connection release method;
            done: function () {
                if (!ctx.db) {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
                ctx.disconnect();
            }
        };
        $npm.extend(ctx, self); // extending the protocol;
        return $npm.connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return self;
            });
    };

    /**
     * @method Database.query
     * @summary Executes a generic query that expects return data according to parameter `qrm`
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * - function object
     * - stream object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @param {queryResult} [qrm=queryResult.any] - {@link queryResult Query Result Mask}
     * @returns {external:Promise} A promise object that represents the query result.
     */
    this.query = function (query, values, qrm) {
        var self = this, ctx = createContext();
        return $npm.connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return $npm.query.call(self, ctx, query, values, qrm);
            })
            .then(function (data) {
                ctx.disconnect();
                return data;
            })
            .catch(function (error) {
                ctx.disconnect();
                return $p.reject(error);
            });
    };

    $npm.extend(createContext(), this); // extending root protocol;

    function createContext() {
        return new $npm.context(cn, options);
    }
}

module.exports = function (p) {
    $p = p;
    $npm.connect = require('./connect')(p);
    $npm.extend = require('./extend')(p);
    $npm.query = require('./query')(p);
    return Database;
};
