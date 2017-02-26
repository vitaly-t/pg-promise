'use strict';

var $npm = {
    con: require('manakin').local,
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
     * However, for direct calls to method {@link Database.connect} with parameter `{direct: true}`,
     * this event represents a physical connection.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {external:Client} client
     * $[pg.Client] object that represents the connection.
     *
     * @param {} dc
     * Database Context that was used when creating the database object (see {@link Database}).
     *
     * @param {boolean} isFresh
     * It indicates when it is a fresh physical connection:
     * - `true` - the physical connection just has been allocated
     * - `false` - the connection has been used previously
     *
     * **NOTE:**
     *
     * This parameter is always `true` for direct connections (created by calling {@link Database.connect}
     * with parameter `{direct: true}`).
     *
     * @example
     *
     * var options = {
     *
     *     // pg-promise initialization options...
     *
     *     connect: (client, dc, isFresh) => {
     *         var cp = client.connectionParameters;
     *         console.log("Connected to database:", cp.database);
     *     }
     *
     * };
     */
    connect: (ctx, client, isFresh) => {
        if (typeof ctx.options.connect === 'function') {
            try {
                ctx.options.connect(client, ctx.dc, isFresh);
            } catch (e) {
                // have to silence errors here;
                // cannot allow unhandled errors while connecting to the database,
                // as it will break the connection logic;
                $events.unexpected('connect', e);
            }
        }
    },

    /**
     * @event disconnect
     * @description
     * Global notification of releasing a database connection back to the connection pool,
     * i.e. releasing the virtual connection.
     *
     * However, when releasing a direct connection (created by calling {@link Database.connect} with parameter
     * `{direct: true}`), this event represents a physical disconnection.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {external:Client} client - $[pg.Client] object that represents connection with the database.
     *
     * @param {} dc - Database Context that was used when creating the database object (see {@link Database}).
     *
     * @example
     *
     * var options = {
     *
     *     // pg-promise initialization options...
     *
     *     disconnect: (client, dc) => {
     *        var cp = client.connectionParameters;
     *        console.log("Disconnecting from database:", cp.database);
     *     }
     *
     * };
     */
    disconnect: (ctx, client) => {
        if (typeof ctx.options.disconnect === 'function') {
            try {
                ctx.options.disconnect(client, ctx.dc);
            } catch (e) {
                // have to silence errors here;
                // cannot allow unhandled errors while disconnecting from the database,
                // as it will break the disconnection logic;
                $events.unexpected('disconnect', e);
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
     * @param {object} e - Event Context Object.
     *
     * This is a shared-type object that's passed in with the following events: {@link event:query query},
     * {@link event:receive receive}, {@link event:error error}, {@link event:task task} and {@link event:transact transact}.
     *
     * @param {String|Object} e.cn
     *
     * Set only for event {@link event:error error}, and only when the error is connection-related.
     *
     * It is a safe copy of the connection string/object that was used when initializing `db` - the database instance.
     *
     * If the original connection contains a password, the safe copy contains it masked with symbol `#`, so the connection
     * can be logged safely, without exposing the password.
     *
     * @param {} e.dc
     * Database Context that was used when creating the database object (see {@link Database}). It is set for all events.
     *
     * @param {String|Object} e.query
     *
     * Query string/object that was passed into the query method. This property is only set during events {@link event:query query}
     * and {@link event:receive receive}.
     *
     * @param {external:Client} e.client
     *
     * $[pg.Client] object that represents the connection. It is set for all events, except for event {@link event:error error}
     * when it is connection-related.
     *
     * @param {} e.params - Formatting parameters for the query.
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
     * @param {object} e.ctx
     * _Task/Transaction Context_ object. See {@link Task.ctx} for details.
     *
     * This property is always set for events {@link event:task task} and {@link event:transact transact}, while for events
     * {@link event:query query}, {@link event:receive receive} and {@link event:error error} it is only set when the event occurred
     * while executing a task or transaction.
     *
     */
    query: (options, context) => {
        if (typeof options.query === 'function') {
            try {
                options.query(context);
            } catch (e) {
                // throwing an error during event 'query'
                // will result in a reject for the request.
                return e instanceof Error ? e : new $npm.utils.InternalError(e);
            }
        }
    },

    /**
     * @event receive
     * @description
     * Global notification of any data received from the database, coming from a regular query or from a stream.
     *
     * The event is fired before the data reaches the client, and only when receiving 1 or more records.
     *
     * This event notification serves two purposes:
     *  - Providing selective data logging for debugging;
     *  - Pre-processing data before it reaches the client.
     *
     * **NOTES:**
     * - If you alter the size of `data` directly or through the `result` object, it may affect `QueryResultMask`
     *   validation for regular queries, which is executed right after this notification.
     * - When adding data pre-processing, you should consider possible performance penalty this may bring.
     * - If the event handler throws an error, the original request will be rejected with that error.
     *
     * @param {array} data
     * A non-empty array of received data objects/rows.
     *
     * If any of those objects are modified during notification, the client will receive the modified data.
     *
     * @param {object} result
     * - original $[Result] object, if the data comes from a regular query, in which case `data = result.rows`.
     * - `undefined` when the data comes from a stream.
     *
     * @param {object} e
     * Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query} for its complete documentation.
     *
     * @example
     *
     * // Example below shows the fastest way to camelize column names:
     *
     * var options = {
     *     receive: (data, result, e) => {
     *         camelizeColumns(data);
     *     }
     * };
     *
     * function camelizeColumns(data) {
     *     var template = data[0];
     *     for (var prop in template) {
     *         var camel = pgp.utils.camelize(prop);
     *         if (!(camel in template)) {
     *             for (var i = 0; i < data.length; i++) {
     *                 var d = data[i];
     *                 d[camel] = d[prop];
     *                 delete d[prop];
     *             }
     *         }
     *     }
     * }
     */
    receive: (options, data, result, context) => {
        if (typeof options.receive === 'function') {
            try {
                options.receive(data, result, context);
            } catch (e) {
                // throwing an error during event 'receive'
                // will result in a reject for the request.
                return e instanceof Error ? e : new $npm.utils.InternalError(e);
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
     * @param {object} e - Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query}
     * for its complete documentation.
     *
     * @example
     *
     * var options = {
     *     task: e => {
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
    task: (options, context) => {
        if (typeof options.task === 'function') {
            try {
                options.task(context);
            } catch (e) {
                // silencing the error, to avoid breaking the task;
                $events.unexpected('task', e);
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
     * @param {object} e - Event Context Object.
     *
     * This type of object is used by several events. See event {@link event:query query}
     * for its complete documentation.
     *
     * @example
     *
     * var options = {
     *     transact: e => {
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
    transact: (options, context) => {
        if (typeof options.transact === 'function') {
            try {
                options.transact(context);
            } catch (e) {
                // silencing the error, to avoid breaking the transaction;
                $events.unexpected('transact', e);
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
     * @param {object} e
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
     *     error: (err, e) => {
     *
     *         // e.dc = Database Context
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
    error: (options, err, context) => {
        if (typeof options.error === 'function') {
            try {
                options.error(err, context);
            } catch (e) {
                // have to silence errors here;
                // throwing unhandled errors while handling an error
                // notification is simply not acceptable.
                $events.unexpected('error', e);
            }
        }
    },

    /**
     * @event extend
     * @description
     * Extends database protocol with custom methods and properties.
     *
     * Override this event to extend the existing access layer with your own functions and
     * properties best suited for your application.
     *
     * The extension thus becomes available across all access layers:
     *
     * - Within the root/default database protocol;
     * - Inside transactions, including nested ones;
     * - Inside tasks, including nested ones.
     *
     * All pre-defined methods and properties are read-only, so you will get an error,
     * if you try overriding them.
     *
     * The library will suppress any error thrown by the handler and write it into the console.
     *
     * @param {object} obj - Protocol object to be extended.
     *
     * @param {} dc - Database Context that was used when creating the database object.
     *
     * @example
     *
     * // In the example below we extend the protocol with function `addImage`
     * // that will insert one binary image and resolve with the new record id.
     *
     * var options = {
     *     extend: (obj, dc) => {
     *         // obj = this;
     *         // dc = database context;
     *         obj.addImage = data => {
     *             return obj.one("insert into images(data) values($1) returning id", '\\x' + data);
     *         }
     *     }
     * };
     *
     * @example
     *
     * // It is best to extend the protocol by adding whole entity repositories to it
     * // as shown in the following example.
     *
     * // Users repository;
     * function repUsers(obj, dc) {
     *     // NOTE: You can change the implementation based on `dc`;
     *     return {
     *         add: (name, active) => {
     *             return obj.none("insert into users values($1, $2)", [name, active]);
     *         },
     *         delete: id => obj.none("delete from users where id = $1", id)
     *     }
     * }
     *
     * // Overriding 'extend' event;
     * var options = {
     *     extend: (obj, dc) => {
     *         // obj = this;
     *         // dc = database context;
     *         this.users = repUsers(this, dc);
     *         // You can set different repositories based on `dc`
     *     }
     * };
     *
     * // Usage example:
     * db.users.add("John", true)
     *     .then(() => {
     *         // user added successfully;
     *     })
     *     .catch(error => {
     *         // failed to add the user;
     *     });
     *
     */
    extend: (options, obj, dc) => {
        if (typeof options.extend === 'function') {
            try {
                options.extend.call(obj, obj, dc);
            } catch (e) {
                // have to silence errors here;
                // the result of throwing unhandled errors while
                // extending the protocol would be unpredictable.
                $events.unexpected('extend', e);
            }
        }
    },

    /**
     * @event unexpected
     * @param {string} event - unhandled event name.
     * @param {String|Error} e - unhandled error.
     * @private
     */
    unexpected: (event, e) => {
        // If you should ever get here, your app is definitely broken, and you need to fix
        // your event handler to prevent unhandled errors during event notifications.
        //
        // Console output is suppressed when running tests, to avoid polluting test output
        // with error messages that are intentional and of no value to the test.

        /* istanbul ignore if */
        if (!$npm.main.suppressErrors) {
            var stack = e instanceof Error ? e.stack : new Error().stack;
            $npm.con.error('Unexpected error in \'%s\' event handler.\n%s\n', event, stack);
        }
    }
};

module.exports = $events;
