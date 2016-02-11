'use strict';

var $npm = {
    main: require('./'),
    utils: require('./utils')
};

/////////////////////////////////
// Client notification helpers;
var $events = {

    /**
     * @event connect
     * @description
     * Global notification of acquiring a new database connection from the connection pool,
     * i.e. a virtual connection.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {external:Client} client - $[pg.Client] object that represents connection with the database.
     *
     * @example
     *
     * var options = {
     *
     *     // pg-promise initialization options...
     *
     *     connect: function (client) {
     *         var cp = client.connectionParameters;
     *         console.log("Connected to database:", cp.database);
     *     }
     *
     * };
     */
    connect: function (options, client) {
        if (options && options.connect instanceof Function) {
            try {
                options.connect(client);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while connecting to the database,
                // as it will break the connection logic;
                $events.unexpected('connect', err);
            }
        }
    },

    /**
     * @event disconnect
     * @description
     * Global notification of releasing a database connection back to the connection pool,
     * i.e. releasing the virtual connection.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {external:Client} client - $[pg.Client] object that represents connection with the database.
     *
     * @example
     *
     * var options = {
     *
     *     // pg-promise initialization options...
     *
     *     disconnect: function(client){
     *        var cp = client.connectionParameters;
     *        console.log("Disconnecting from database:", cp.database);
     *     }
     *
     * };
     */
    disconnect: function (options, client) {
        if (options && options.disconnect instanceof Function) {
            try {
                options.disconnect(client);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while disconnecting from the database,
                // as it will break the disconnection logic;
                $events.unexpected('disconnect', err);
            }
        }
    },

    /**
     * @event query
     * @description
     *
     * Global notification of a query that's about to execute.
     *
     * Notification happens just before the query execution. And if the handler throws an error, the query execution
     * will be rejected with that error.
     *
     * @param {Object} e - Event Context Object.
     *
     * This is a shared-type object that's passed in with the following events: {@link event:query query},
     * {@link event:receive receive}, {@link event:error error}, {@link event:task task} and {@link event:transact transact}.
     *
     * @param {String|Object} [e.cn]
     *
     * Set only for event {@link event:error error}, and only when the error is connection-related.
     *
     * It is a safe copy of the connection string/object that was used when initializing `db` - the database instance.
     *
     * If the original connection contains a password, the safe copy contains it masked with symbol `#`, so the connection
     * can be logged safely, without exposing the password.
     *
     * @param {String|Object} [e.query]
     *
     * Query string/object that was passed into the query method. This property is only set during events {@link event:query query}
     * and {@link event:receive receive}.
     *
     * @param {external:Client} e.client
     *
     * $[pg.Client] object that represents the connection. It is set always.
     *
     * @param {} [e.params] - Formatting parameters for the query.
     *
     * It is set only for events {@link event:query query}, {@link event:receive receive} and {@link event:error error}, and only
     * when it is needed for logging. This library takes an extra step in figuring out when formatting parameters are of any value
     * to the event logging:
     * - when an error occurs related to the query formatting, event {@link event:error error} is sent with the property set.
     * - when initialization parameter `pgFormat` is used, and all query formatting is done within the $[PG] library, events
     * {@link event:query query} and {@link event:receive receive} will have this property set also, since this library no longer
     * handles the query formatting.
     *
     * When this parameter is not set, it means one of the two things:
     * - there were no parameters passed into the query method;
     * - property `query` of this object already contains all the formatting values in it, so logging only the query is sufficient.
     *
     * @param {Object} [e.ctx] - Task/Transaction Context Object.
     *
     * This property is always set for events {@link event:task task} and {@link event:transact transact}, while for events
     * {@link event:query query}, {@link event:receive receive} and {@link event:error error} it is only set when the event occurred
     * while executing a task or transaction.
     *
     * @param {Boolean} e.ctx.isTX
     * Indicates whether `ctx` represents a transaction. When `false`, object `ctx` represents a task.
     *
     * @param {Date} e.ctx.start
     * Date/Time of when this task or transaction started the execution.
     *
     * @param {Date} [e.ctx.finish]
     * Data/Time of when this task or transaction has finished, and the property is set only after this happened.
     *
     * Verifying for this property being set is the key condition to determining whether it is a `start` or `finish` notification
     * during events {@link event:task task} and {@link event:transact transact}.
     *
     * @param {} [e.ctx.tag]
     * Tag value as it was passed into the task or transaction.
     *
     * @param {Boolean} [e.ctx.success]
     * Once the operation is finished, this property indicates whether it was successful.
     *
     * @param {} [e.ctx.result]
     * Once the operation has finished, this property contains its result,
     * depending on property `success`:
     * - data resolved by the operation, if `success` = `true`
     * - error / rejection reason, if `success` = `false`
     *
     * @param {Object} [e.ctx.context]
     * If the operation was invoked with an object context - `task.call(obj,...)` or `tx.call(obj,...)`,
     * this property is set with the context object that was passed in.
     */
    query: function (options, context) {
        if (options && options.query instanceof Function) {
            try {
                options.query(context);
            } catch (err) {
                // throwing an error during event 'query'
                // will result in a reject for the request.
                return new $npm.utils.InternalError(err);
            }
        }
    },

    /**
     * @event receive
     * @summary Global notification of any received data.
     * @param {Array} data - array of received data rows.
     * @param {Object} result - original $[Result] object, if available.
     * @param {Object} e - Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query}
     * for its complete documentation.
     */
    receive: function (options, data, result, context) {
        if (options && options.receive instanceof Function) {
            try {
                options.receive(data, result, context);
            } catch (err) {
                // throwing an error during event 'receive'
                // will result in a reject for the request.
                return new $npm.utils.InternalError(err);
            }
        }
    },

    /**
     * @event task
     * @description
     * Global notification of a task start / finish events.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {Object} e - Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query}
     * for its complete documentation.
     *
     * @example
     *
     * var options = {
     *     task: function (e) {
     *         if (e.ctx.finish) {
     *             // this is a task->finish event;
     *             console.log("Finish Time:", e.ctx.finish);
     *             if (e.ctx.success) {
     *                 // e.ctx.result = resolved data;
     *             } else {
     *                 // e.ctx.result = error/rejection reason;
     *             }
     *         } else {
     *             // this is a task->start event;
     *             console.log("Start Time:", e.ctx.start);
     *         }
     *     }
     * };
     *
     */
    task: function (options, context) {
        if (options && options.task instanceof Function) {
            try {
                options.task(context);
            } catch (err) {
                // silencing the error, to avoid breaking the task;
                $events.unexpected('task', err);
            }
        }
    },

    /**
     * @event transact
     * @description
     * Global notification of a transaction start / finish events.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {Object} e - Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query}
     * for its complete documentation.
     *
     * @example
     *
     * var options = {
     *     transact: function (e) {
     *         if (e.ctx.finish) {
     *             // this is a transaction->finish event;
     *             console.log("Finish Time:", e.ctx.finish);
     *             if (e.ctx.success) {
     *                 // e.ctx.result = resolved data;
     *             } else {
     *                 // e.ctx.result = error/rejection reason;
     *             }
     *         } else {
     *             // this is a transaction->start event;
     *             console.log("Start Time:", e.ctx.start);
     *         }
     *     }
     * };
     *
     */
    transact: function (options, context) {
        if (options && options.transact instanceof Function) {
            try {
                options.transact(context);
            } catch (err) {
                // silencing the error, to avoid breaking the transaction;
                $events.unexpected('transact', err);
            }
        }
    },

    /**
     * @event error
     * @description
     * Global notification of every error encountered by this library.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {} err
     * The error encountered, of the same value and type as it was reported.
     *
     * @param {Object} e
     * Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query}
     * for its complete documentation.
     *
     * @example
     * var options = {
     *
     *     // pg-promise initialization options...
     *
     *     error: function (err, e) {
     *
     *         if (e.cn) {
     *             // this is a connection-related error
     *             // cn = safe connection details passed into the library:
     *             //      if password is present, it is masked by #
     *         }
     *
     *         if (e.query) {
     *             // query string is available
     *             if (e.params) {
     *                 // query parameters are available
     *             }
     *         }
     *
     *         if (e.ctx) {
     *             // occurred inside a task or transaction
     *         }
     *       }
     *
     * };
     *
     */
    error: function (options, err, context) {
        if (options && options.error instanceof Function) {
            try {
                options.error(err, context);
            } catch (err) {
                // have to silence errors here;
                // throwing unhandled errors while handling an error
                // notification is simply not acceptable.
                $events.unexpected('error', err);
            }
        }
    },

    /**
     * @event extend
     * @summary Extends database protocol with custom methods and properties.
     * @param {Object} obj - protocol object to be extended.
     */
    extend: function (options, obj) {
        if (options && options.extend instanceof Function) {
            try {
                options.extend.call(obj, obj);
            } catch (err) {
                // have to silence errors here;
                // the result of throwing unhandled errors while
                // extending the protocol would be unpredictable.
                $events.unexpected('extend', err);
            }
        }
    },

    /**
     * @event unexpected
     * @param {String} event - unhandled event name.
     * @param {String|Error} err - unhandled error.
     * @private
     */
    unexpected: function (event, err) {
        // If you should ever get here, your app is definitely broken, and you need to fix
        // your event handler to prevent unhandled errors during event notifications.
        //
        // Console output is suppressed when running tests, to avoid polluting test output
        // with error messages that are intentional and of no value to the test.

        /* istanbul ignore if */
        if (!$npm.main.suppressErrors) {
            console.error("Unexpected error in '" + event + "' event handler.");
            if (!$npm.utils.isNull(err)) {
                console.error(err.stack || err.message || err);
            }
        }
    }
};

module.exports = $events;
