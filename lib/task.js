'use strict';

var $npm = {
    utils: require('./utils'),
    mode: require('./txMode'),
    events: require('./events')
};

var $p; // promise interface;

/**
 * @constructor Task
 * @extends Database
 * @description
 * Extends {@link Database} for an automatic connection session, with methods for executing
 * multiple database queries. The type isn't available directly, it can only be created via
 * methods {@link Database.task} and {@link Database.tx}.
 *
 * All query methods of this library automatically manage their database connection:
 * 1. allocate a new connection from the connection pool
 * 2. execute the query
 * 3. release the connection back to the pool
 *
 * When executing more than one request at a time, such approach is no longer prudent.
 * One should allocate and release the connection only once, while executing all the
 * required queries within the same connection session. More importantly, a transaction
 * can only work within a single connection.
 *
 * This class provides an interface for tasks and transactions to implement a connection
 * session, during which you can execute multiple queries against the same connection.
 *
 * @example
 * db.task(function (t) {
 *       // this = t = task protocol context;
 *       // this.ctx = task config + state context;
 *       return t.one("select * from users where id=$1", 123)
 *           .then(function (user) {
 *               return t.any("select * from events where login=$1", user.name);
 *           });
 *   })
 * .then(function (events) {
 *       // success;
 *   })
 * .catch(function (error) {
 *       // error;
 *   });
 *
 */
function Task(ctx, tag, isTX) {

    /**
     * @member {Object} Task.ctx
     * @summary Task Context Object
     *
     * @property {Object} [context]
     * If the operation was invoked with an object context - `task.call(obj,...)` or
     * `tx.call(obj,...)`, this property is set with the context object that was passed in.
     *
     * @property {Boolean} isTX
     * Indicates whether this task represents a transaction.
     *
     * @property {} [tag]
     * Tag value as it was passed into the task.
     *
     * @see event {@link event:query query}
     */
    this.ctx = ctx.ctx = {}; // task context object;

    $npm.utils.addReadProp(this.ctx, 'isTX', isTX);

    if ('context' in ctx) {
        $npm.utils.addReadProp(this.ctx, 'context', ctx.context);
    }

    if (tag !== undefined) {
        $npm.utils.addReadProp(this.ctx, 'tag', tag);
    }

    // generic query method;
    this.query = function (query, values, qrm) {
        if (!ctx.db) {
            throw new Error("Unexpected call outside of " + (isTX ? "transaction." : "task."));
        }
        return $npm.query.call(this, ctx, query, values, qrm);
    };

    /**
     * @method Task.batch
     * @summary Resolves a predefined array of mixed values by redirecting to method $[spex.batch].
     * @description
     * For complete method documentation see $[spex.batch].
     * @param {Array} values
     * @param {Function} [cb]
     * @returns {external:Promise}
     */
    this.batch = function (values, cb) {
        return $npm.spex.batch.call(this, values, cb);
    };

    /**
     * @method Task.page
     * @summary Resolves a dynamic sequence of arrays/pages with mixed values, by redirecting to method $[spex.page].
     * @description
     * For complete method documentation see $[spex.page].
     * @param {Function} source
     * @param {Function} [dest]
     * @param {Number} [limit=0]
     * @returns {external:Promise}
     */
    this.page = function (source, dest, limit) {
        return $npm.spex.page.call(this, source, dest, limit);
    };

    /**
     * @method Task.sequence
     * @summary Resolves a dynamic sequence of mixed values by redirecting to method $[spex.sequence].
     * @description
     * For complete method documentation see $[spex.sequence].
     * @param {Function} source
     * @param {Function} [dest]
     * @param {Number} [limit=0]
     * @param {Boolean} [track=false]
     * @returns {external:Promise}
     */
    this.sequence = function (source, dest, limit, track) {
        return $npm.spex.sequence.call(this, source, dest, limit, track);
    };

}

//////////////////////////
// Executes a task;
Task.exec = function (ctx, obj, isTX) {

    // callback invocation helper;
    function callback() {
        var result, cb = ctx.cb;
        if (cb.constructor.name === 'GeneratorFunction') {
            cb = $npm.async(cb);
        }
        try {
            result = cb.call(obj, obj); // invoking the callback function;
        } catch (err) {
            $npm.events.error(ctx.options, err, {
                client: ctx.db.client,
                ctx: ctx.ctx
            });
            return $p.reject(err); // reject with the error;
        }
        if (result && result.then instanceof Function) {
            return result; // result is a valid promise object;
        }
        return $p.resolve(result);
    }

    // updates the task context and notifies the client;
    function update(start, success, result) {
        var c = ctx.ctx;
        if (start) {
            $npm.utils.addReadProp(c, 'start', new Date());
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
            $npm.utils.lock(c, true);
        }
        (isTX ? $npm.events.transact : $npm.events.task)(ctx.options, {
            client: ctx.db.client,
            ctx: c
        });
    }

    var cbData, cbReason, success,
        spName, // Save-Point Name;
        capTX = ctx.options && ctx.options.capTX; // capitalize transaction commands;

    update(true);

    if (isTX) {
        // executing a transaction;
        spName = "level_" + ctx.txLevel;
        return begin()
            .then(function () {
                    return callback()
                        .then(function (data) {
                            cbData = data; // save callback data;
                            success = true;
                            return commit();
                        }, function (reason) {
                            cbReason = reason; // save callback failure reason;
                            return rollback();
                        })
                        .then(function () {
                                if (success) {
                                    update(false, true, cbData);
                                    return cbData;
                                } else {
                                    update(false, false, cbReason);
                                    return $p.reject(cbReason);
                                }
                            },
                            // istanbul ignore next: either `commit` or `rollback` has failed, which is
                            // impossible to replicate in a test environment, so skipping from the test;
                            function (reason) {
                                update(false, false, reason);
                                return $p.reject(reason);
                            });
                },
                // istanbul ignore next: `begin` has failed, which is impossible
                // to replicate in a test environment, so skipping from the test;
                function (reason) {
                    update(false, false, reason);
                    return $p.reject(reason);
                });
    }

    function begin() {
        if (!ctx.txLevel && ctx.cb.txMode instanceof $npm.mode.TransactionMode) {
            return exec(ctx.cb.txMode.begin(capTX), 'savepoint');
        }
        return exec('begin', 'savepoint');
    }

    function commit() {
        return exec('commit', 'release savepoint');
    }

    function rollback() {
        return exec('rollback', 'rollback to savepoint');
    }

    function exec(top, nested) {
        if (ctx.txLevel) {
            return obj.none((capTX ? nested.toUpperCase() : nested) + ' ' + spName);
        }
        return obj.none(capTX ? top.toUpperCase() : top);
    }

    // executing a task;
    return callback()
        .then(function (data) {
            update(false, true, data);
            return data;
        })
        .catch(function (error) {
            update(false, false, error);
            return $p.reject(error);
        });

};

module.exports = function (p) {
    $p = p;
    $npm.query = require('./query')(p);
    $npm.async = require('./async')(p);
    $npm.spex = require('spex')(require('./promise').promiseLib);
    return Task;
};
