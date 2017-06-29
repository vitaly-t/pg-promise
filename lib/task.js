'use strict';

const npm = {
    spex: require('spex'),
    utils: require('./utils'),
    mode: require('./txMode'),
    events: require('./events'),
    query: require('./query'),
    async: require('./async')
};

/**
 * @interface Task
 * @description
 * Extends {@link Database} for an automatic connection session, with methods for executing multiple database queries.
 * The type isn't available directly, it can only be created via methods {@link Database#task Database.task} and {@link Database#tx Database.tx}.
 *
 * When executing more than one request at a time, one should allocate and release the connection only once,
 * while executing all the required queries within the same connection session. More importantly, a transaction
 * can only work within a single connection.
 *
 * This is an interface for tasks/transactions to implement a connection session, during which you can
 * execute multiple queries against the same connection that's released automatically when the task/transaction is finished.
 *
 * Each task/transaction manages the connection automatically. When executed on the root {@link Database} object, the connection
 * is allocated from the pool, and once the method's callback has finished, the connection is released back to the pool.
 * However, when invoked inside another task or transaction, the method reuses the parent connection.
 *
 * @see
 * {@link Task#ctx ctx},
 * {@link Task#batch batch},
 * {@link Task#sequence sequence},
 * {@link Task#page page}
 *
 * @example
 * db.task(t => {
 *       // t = task protocol context;
 *       // t.ctx = Task Context;
 *       return t.one('select * from users where id=$1', 123)
 *           .then(user => {
 *               return t.any('select * from events where login=$1', user.name);
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
     * @member {TaskContext} Task#ctx
     * @readonly
     * @description
     * Task/Transaction Context object - contains individual properties for each task/transaction.
     *
     * @see event {@link event:query query}
     *
     * @example
     *
     * db.task(t => {
     *     return t.ctx; // task context object
     * })
     *     .then(ctx => {
     *         console.log('Task Duration:', ctx.duration);
     *     });
     *
     * @example
     *
     * db.tx(t => {
     *     return t.ctx; // transaction context object
     * })
     *     .then(ctx => {
     *         console.log('Transaction Duration:', ctx.duration);
     *     });
     */
    this.ctx = ctx.ctx = {}; // task context object;

    npm.utils.addReadProp(this.ctx, 'isTX', isTX);

    if ('context' in ctx) {
        npm.utils.addReadProp(this.ctx, 'context', ctx.context);
    }

    npm.utils.addReadProp(this.ctx, 'connected', !ctx.db);
    npm.utils.addReadProp(this.ctx, 'tag', tag);
    npm.utils.addReadProp(this.ctx, 'dc', ctx.dc);
    npm.utils.addReadProp(this.ctx, 'level', ctx.level);

    if (isTX) {
        npm.utils.addReadProp(this.ctx, 'txLevel', ctx.txLevel);
    }

    npm.utils.addReadProp(this.ctx, 'parent', ctx.parentCtx);

    // generic query method;
    this.query = function (query, values, qrm) {
        if (!ctx.db) {
            throw new Error('Unexpected call outside of ' + (isTX ? 'transaction.' : 'task.'));
        }
        return config.$npm.query.call(this, ctx, query, values, qrm);
    };

    /**
     * @method Task#batch
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
     * @method Task#page
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
     * @method Task#sequence
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

/**
 * @private
 * @method Task.execute
 * Executes a task.
 *
 * @param ctx
 * @param obj
 * @param isTX
 * @param config
 * @returns {Promise.<TResult>}
 */
const execute = (ctx, obj, isTX, config) => {

    const $p = config.promise;

    // callback invocation helper;
    function callback() {
        let result, cb = ctx.cb;
        if (cb.constructor.name === 'GeneratorFunction') {
            cb = config.$npm.async(cb);
        }
        try {
            result = cb.call(obj, obj); // invoking the callback function;
        } catch (err) {
            npm.events.error(ctx.options, err, {
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
        const c = ctx.ctx;
        if (start) {
            npm.utils.addReadProp(c, 'start', new Date());
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
            c.duration = c.finish - c.start;
            npm.utils.lock(c, true);
        }
        (isTX ? npm.events.transact : npm.events.task)(ctx.options, {
            client: ctx.db.client,
            dc: ctx.dc,
            ctx: c
        });
    }

    let cbData, cbReason, success,
        spName; // Save-Point Name;

    const capSQL = ctx.options.capSQL; // capitalize sql;

    update(true);

    if (isTX) {
        // executing a transaction;
        spName = 'level_' + ctx.txLevel;
        return begin()
            .then(() => callback()
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
                reason => {
                    // either COMMIT or ROLLBACK has failed, which is impossible
                    // to replicate in a test environment, so skipping from the test;
                    // istanbul ignore next:
                    update(false, false, reason);
                    // istanbul ignore next:
                    return $p.reject(reason);
                }),
            reason => {
                // BEGIN has failed, which is impossible to replicate in a test
                // environment, so skipping the whole block from the test;
                // istanbul ignore next:
                update(false, false, reason);
                // istanbul ignore next:
                return $p.reject(reason);
            });
    }

    function begin() {
        if (!ctx.txLevel && ctx.cb.txMode instanceof npm.mode.TransactionMode) {
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
    const npmLocal = config.$npm;

    // istanbul ignore next:
    // we keep 'npm.query' initialization here, even though it is always
    // pre-initialized by the 'database' module, for integrity purpose.
    npmLocal.query = npmLocal.query || npm.query(config);

    npmLocal.async = npmLocal.async || npm.async(config);
    npmLocal.spex = npmLocal.spex || npm.spex(config.promiseLib);

    return {
        Task, execute
    };
};

/**
 * @typedef TaskContext
 * @description
 * Task/Transaction Context used via property {@link Task#ctx ctx} inside tasks (method {@link Database#task Database.task}) and transactions (method {@link Database#tx Database.tx}).
 *
 * Properties `context`, `connected`, `parent`, `level`, `dc`, `isTX`, `tag`, `start` and `isFresh` are set just before the operation has started,
 * while properties `finish`, `duration`, `success` and `result` are set immediately after the operation has finished.
 *
 * @property {*} context
 * If the operation was invoked with a calling context - `task.call(context,...)` or `tx.call(context,...)`,
 * this property is set with the context that was passed in. Otherwise, the property doesn't exist.
 *
 * @property {*} dc
 * _Database Context_ that was passed into the {@link Database} object during construction.
 *
 * @property {boolean} isTX
 * Indicates whether this operation is a transaction (as opposed to a regular task).
 *
 * @property {number} duration
 * ** Added in v6.2.0 **
 *
 * Number of milliseconds consumed by the operation.
 *
 * Set after the operation has finished, it is simply a shortcut for `finish - start`.
 *
 * @property {number} level
 * ** Added in v6.2.0 **
 *
 * Task nesting level, starting from 0, counting both regular tasks and transactions.
 *
 * @property {number} txLevel
 * ** Added in v6.2.0 **
 *
 * Transaction nesting level, starting from 0. Transactions on level 0 use `BEGIN/COMMIT/ROLLBACK`,
 * while transactions on nested levels use the corresponding `SAVEPOINT` commands.
 *
 * This property exists only within the context of a transaction (`isTX = true`).
 *
 * @property {TaskContext} parent
 * ** Added in v6.2.1 **
 *
 * Parent task/transaction context, or `null` when it is top-level.
 *
 * @property {boolean} connected
 * ** Added in v6.2.1 **
 *
 * Indicates when the task/transaction acquired the connection on its own (`connected = true`), and will release it once
 * the operation has finished. When the value is `false`, the operation is reusing an existing connection.
 *
 * @property {*} tag
 * Tag value as it was passed into the task. See methods {@link Database#task task} and {@link Database#tx tx}.
 *
 * @property {Date} start
 * Date/Time of when this operation started the execution.
 *
 * @property {boolean} isFresh
 * Indicates when a fresh physical connection is being used.
 *
 * @property {Date} finish
 * Once the operation has finished, this property is set to the Data/Time of when it happened.
 *
 * @property {boolean} success
 * Once the operation has finished, this property indicates whether it was successful.
 *
 * @property {*} result
 * Once the operation has finished, this property contains the result, depending on property `success`:
 * - data resolved by the operation, if `success = true`
 * - error / rejection reason, if `success = false`
 *
 */
