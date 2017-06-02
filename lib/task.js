'use strict';

var $npm = {
    spex: require('spex'),
    utils: require('./utils'),
    mode: require('./txMode'),
    events: require('./events'),
    query: require('./query'),
    async: require('./async')
};

/**
 * @interface Task
 * @extends Database
 * @description
 * Extends {@link Database} for an automatic connection session, with methods for executing multiple database queries.
 * The type isn't available directly, it can only be created via methods {@link Database.task} and {@link Database.tx}.
 *
 * When executing more than one request at a time, one should allocate and release the connection only once,
 * while executing all the required queries within the same connection session. More importantly, a transaction
 * can only work within a single connection.
 *
 * This is an interface for tasks/transactions to implement a connection session, during which you can
 * execute multiple queries against the same connection that's released automatically when the task/transaction is finished.
 *
 * @see
 * {@link Task.ctx ctx},
 * {@link Task.batch batch},
 * {@link Task.sequence sequence},
 * {@link Task.page page}
 *
 * @example
 * db.task(t => {
 *       // t = task protocol context;
 *       // t.ctx = task config + state context;
 *       return t.one("select * from users where id=$1", 123)
 *           .then(user => {
 *               return t.any("select * from events where login=$1", user.name);
 *           });
 *   })
 * .then(events => {
 *       // success;
 *   })
 * .catch(error => {
 *       // error;
 *   });
 *
 */
function Task(ctx, tag, isTX, config) {

    /**
     * @member {object} Task.ctx
     * @description
     * Task/Transaction Context object - contains individual properties for each task/transaction.
     *
     * ```js
     * db.task(t => {
     *    // t.ctx = task context object
     * });
     * ```
     *
     * ```js
     * db.tx(t => {
     *    // t.ctx = transaction context object
     * });
     * ```
     *
     * Properties `context`, `dc`, `isTX`, `tag`, `start` and `isFresh` are set before the callback,
     * while properties `finish`, `success` and `result` are set after the callback has returned.
     *
     * @property {object} context
     * If the operation was invoked with an object context - `task.call(obj,...)` or
     * `tx.call(obj,...)`, this property is set with the context object that was passed in.
     *
     * @property {} dc
     * _Database Context_ that was used when creating the database object. See {@link Database}.
     *
     * @property {boolean} isTX
     * Indicates whether this task represents a transaction.
     *
     * @property {} tag
     * Tag value as it was passed into the task. See methods {@link Database.task task} and {@link Database.tx tx}.
     *
     * @property {date} start
     * Date/Time of when this task or transaction started the execution.
     *
     * @property {boolean} isFresh
     * Indicates when a fresh physical connection is being used.
     *
     * @property {date} finish
     * Once the operation has finished, this property is set to the Data/Time of when it happened.
     *
     * @property {boolean} success
     * Once the operation has finished, this property indicates whether it was successful.
     *
     * @property {} result
     * Once the operation has finished, this property contains the result, depending on property `success`:
     * - data resolved by the operation, if `success` = `true`
     * - error / rejection reason, if `success` = `false`
     *
     * @see event {@link event:query query}
     */
    this.ctx = ctx.ctx = {}; // task context object;

    $npm.utils.addReadProp(this.ctx, 'isTX', isTX);

    if ('context' in ctx) {
        $npm.utils.addReadProp(this.ctx, 'context', ctx.context);
    }

    $npm.utils.addReadProp(this.ctx, 'tag', tag);
    $npm.utils.addReadProp(this.ctx, 'dc', ctx.dc);

    // generic query method;
    this.query = function (query, values, qrm) {
        if (!ctx.db) {
            throw new Error('Unexpected call outside of ' + (isTX ? 'transaction.' : 'task.'));
        }
        return config.$npm.query.call(this, ctx, query, values, qrm);
    };

    /**
     * @method Task.batch
     * @description
     * **Alternative Syntax:** `batch(values, {cb})` &#8658; `Promise`
     *
     * Settles a predefined array of mixed values by redirecting to method $[spex.batch].
     *
     * For complete method documentation see $[spex.batch].
     * @param {array} values
     * @param {function} [cb]
     * @returns {external:Promise}
     */
    this.batch = function (values, cb) {
        return config.$npm.spex.batch.call(this, values, cb);
    };

    /**
     * @method Task.page
     * @description
     * **Alternative Syntax:** `page(source, {dest, limit})` &#8658; `Promise`
     *
     * Resolves a dynamic sequence of arrays/pages with mixed values, by redirecting to method $[spex.page].
     *
     * For complete method documentation see $[spex.page].
     * @param {function} source
     * @param {function} [dest]
     * @param {number} [limit=0]
     * @returns {external:Promise}
     */
    this.page = function (source, dest, limit) {
        return config.$npm.spex.page.call(this, source, dest, limit);
    };

    /**
     * @method Task.sequence
     * @description
     * **Alternative Syntax:** `sequence(source, {dest, limit, track})` &#8658; `Promise`
     *
     * Resolves a dynamic sequence of mixed values by redirecting to method $[spex.sequence].
     *
     * For complete method documentation see $[spex.sequence].
     * @param {function} source
     * @param {function} [dest]
     * @param {number} [limit=0]
     * @param {boolean} [track=false]
     * @returns {external:Promise}
     */
    this.sequence = function (source, dest, limit, track) {
        return config.$npm.spex.sequence.call(this, source, dest, limit, track);
    };

}

//////////////////////////
// Executes a task;
Task.exec = (ctx, obj, isTX, config) => {

    var $p = config.promise;

    // callback invocation helper;
    function callback() {
        var result, cb = ctx.cb;
        if (cb.constructor.name === 'GeneratorFunction') {
            cb = config.$npm.async(cb);
        }
        try {
            result = cb.call(obj, obj); // invoking the callback function;
        } catch (err) {
            $npm.events.error(ctx.options, err, {
                client: ctx.db.client,
                dc: ctx.dc,
                ctx: ctx.ctx
            });
            return $p.reject(err); // reject with the error;
        }
        if (result && typeof result.then === 'function') {
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
            dc: ctx.dc,
            ctx: c
        });
    }

    var cbData, cbReason, success,
        spName, // Save-Point Name;
        capSQL = ctx.options.capSQL; // capitalize sql;

    update(true);

    if (isTX) {
        // executing a transaction;
        spName = 'level_' + ctx.txLevel;
        return begin()
            .then(() => {
                    return callback()
                        .then(data => {
                            cbData = data; // save callback data;
                            success = true;
                            return commit();
                        }, reason => {
                            cbReason = reason; // save callback failure reason;
                            return rollback();
                        })
                        .then(() => {
                                if (success) {
                                    update(false, true, cbData);
                                    return cbData;
                                }
                                update(false, false, cbReason);
                                return $p.reject(cbReason);
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
            return exec(ctx.cb.txMode.begin(capSQL), 'savepoint');
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
            return obj.none((capSQL ? nested.toUpperCase() : nested) + ' ' + spName);
        }
        return obj.none(capSQL ? top.toUpperCase() : top);
    }

    // executing a task;
    return callback()
        .then(data => {
            update(false, true, data);
            return data;
        })
        .catch(error => {
            update(false, false, error);
            return $p.reject(error);
        });

};

module.exports = config => {
    var npm = config.$npm;

    // istanbul ignore next:
    // we keep 'npm.query' initialization here, even though it is always
    // pre-initialized by the 'database' module, for integrity purpose. 
    npm.query = npm.query || $npm.query(config);

    npm.async = npm.async || $npm.async(config);
    npm.spex = npm.spex || $npm.spex(config.promiseLib);
    return Task;
};
