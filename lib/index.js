// Cannot declare 'use strict' here, because queryResult
// is exported into the global namespace.

var npm = {
    pg: require('pg'),
    events: require('events'),
    formatting: require('./formatting')
};

///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one + many.
queryResult = {
    one: 1,  // single row;
    many: 2,  // one or more rows;
    none: 4,  // no rows;
    any: 6   // many|none (default).
};

////////////////////////////////////////////////
// Main entry function;
//
// 'options' parameter -
// {
//    connect: function(client) {
//        client has connected;
//    },
//
//    disconnect: function(client) {
//        client is disconnecting;
//    },
//
//    query: function(e) {
//        query is executing;
//    },
//
//    error: function(err, e) {
//        error in connection/query/transaction;
//    },
//
//    transact: function(e) {
//        transaction start/finish;
//    },
//
//    extend: function(obj) {
//        extending the access protocol;
//    },
//
//    pgFormatting: false,
//      - Redirects query formatting into node-postgres library;
//      - Default is false, and all queries are formatted by 'pg-promise'.
//
//    promiseLib: null
//      - Overrides the promise library to be used.
// }
function main(options) {

    if (options !== null && options !== undefined && typeof(options) !== 'object') {
        throw new Error("Invalid parameter 'options' specified.");
    }

    var lib = options ? options.promiseLib : null;
    if (lib) {
        // alternative promise library specified;
        var t = typeof(lib);
        if (t === 'function' || t === 'object') {
            // 'Promise' type is supported by libraries Bluebird, When, Q and RSVP,
            // while libraries 'promise' and 'lie' use their main function instead.
            if (typeof(lib.Promise) === 'function') {
                npm.promise = lib.Promise;
            } else {
                npm.promise = lib;
            }
        } else {
            throw new Error('Invalid or unsupported promise library override.');
        }
    } else {
        if (!npm.promise) {
            npm.promise = require('promise'); // 'promise' is the default library;
        }
    }

    // method abbreviations used in the library;
    $p.resolve = npm.promise.resolve;
    $p.reject = npm.promise.reject;

    return new Library(options)._createDB;
}

// Library type;
function Library(options) {

    var self = this;
    npm.events.EventEmitter.call(self);

    self._createDB = function (cn) {
        if (!cn) {
            // Cannot instantiate a database without connection details;
            throw new Error("Connection details must be specified.");
        }
        var db = new Database(cn, options);
        db._events = self._events;
        self.emit.call(db, 'extend', db);

        db.on('error', function () {
            // prevent EventEmitter from turning Database `error` event
            // into `uncaughtException`, when it is not handled;
        });

        return db;
    };

    var ext = self._createDB; // namespace for extensions;

    // Library instance;
    ext.lib = self;

    // Namespace for type conversion helpers;
    ext.as = npm.formatting.as;

    // Exposing PG library instance, just for flexibility.
    ext.pg = npm.pg;

    // Terminates pg library; call it when exiting the application.
    ext.end = function () {
        npm.pg.end();
    };

    // Library version;
    ext.version = new Version(1, 5, 0);
}

// Database type;
function Database(cn, options) {

    var dbInst = this;

    npm.events.EventEmitter.call(dbInst);

    // Resolves a connection object to allow chaining
    // queries under the same (shared) connection;
    dbInst.connect = function () {
        var db = {};

        var self = {
            query: function (query, values, qrm) {
                if (!db.client) {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
                return $query(dbInst, db, query, values, qrm, options);
            },
            done: function () {
                if (!db.client) {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
                db.done();
                db.client = null;
            }
        };
        $extend(dbInst, self, null, db, options); // extending the protocol;
        return $connect(dbInst, cn, options)
            .then(function (obj) {
                db.client = obj.client;
                db.done = function () {
                    $notify.disconnect(dbInst, options, obj.client);
                    obj.done(); // release the connection;
                };
                $notify.connect(dbInst, options, obj.client);
                return $p.resolve(self);
            });
    };

    dbInst.query = function (query, values, qrm) {
        return $connect(dbInst, cn, options)
            .then(function (db) {
                $notify.connect(dbInst, options, db.client);
                return $query(dbInst, db, query, values, qrm, options)
                    .then(function (data) {
                        $notify.disconnect(dbInst, options, db.client);
                        db.done();
                        return $p.resolve(data);
                    }, function (reason) {
                        $notify.disconnect(dbInst, options, db.client);
                        db.done();
                        return $p.reject(reason);
                    });
            });
    };

    $extend(dbInst, dbInst, cn, null, options); // extending root protocol;
}

Library.prototype = Object.create(npm.events.EventEmitter.prototype);
Database.prototype = Object.create(npm.events.EventEmitter.prototype);

/////////////////////////////////////////
// Global functions, all start with $
/////////////////////////////////////////

// Injects additional methods into an access object,
// extending the protocol's base method 'query'.
function $extend(dbInst, obj, cn, db, options) {

    // Expects no data to be returned;
    // Resolves with `undefined`.
    obj.none = function (query, values) {
        return obj.query(query, values, queryResult.none);
    };

    // Expects exactly one row of data;
    // Resolves with the object representing the row.
    obj.one = function (query, values) {
        return obj.query(query, values, queryResult.one);
    };

    // Expects one or more rows of data;
    // Resolves with array of rows.
    obj.many = function (query, values) {
        return obj.query(query, values, queryResult.many);
    };

    // Expects 0 or 1 row of data;
    // Resolves with `null` when no rows returned,
    // or with the object representing the row.
    obj.oneOrNone = function (query, values) {
        return obj.query(query, values, queryResult.one | queryResult.none);
    };

    // Expects any kind of data (same as method 'any');
    // Resolves with array of rows.
    obj.manyOrNone = function (query, values) {
        return obj.query(query, values, queryResult.many | queryResult.none);
    };

    // Expects any kind of data (same as method 'manyOrNone');
    // Resolves with array of rows.
    obj.any = function (query, values) {
        return obj.query(query, values, queryResult.many | queryResult.none);
    };

    // Resolves with the original Result object (same as method 'queryRaw'):
    // https://github.com/brianc/node-postgres/blob/master/lib/result.js
    obj.raw = function (query, values) {
        return obj.query(query, values, 'raw');
    };

    // Resolves with the original Result object (same as method 'raw'):
    // https://github.com/brianc/node-postgres/blob/master/lib/result.js
    obj.queryRaw = function (query, values) {
        return obj.query(query, values, 'raw');
    };

    // Function query with specified Query Result Mask;
    obj.func = function (funcName, values, qrm) {
        return obj.query({
            funcName: funcName
        }, values, qrm);
    };

    // A procedure expects either no rows,
    // or one row with the return value(s);
    obj.proc = function (procName, values) {
        return obj.query({
            funcName: procName
        }, values, queryResult.one | queryResult.none);
    };

    // Transaction methods;
    obj.tx = transaction;
    obj.transact = transaction;

    function transaction(p1, p2) {

        // we are giving the option to insert a transaction tag in front
        // of the callback function, for better code readability;
        var tag, cb = p1;
        if (p2 !== undefined) {
            tag = p1;
            cb = p2;
        }

        if (typeof(cb) !== 'function') {
            return $p.reject("Callback function must be specified for the transaction.");
        }

        // transaction instance;
        var txDB = {
            ctx: {},
            options: options
        };

        if (tag !== undefined) {
            txDB.ctx.tag = tag; // transaction tag;
        }

        var internal;   // internal connection flag;

        // connection attachment helper;
        function attach(c, int) {
            if (txDB.client) {
                // internal logic check, cannot be caused from the client;
                throw new Error("Invalid transaction attachment.");
            }
            txDB.client = c.client;
            txDB.done = c.done;
            internal = int ? true : false;
            if (internal) {
                $notify.connect(dbInst, options, txDB.client); // notify of a new connection;
            }
        }

        // connection detachment helper;
        function detach() {
            if (!txDB.client) {
                // internal logic check, cannot be caused from the client;
                throw new Error("Invalid transaction detachment.");
            }
            if (internal) {
                // connection was allocated internally;
                $notify.disconnect(dbInst, options, txDB.client); // notify of disconnection;
                txDB.done(); // disconnect;
            }
            txDB.client = null;
            txDB.done = null;
        }

        var tx = {
            query: function (query, values, qrm) {
                if (!txDB.client) {
                    throw new Error("Unexpected call outside of transaction.");
                }
                return $query(dbInst, txDB, query, values, qrm, options);
            },
            sequence: function (factory) {
                if (typeof(factory) !== 'function') {
                    return $p.reject("Invalid factory function specified.");
                }
                return $sequence(tx, factory);
            },
            queue: function (factory) {
                // just an alias for method 'sequence';
                return this.sequence(factory);
            },
            ctx: txDB.ctx
        };

        $extend(dbInst, tx, null, txDB, options); // extending transaction protocol;

        if (cn) {
            // connection required;
            var connected;
            return $connect(dbInst, cn, options)
                .then(function (cnObj) {
                    connected = true;
                    attach(cnObj, true);
                    return $transact(dbInst, tx, cb, txDB);
                })
                .then(function (data) {
                    detach();
                    return $p.resolve(data);
                }, function (reason) {
                    if (connected) {
                        detach();
                    }
                    return $p.reject(reason);
                });
        } else {
            // reuse existing connection;
            attach(db);
            return $transact(dbInst, tx, cb, txDB)
                .then(function (data) {
                    detach();
                    return $p.resolve(data);
                }, function (reason) {
                    detach();
                    return $p.reject(reason);
                });
        }
    }

    // protocol extensibility support;
    $notify.extend(dbInst, options, obj);
}

// Generic query call;
function $query(dbInst, db, query, values, qrm, options) {
    return $p(function (resolve, reject) {

        var errMsg,
            pgFormatting = (options && options.pgFormatting),
            params = pgFormatting ? values : undefined,
            isFunc = query && typeof(query) === 'object' && 'funcName' in query,
            isRaw = qrm === 'raw';

        if (!isRaw) {
            if (qrm === null || qrm === undefined) {
                qrm = queryResult.any; // default query result;
            } else {
                if (typeof(qrm) !== 'number' || !isFinite(qrm)) {
                    qrm = 0; // to let it fail below;
                }
            }
        }
        if (isFunc) {
            query = query.funcName; // query is a function name;
        }
        if (typeof(query) !== 'string' || !/\S/.test(query)) {
            errMsg = (isFunc ? "Function name" : "Parameter 'query'") + " must be a non-empty text string.";
        }
        if (!errMsg) {
            var badMask = queryResult.one | queryResult.many; // the combination isn't supported;
            if (!isRaw && ((qrm & badMask) === badMask || qrm < 1 || qrm > 6)) {
                errMsg = "Invalid Query Result Mask specified.";
            } else {
                if (!pgFormatting || isFunc) {
                    try {
                        // use 'pg-promise' implementation of parameter formatting;
                        if (isFunc) {
                            query = npm.formatting.formatFunction(query, values);
                        } else {
                            query = npm.formatting.formatQuery(query, values);
                        }
                    } catch (err) {
                        if (isFunc) {
                            query = "select * from " + query + "(...)";
                        }
                        errMsg = err;
                        params = values;
                    }
                }
            }
        }
        if (!errMsg) {
            errMsg = $notify.query(dbInst, options, {
                client: db.client,
                query: query,
                params: params,
                ctx: db.ctx
            });
            if (!errMsg) {
                db.client.query(query, params, function (err, result) {
                    var data;
                    if (err) {
                        errMsg = err;
                    } else {
                        if (isRaw) {
                            data = result; // raw object requested;
                        } else {
                            data = result.rows;
                            var len = data.length;
                            if (len) {
                                if (len > 1 && (qrm & queryResult.one)) {
                                    // one row was expected, but returned multiple;
                                    errMsg = "Single row was expected from the query.";
                                } else {
                                    if (!(qrm & (queryResult.one | queryResult.many))) {
                                        // no data should have been returned;
                                        errMsg = "No return data was expected from the query.";
                                    } else {
                                        if (!(qrm & queryResult.many)) {
                                            data = data[0];
                                        }
                                    }
                                }
                            } else {
                                // no data returned;
                                if (qrm & queryResult.none) {
                                    if (qrm & queryResult.one) {
                                        data = null;
                                    } else {
                                        data = (qrm & queryResult.many) ? [] : undefined;
                                    }
                                } else {
                                    errMsg = "No data returned from the query.";
                                }
                            }
                        }
                    }
                    if (!rejectNotify()) {
                        resolve(data);
                    }
                });
            }
        }
        function rejectNotify() {
            if (errMsg) {
                reject(errMsg);
                $notify.error(dbInst, options, errMsg, {
                    client: db.client,
                    query: query,
                    params: params,
                    ctx: db.ctx
                });
                return true;
            }
            return false;
        }

        rejectNotify();
    });
}

// Connects to a database;
function $connect(dbInst, cn, options) {
    return $p(function (resolve, reject) {
        npm.pg.connect(cn, function (err, client, done) {
            if (err) {
                reject(err);
                $notify.error(dbInst, options, err, {
                    cn: cn
                });
            } else {
                resolve({
                    client: client,
                    done: done
                });
            }
        });
    });
}

// Implements transaction logic;
function $transact(dbInst, obj, cb, inst) {

    // callback invocation helper;
    function invoke() {
        var result;
        try {
            result = cb.call(obj, obj); // invoking the callback function;
        } catch (err) {
            $notify.error(dbInst, inst.options, err, {
                client: inst.client,
                ctx: inst.ctx
            });
            return $p.reject(err); // reject with the error;
        }
        if (result && typeof(result.then) === 'function') {
            return result; // result is a valid promise object;
        } else {
            // transaction callback is always expected to return a promise object;
            return $p.reject("Transaction callback function didn't return a promise object.");
        }
    }

    // updates the transaction context and notifies the client;
    function txUpdate(start, success, result) {
        var c = inst.ctx;
        if (start) {
            c.start = new Date();
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
        }
        $notify.transact(dbInst, inst.options, {
            client: inst.client,
            ctx: c
        });
    }

    var cbData, cbReason, success;
    return $p(function (resolve, reject) {
        txUpdate(true);
        obj.none('begin') // BEGIN;
            .then(function () {
                invoke() // callback;
                    .then(function (data) {
                        cbData = data; // save callback data;
                        success = true;
                        return obj.none('commit'); // COMMIT;
                    }, function (reason) {
                        cbReason = reason; // save callback failure reason;
                        return obj.none('rollback'); // ROLLBACK;
                    })
                    .then(function () {
                        if (success) {
                            resolve(cbData); // resolve with callback data;
                            txUpdate(false, true, cbData);
                        } else {
                            reject(cbReason); // reject with callback reason;
                            txUpdate(false, false, cbReason);
                        }
                    }, function (reason) {
                        reject(reason); // either COMMIT or ROLLBACK failed;
                        txUpdate(false, false, reason);
                    });
            }, function (reason) {
                reject(reason); // BEGIN failed;
                txUpdate(false, false, reason);
            });
    });
}

// client notification helpers;
var $notify = {
    connect: function (dbInst, options, client) {
        if ($isFunction(options, 'connect')) {
            try {
                options.connect(client);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while connecting to the database,
                // as it will break the connection logic;
                $notify.unexpected('connect', err);
            }
        }
        dbInst.emit('connect', client);
    },
    disconnect: function (dbInst, options, client) {
        if ($isFunction(options, 'disconnect')) {
            try {
                options.disconnect(client);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while disconnecting from the database,
                // as it will break the disconnection logic;
                $notify.unexpected('disconnect', err);
            }
        }
        dbInst.emit('disconnect', client);
    },
    query: function (dbInst, options, context) {
        if ($isFunction(options, 'query')) {
            try {
                options.query(context);
            } catch (err) {
                // throwing an exception is ok during 'query' event,
                // it will result in a proper reject for the query.
                return err;
            }
        }
        dbInst.emit('query', context);
    },
    transact: function (dbInst, options, context) {
        if ($isFunction(options, 'transact')) {
            try {
                options.transact(context);
            } catch (err) {
                // have to silence errors here;
                // cannot allow unhandled errors while handling a transaction
                // event, as it will break the transaction's command chain;
                $notify.unexpected('transact', err);
            }
        }
        dbInst.emit('transact', context);
    },
    error: function (dbInst, options, err, context) {
        if ($isFunction(options, 'error')) {
            try {
                options.error(err, context);
            } catch (err) {
                // have to silence errors here;
                // throwing unhandled errors while handling an error
                // notification is simply not acceptable.
                $notify.unexpected('error', err);
            }
        }
        dbInst.emit('error', err, context);
    },
    extend: function (dbInst, options, obj) {
        if ($isFunction(options, 'extend')) {
            try {
                options.extend.call(obj, obj);
            } catch (err) {
                // have to silence errors here;
                // the result of throwing unhandled errors while
                // extending the protocol would be unpredictable.
                $notify.unexpected('extend', err);
            }
        }
        if (dbInst !== obj) {
            obj._events = dbInst._events;
            dbInst.emit.call(obj, 'extend', obj);
        }
    },
    unexpected: function (event, err) {
        // If you should ever get here, your app is definitely broken,
        // and you need to fix your event handler to prevent unhandled
        // errors during event notifications.
        console.log("Unexpected error in '" + event + "' event handler.");
        if (err.stack) {
            console.log(err.stack);
        } else {
            console.log("Error:", err.message || err);
        }
    }
};

function $isFunction(options, event) {
    var func = options ? options[event] : null;
    if (func) {
        if (typeof(func) !== 'function') {
            throw new Error("Type 'function' was expected for property 'options." + event + "'");
        }
        return true;
    }
    return false;
}

// Simpler promise instantiation;
function $p(func) {
    return new npm.promise(func);
}

// Sequentially resolves dynamic promises returned by a factory;
function $sequence(t, factory) {
    var idx = 0, result = [];

    function loop() {
        var obj;
        try {
            obj = factory.call(t, idx, t); // get next promise;
        } catch (e) {
            return $p.reject(e);
        }
        if (!obj) {
            // no more promises left in the sequence;
            return $p.resolve(result);
        }
        if (typeof(obj.then) !== 'function') {
            // the result is not a promise;
            return $p.reject("Promise factory returned invalid result for index " + idx);
        }
        return obj.then(function (data) {
            result.push(data);
            idx++;
            return loop();
        }, function (reason) {
            return $p.reject(reason);
        });
    }

    return loop();
}

module.exports = main;

function Version(major, minor, patch) {
    this.major = major || 0;
    this.minor = minor || 0;
    this.patch = patch || 0;
}

Version.prototype.toString = function () {
    return this.major + '.' + this.minor + '.' + this.patch;
};
