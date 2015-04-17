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
    one: 1,  // single-row result is expected;
    many: 2,  // multi-row result is expected;
    none: 4,  // no rows expected;
    any: 6   // (default) = many|none = any result.
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
//        error executing the query;
//    },
//
//    transact: function(e){
//        transaction start/finish;
//    },
//
//    extend: function(obj){
//        extending the protocol;
//    },
//
//    pgFormatting: false,
//      - Redirects query formatting into PG library;
//      - Default is false, and all queries are formatted within 'pg-promise'.
//
//    promiseLib: null
//      - Overrides the promise library to be used.
// }
module.exports = function (options) {

    var lib = options ? options.promiseLib : null;
    if (lib) {
        // alternative promise library specified;
        var t = typeof(lib);
        if (t === 'function' || t === 'object') {
            // 'Promise' object is supported by libraries: bluebird, when, q, lie, rsvp.
            // And our default library 'promise' uses its main function instead:
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
            throw new Error("Invalid 'cn' parameter passed.");
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
        var self = {
            query: function (query, values, qrm) {
                if (db.client) {
                    return $query(db, query, values, qrm, options);
                } else {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
            },
            done: function () {
                if (db.client) {
                    db.done();
                    db.client = null;
                } else {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
            }
        };
        $extend(self, null, db, options); // extending for an existing connection;
        return $connect(cn)
            .then(function (obj) {
                db.client = obj.client;
                db.done = function () {
                    $notify(false, obj, options); // notify of disconnection;
                    obj.done(); // release the connection;
                };
                $notify(true, obj, options); // notify of a new connection;
                return $p.resolve(self);
            });
    };

    // generic query method;
    dbInst.query = function (query, values, qrm) {
        return $p(function (resolve, reject) {
            $connect(cn)
                .then(function (db) {
                    $notify(true, db, options);
                    $query(db, query, values, qrm, options)
                        .then(function (data) {
                            $notify(false, db, options);
                            db.done();
                            resolve(data);
                        }, function (reason) {
                            $notify(false, db, options);
                            db.done();
                            reject(reason);
                        });
                }, function (reason) {
                    reject(reason); // connection failed;
                });
        });
    };
    $extend(dbInst, cn, null, options); // extending database object;
    return dbInst;
}

/////////////////////////////////////////
// Global functions, all start with $
/////////////////////////////////////////

// Simpler promise instantiation;
function $p(func) {
    return new npm.promise(func);
}

// Generic, static query call;
function $query(db, query, values, qrm, options) {
    return $p(function (resolve, reject) {
        if (qrm === null || qrm === undefined) {
            qrm = queryResult.any; // default query result;
        } else {
            if (typeof(qrm) !== 'number') {
                qrm = 0; // to let it fail below;
            }
        }
        var errMsg, pgFormatting = (options && options.pgFormatting);
        if (typeof(query) !== 'string') {
            errMsg = "Parameter 'query' must be a text string.";
        } else {
            var badMask = queryResult.one | queryResult.many; // the combination isn't supported;
            if ((qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
                errMsg = "Invalid Query Result Mask specified.";
            } else {
                if (!pgFormatting) {
                    // use 'pg-promise' implementation of parameter formatting;
                    try {
                        query = npm.formatting.formatQuery(query, values);
                    } catch (err) {
                        errMsg = err.message;
                    }
                    if (errMsg) {
                        $notifyError(errMsg, options, {
                            client: db.client,
                            query: query,
                            params: values,
                            ctx: db.ctx
                        });
                    }
                }
            }
        }
        if (errMsg) {
            reject(errMsg);
        } else {
            var params = pgFormatting ? values : undefined;
            var func = options ? options.query : null;
            if (func) {
                if (typeof(func) !== 'function') {
                    throw new Error("Function was expected for 'options.query'");
                }
                try {
                    func({
                        client: db.client,
                        query: query,
                        params: params,
                        ctx: db.ctx
                    });
                } catch (err) {
                    reject(err);
                    return;
                }
            }
            try {
                db.client.query(query, params, function (err, result) {
                    if (err) {
                        $notifyError(err, options, {
                            client: db.client,
                            query: query,
                            params: params,
                            ctx: db.ctx
                        });
                        reject(err.message || err);
                    } else {
                        var data = result.rows;
                        var l = result.rows.length;
                        if (l) {
                            if (l > 1 && (qrm & queryResult.one)) {
                                reject("Single row was expected from query: " + query);
                            } else {
                                if (!(qrm & (queryResult.one | queryResult.many))) {
                                    reject("No return data was expected from query: " + query);
                                } else {
                                    if (!(qrm & queryResult.many)) {
                                        data = result.rows[0];
                                    }
                                }
                            }
                        } else {
                            if (qrm & queryResult.none) {
                                data = (qrm & queryResult.many) ? [] : null;
                            } else {
                                reject("No rows returned from query: " + query);
                            }
                        }
                        resolve(data);
                    }
                });
            } catch (err) {
                // Not likely to ever get here, but just in case;
                reject(err);
            }
        }
    });
}

// Connects to the database;
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
        var query = npm.formatting.funcQuery(funcName, values);
        return obj.query(query, undefined, qrm);
    };

    // A procedure is expected to return either no rows
    // or one row that represents a list of OUT values;
    obj.proc = function (procName, values) {
        var query = npm.formatting.funcQuery(procName, values);
        return obj.query(query, undefined, queryResult.one | queryResult.none);
    };

    // Transactions support;
    obj.tx = function (p1, p2) {

        // we are giving the option to specify transaction name in front
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
                $notify(true, txDB, options); // notify of a new connection;
            }
        }

        // connection detachment helper;
        function detach() {
            if (!txDB.client) {
                throw new Error("Invalid transaction detachment."); // this should never happen;
            }
            if (internal) {
                // connection was allocated;
                $notify(false, txDB, options); // notify of disconnection;
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
                return $query(txDB, query, values, qrm, options);
            },
            ctx: txDB.ctx
        };
        $extend(tx, null, txDB, options); // extending for an existing connection;
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

    // protocol extensibility feature;
    var ext = options ? options.extend : null;
    if (ext) {
        if (typeof(ext) !== 'function') {
            throw new Error("Function was expected for 'options.extend'");
        }
        ext(obj); // let the client extend the protocol;
    }
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
            $notifyError(err, inst.options, {
                client: inst.client,
                ctx: inst.ctx
            });
            return $p.reject(err.message || err); // reject with the error;
        }
        if (result && typeof(result.then) === 'function') {
            return result; // result is a valid promise object;
        } else {
            // transaction callback is always expected to return a promise object;
            return $p.reject("Callback function passed into tx() didn't return a valid promise object.");
        }
    }

    // updates the transaction context and notifies the client;
    function txUpdate(start, success, result) {
        var c = inst.ctx;
        if (start) {
            c.start = new Date();
            delete c.finish;
            delete c.success;
            delete c.result;
        } else {
            c.finish = new Date();
            c.success = success;
            c.result = result;
        }
        var func = inst.options ? inst.options.transact : null;
        if (func) {
            if (typeof(func) !== 'function') {
                throw new Error("Function was expected for 'options.transact'");
            }
            try {
                func({
                    client: inst.client,
                    ctx: c
                });
            } catch (err) {
                // have to silence errors here;
            }
        }
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
                            txUpdate(false, true, cbData);
                            resolve(cbData); // resolve with callback data;
                        } else {
                            txUpdate(false, false, cbReason);
                            reject(cbReason); // reject with callback reason;
                        }
                    }, function (reason) {
                        txUpdate(false, false, reason);
                        reject(reason); // either COMMIT or ROLLBACK failed;
                    });
            }, function (reason) {
                txUpdate(false, false, reason);
                reject(reason); // BEGIN failed;
            });
    });
}

// Handles database connection acquire/release events,
// notifying the client as needed.
function $notify(open, db, opt) {
    if (opt) {
        var func = open ? opt.connect : opt.disconnect;
        if (func) {
            if (typeof(func) === 'function') {
                func(db.client);
            } else {
                throw new Error("Function was expected for 'options." + (open ? "connect'" : "disconnect'"));
            }
        }
    }
}

// Notifies of an error from a query or transaction;
function $notifyError(err, options, e) {
    var func = options ? options.error : null;
    if (func) {
        if (typeof(func) !== 'function') {
            throw new Error("Function was expected for 'options.error'");
        }
        try {
            func(err.message || err, e); // notify the client;
        } catch (err) {
            // have to silence errors here;
        }
    }
}
