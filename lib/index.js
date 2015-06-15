// Cannot declare 'use strict' here, because queryResult
// is exported into the global namespace.

var npm = {
        pg: require('pg'),
        formatting: require('./formatting')
    },
    $DEV = process.env.NODE_ENV === 'development';

///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one|many.
queryResult = {
    one: 1,  // single row;
    many: 2,  // one or more rows;
    none: 4,  // no rows;
    any: 6   // many|none (default).
};

////////////////////////////
// Database type;
function Database(cn, options) {

    function createContext() {
        return new Context(cn, options);
    }

    // Resolves a connection object to allow chaining
    // queries under the same (shared) connection;
    this.connect = function () {
        var ctx = createContext();
        var self = {
            query: function (query, values, qrm) {
                if (!ctx.db) {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
                return $query(ctx, query, values, qrm);
            },
            done: function () {
                if (!ctx.db) {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
                ctx.disconnect();
            }
        };
        $extend(ctx, self); // extending the protocol;
        return $connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return $p.resolve(self);
            });
    };

    this.query = function (query, values, qrm) {
        var ctx = createContext();
        return $connect(ctx)
            .then(function (db) {
                ctx.connect(db);
                return $query(ctx, query, values, qrm)
                    .then(function (data) {
                        ctx.disconnect();
                        return $p.resolve(data);
                    }, function (reason) {
                        ctx.disconnect();
                        return $p.reject(reason);
                    });
            });
    };

    $extend(createContext(), this); // extending root protocol;
}

/////////////////////////////////
// Transaction type;
function Transaction(ctx, tag) {

    var self = this;

    this.ctx = ctx.ctx = {}; // transaction context object;

    if (tag !== undefined) {
        this.ctx.tag = tag; // transaction tag;
    }

    this.query = function (query, values, qrm) {
        if (!ctx.db) {
            throw new Error("Unexpected call outside of transaction.");
        }
        return $query(ctx, query, values, qrm);
    };
    this.sequence = function (factory) {
        if (typeof(factory) !== 'function') {
            return $p.reject("Invalid factory function specified.");
        }
        return $sequence(self, factory);
    };
    this.queue = function (factory) {
        // just an alias for method 'sequence';
        return self.sequence(factory);
    };

    $extend(ctx, this); // extending transaction protocol;
}

//////////////////////////////////////
// Database Connection Context type;
function Context(cn, options, db) {

    this.cn = cn; // connection details;
    this.options = options; // library options;
    this.db = db; // database session;

    this.connect = function (db) {
        if ($DEV && this.db) {
            // this check is for local testing only, as the
            // client-side code cannot cause this problem.
            throw new Error('Unexpected context connection.');
        }
        this.db = db;
    };

    this.disconnect = function () {
        if ($DEV && !this.db) {
            // this check is for local testing only, as the
            // client-side code cannot cause this problem.
            throw new Error('Unexpected context disconnection.');
        }
        this.db.done();
        this.db = null;
    };

    this.clone = function () {
        return new Context(this.cn, this.options, this.db);
    };
}

////////////////////////////
// Library's Version type;
function Version(major, minor, patch) {
    this.major = major || 0;
    this.minor = minor || 0;
    this.patch = patch || 0;
}

// Version-to-string conversion;
Version.prototype.toString = function () {
    return this.major + '.' + this.minor + '.' + this.patch;
};

/////////////////////////////////////////
// Global functions, all start with $
/////////////////////////////////////////

// Injects additional methods into an access object,
// extending the protocol's base method 'query'.
function $extend(ctx, obj) {

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

    // Expects data according to qrm (Query Result Mask);
    obj.func = function (funcName, values, qrm) {
        return obj.query({
            funcName: funcName
        }, values, qrm);
    };

    // Expects 0 or 1 row of data;
    // Resolves with `null` when no rows returned,
    // or with the object representing the row.
    obj.proc = function (procName, values) {
        return obj.func(procName, values, queryResult.one | queryResult.none);
    };

    // Transaction methods;
    obj.tx = transaction;
    obj.transact = transaction;

    function transaction(p1, p2) {

        var tag, // tag object/value;
            txCtx = ctx.clone(); // transaction context object;

        txCtx.cb = p1; // callback function;

        // we are giving the option to insert a transaction tag in front
        // of the callback function, for better code readability;
        if (p2 !== undefined) {
            tag = p1;
            txCtx.cb = p2;
        }

        if (typeof(txCtx.cb) !== 'function') {
            return $p.reject("Callback function must be specified for the transaction.");
        }

        var tx = new Transaction(txCtx, tag);

        if (txCtx.db) {
            // reuse existing connection;
            return $transact(txCtx, tx);
        }

        // connection required;
        return $connect(txCtx)
            .then(function (cnObj) {
                txCtx.connect(cnObj);
                return $transact(txCtx, tx);
            })
            .then(function (data) {
                txCtx.disconnect();
                return $p.resolve(data);
            }, function (reason) {
                if (txCtx.db) {
                    txCtx.disconnect();
                }
                return $p.reject(reason);
            });
    }

    // protocol extensibility support;
    $notify.extend(ctx.options, obj);
}

// Generic query call;
function $query(ctx, query, values, qrm) {
    return $p(function (resolve, reject) {

        var errMsg,
            options = ctx.options,
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
            errMsg = $notify.query(options, {
                client: ctx.db.client,
                query: query,
                params: params,
                ctx: ctx.ctx
            });
            if (!errMsg) {
                ctx.db.client.query(query, params, function (err, result) {
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
                $notify.error(options, errMsg, {
                    client: ctx.db.client,
                    query: query,
                    params: params,
                    ctx: ctx.ctx
                });
                return true;
            }
            return false;
        }

        rejectNotify();
    });
}

// Connects to a database;
function $connect(ctx) {
    return $p(function (resolve, reject) {
        npm.pg.connect(ctx.cn, function (err, client, done) {
            if (err) {
                reject(err);
                $notify.error(ctx.options, err, {
                    cn: ctx.cn
                });
            } else {
                resolve({
                    client: client,
                    done: function () {
                        done();
                        $notify.disconnect(ctx.options, client);
                    }
                });
                $notify.connect(ctx.options, client);
            }
        });
    });
}

// Implements transaction logic;
function $transact(ctx, obj) {

    // callback invocation helper;
    function invoke() {
        var result;
        try {
            result = ctx.cb.call(obj, obj); // invoking the callback function;
        } catch (err) {
            $notify.error(ctx.options, err, {
                client: ctx.db.client,
                ctx: ctx.ctx
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
        var c = ctx.ctx;
        if (start) {
            c.start = new Date();
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
        }
        $notify.transact(ctx.options, {
            client: ctx.db.client,
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
    connect: function (options, client) {
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
    },
    disconnect: function (options, client) {
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
    },
    query: function (options, context) {
        if ($isFunction(options, 'query')) {
            try {
                options.query(context);
            } catch (err) {
                // throwing an exception is ok during 'query' event,
                // it will result in a proper reject for the query.
                return err;
            }
        }
    },
    transact: function (options, context) {
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
    },
    error: function (options, err, context) {
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
    },
    extend: function (options, obj) {
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

// Verifies event-function in the options;
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

// Main library function;
function $main(options) {

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

    var inst = function (cn) {
        if (!cn) {
            // Cannot instantiate a database without connection details;
            throw new Error("Connection details must be specified.");
        }
        return new Database(cn, options);
    };

    // Namespace for type conversion helpers;
    inst.as = npm.formatting.as;

    // Exposing PG library instance, just for flexibility.
    inst.pg = npm.pg;

    // Terminates pg library; call it when exiting the application.
    inst.end = function () {
        npm.pg.end();
    };

    // Library version;
    inst.version = new Version(1, 5, 1);

    return inst;
}

module.exports = $main;
