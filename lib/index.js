// Cannot declare 'use strict' here, because queryResult
// needs to be exported into the global namespace.

var npm = {
    pg: require('pg'),
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
    any: 6   // (default) = many|none = anything.
};

////////////////////////////////////////////////
// Main entry function;
//
// 'options' parameter -
// {
//    connect: function(client){
//        client has connected;
//    },
//
//    disconnect: function(client){
//        client is disconnecting;
//    },
//
//    query: function(e){
//        query is executing;
//    },
//
//    error: function(err, e){
//        error executing a query;
//    },
//
//    transact: function(e){
//        transaction start/finish;
//    },
//
//    extend: function(obj){
//        extending the access protocol;
//    },
//
//    pgFormatting: false,
//      - Redirects query formatting into node-postgres library;
//      - Default is false, and all queries are formatted within 'pg-promise'.
//
//    promiseLib: null
//      - Overrides the promise library to be used.
// }
module.exports = function (options) {

    if (options !== null && options !== undefined && typeof(options) !== 'object') {
        throw new Error("Invalid parameter 'options' passed.");
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

    // library instance;
    var inst = function (cn) {
        if (!cn) {
            // Cannot instantiate a database with an empty connection;
            throw new Error("Invalid parameter 'cn' passed.");
        }
        return dbInit(cn, options);
    };

    // Namespace for type conversion helpers;
    inst.as = npm.formatting.as;

    // Exposing PG library instance, just for flexibility.
    inst.pg = npm.pg;

    // Terminates pg library; call it when exiting the application.
    inst.end = function () {
        npm.pg.end();
    };

    return inst;
};

// Initializes a database object;
function dbInit(cn, options) {

    var dbInst = {}; // database instance;

    // Resolves a connection object to allow chaining
    // queries under the same (shared) connection;
    dbInst.connect = function () {
        var db = {};

        function cnQuery(query, values, qrm, isRaw) {
            if (!db.client) {
                throw new Error("Cannot execute a query on a disconnected client.");
            }
            return $query(db, query, values, qrm, options, isRaw);
        }

        var self = {
            query: function (query, values, qrm) {
                return cnQuery(query, values, qrm);
            },
            queryRaw: function (query, values) {
                return cnQuery(query, values, null, true);
            },
            done: function () {
                if (!db.client) {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
                db.done();
                db.client = null;
            }
        };
        $extend(self, null, db, options); // extending protocol for an existing connection;
        return $connect(cn)
            .then(function (obj) {
                db.client = obj.client;
                db.done = function () {
                    $notify.disconnect(options, obj.client);
                    obj.done(); // release the connection;
                };
                $notify.connect(options, obj.client);
                return $p.resolve(self);
            });
    };

    function dbQuery(query, values, qrm, isRaw) {
        return $p(function (resolve, reject) {
            $connect(cn)
                .then(function (db) {
                    $notify.connect(options, db.client);
                    $query(db, query, values, qrm, options, isRaw)
                        .then(function (data) {
                            $notify.disconnect(options, db.client);
                            db.done();
                            resolve(data);
                        }, function (reason) {
                            $notify.disconnect(options, db.client);
                            db.done();
                            reject(reason);
                        });
                }, function (reason) {
                    reject(reason); // connection failed;
                });
        });
    }

    dbInst.query = function (query, values, qrm) {
        return dbQuery(query, values, qrm);
    };

    dbInst.queryRaw = function (query, values) {
        return dbQuery(query, values, null, true);
    };

    $extend(dbInst, cn, null, options); // extending database object protocol;
    return dbInst;
}

/////////////////////////////////////////
// Global functions, all start with $
/////////////////////////////////////////

// Simpler promise instantiation;
function $p(func) {
    return new npm.promise(func);
}

// Sequentially resolves dynamic promises returned by a factory;
function $sequence(t, factory) {

    function loop(idx, result) {
        var obj;
        try {
            obj = factory(idx, t); // get next promise;
        } catch (e) {
            return $p.reject(e.message || e);
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
            return loop(++idx, result);
        }, function (reason) {
            return $p.reject(reason);
        });
    }

    return loop(0, []);
}

// Generic query call;
function $query(db, query, values, qrm, options, isRaw) {
    return $p(function (resolve, reject) {
        if (qrm === null || qrm === undefined) {
            qrm = queryResult.any; // default query result;
        } else {
            if (typeof(qrm) !== 'number' || !isFinite(qrm)) {
                qrm = 0; // to let it fail below;
            }
        }
        var errMsg, pgFormatting = (options && options.pgFormatting);
        var params = pgFormatting ? values : undefined;
        var isFunc = query && typeof(query) === 'object' && 'funcName' in query;
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
                            data = result; // queryRaw was called;
                        } else {
                            data = result.rows;
                            var l = result.rows.length;
                            if (l) {
                                if (l > 1 && (qrm & queryResult.one)) {
                                    // one row was expected, but returned multiple;
                                    errMsg = "Single row was expected from the query.";
                                } else {
                                    if (!(qrm & (queryResult.one | queryResult.many))) {
                                        // no data should have been returned;
                                        errMsg = "No return data was expected from the query.";
                                    } else {
                                        if (!(qrm & queryResult.many)) {
                                            data = result.rows[0];
                                        }
                                    }
                                }
                            } else {
                                // no data returned;
                                if (qrm & queryResult.none) {
                                    data = (qrm & queryResult.many) ? [] : null;
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
                reject(errMsg.message || errMsg);
                $notify.error(options, errMsg, {
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
function $connect(cn) {
    return $p(function (resolve, reject) {
        npm.pg.connect(cn, function (err, client, done) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    client: client,
                    done: done
                });
            }
        });
    });
}

// Injects additional methods into an access object,
// thus extending the access protocol.
function $extend(obj, cn, db, options) {

    // Expects no data to be returned;
    obj.none = function (query, values) {
        return obj.query(query, values, queryResult.none);
    };

    // Expects exactly one row of data;
    obj.one = function (query, values) {
        return obj.query(query, values, queryResult.one);
    };

    // Expects one or more rows of data;
    obj.many = function (query, values) {
        return obj.query(query, values, queryResult.many);
    };

    // Expects 0 or 1 row of data;
    obj.oneOrNone = function (query, values) {
        return obj.query(query, values, queryResult.one | queryResult.none);
    };

    // Expects any kind of return data (same as method 'any');
    obj.manyOrNone = function (query, values) {
        return obj.query(query, values, queryResult.many | queryResult.none);
    };

    // Expects any kind of return data (same as method 'manyOrNone');
    obj.any = function (query, values) {
        return obj.query(query, values, queryResult.many | queryResult.none);
    };

    // Query a function with specified Query Result Mask;
    obj.func = function (funcName, values, qrm) {
        return obj.query({
            funcName: funcName
        }, values, qrm);
    };

    // A procedure is expected to return either no rows
    // or one row that represents a list of OUT values;
    obj.proc = function (procName, values) {
        return obj.query({
            funcName: procName
        }, values, queryResult.one | queryResult.none);
    };

    // Transactions support;
    obj.tx = function (p1, p2) {

        // we are giving the option to insert a transaction tag in front
        // of the callback function, for better code readability;
        var tag, cb = p1;
        if (p2 !== undefined) {
            tag = p1;
            cb = p2;
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
                throw new Error("Invalid transaction attachment."); // this should never happen;
            }
            txDB.client = c.client;
            txDB.done = c.done;
            internal = int ? true : false;
            if (internal) {
                $notify.connect(options, txDB.client); // notify of a new connection;
            }
        }

        // connection detachment helper;
        function detach() {
            if (!txDB.client) {
                throw new Error("Invalid transaction detachment."); // this should never happen;
            }
            if (internal) {
                // connection was allocated internally;
                $notify.disconnect(options, txDB.client); // notify of disconnection;
                txDB.done(); // disconnect;
            }
            txDB.client = null;
            txDB.done = null;
        }

        function txQuery(query, values, qrm, isRaw) {
            if (!txDB.client) {
                throw new Error("Unexpected call outside of transaction.");
            }
            return $query(txDB, query, values, qrm, options, isRaw);
        }

        var tx = {
            query: function (query, values, qrm) {
                return txQuery(query, values, qrm);
            },
            queryRaw: function (query, values) {
                return txQuery(query, values, null, true);
            },
            sequence: function (factory) {
                if (typeof(factory) !== 'function') {
                    throw new Error("Invalid factory function specified.");
                }
                return $sequence(tx, factory);
            },
            queue: function (factory) {
                // just an alias for method 'sequence';
                return this.sequence(factory);
            },
            ctx: txDB.ctx
        };
        $extend(tx, null, txDB, options); // extending protocol for an existing connection;
        return $p(function (resolve, reject) {
            if (cn) {
                // connection required;
                $connect(cn)
                    .then(function (obj) {
                        attach(obj, true);
                        return $transact(tx, cb, txDB);
                    }, function (reason) {
                        reject(reason);
                    })
                    .then(function (data) {
                        detach();
                        resolve(data);
                    }, function (reason) {
                        detach();
                        reject(reason);
                    });
            } else {
                // reuse existing connection;
                attach(db);
                return $transact(tx, cb, txDB)
                    .then(function (data) {
                        detach();
                        resolve(data);
                    }, function (reason) {
                        detach();
                        reject(reason);
                    });
            }
        });
    };

    // protocol extensibility support;
    $notify.extend(options, obj);
}

// Implements transaction logic;
function $transact(obj, cb, inst) {

    // callback invocation helper;
    function invoke() {
        if (typeof(cb) !== 'function') {
            return $p.reject("Cannot invoke tx() without a callback function.");
        }
        var result;
        try {
            result = cb(obj); // invoking the callback function;
        } catch (err) {
            $notify.error(inst.options, err, {
                client: inst.client,
                ctx: inst.ctx
            });
            return $p.reject(err.message || err); // reject with the error;
        }
        if (result && typeof(result.then) === 'function') {
            return result; // result is a valid promise object;
        } else {
            // transaction callback is always expected to return a promise object;
            return $p.reject("Callback function passed into tx() didn't return a promise object.");
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
        $notify.transact(inst.options, {
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
    connect: function (options, client) {
        if ($isFunction(options, 'connect')) {
            options.connect(client);
        }
    },
    disconnect: function (options, client) {
        if ($isFunction(options, 'disconnect')) {
            options.disconnect(client);
        }
    },
    query: function (options, context) {
        var errMsg;
        if ($isFunction(options, 'query')) {
            try {
                options.query(context);
            } catch (err) {
                errMsg = err;
            }
        }
        return errMsg;
    },
    transact: function (options, context) {
        if ($isFunction(options, 'transact')) {
            try {
                options.transact(context);
            } catch (err) {
                // have to silence errors here:
                // cannot throw unhandled errors while handling a transaction
                // event, as it will break the transaction's command chain;

                // If you should ever get here, your app is definitely broken;
                console.error("Problem in event 'transact' handler:", err.message || err);
            }
        }
    },
    error: function (options, err, context) {
        if ($isFunction(options, 'error')) {
            try {
                options.error(err.message || err, context);
            } catch (err) {
                // have to silence errors here:
                // throwing unhandled errors while handling an error
                // notification is simply not acceptable.

                // If you should ever get here, your app is definitely broken;
                console.error("Problem in event 'error' handler:", err.message || err);
            }
        }
    },
    extend: function (options, obj) {
        if ($isFunction(options, 'extend')) {
            options.extend(obj);
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
