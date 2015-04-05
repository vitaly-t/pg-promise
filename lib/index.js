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
//    query: function(client, query, params){
//        query is executing;
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

    if (options && options.promiseLib) {
        // alternative promise library specified;
        var lib = options.promiseLib;
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
    inst.as = npm.formatting.wrap;

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
                    return $query(db.client, query, values, qrm, options);
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
        $extendProtocol(self, null, db, options); // extending for an existing connection;
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
                    $query(db.client, query, values, qrm, options)
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
    $extendProtocol(dbInst, cn, null, options); // extending database object;
    return dbInst;
}

/////////////////////////////////////////
// Global functions, all start with $
/////////////////////////////////////////

// Simpler promise instantiation;
var $p = function (func) {
    return new npm.promise(func);
};

// Generic, static query call;
function $query(client, query, values, qrm, options) {
    return $p(function (resolve, reject) {
        if (qrm === null || qrm === undefined) {
            qrm = queryResult.any; // default query result;
        } else {
            if (typeof(qrm) !== 'number') {
                qrm = 0; // to let it fail below;
            }
        }
        var errMsg, pgFormatting = (options && options.pgFormatting);
        if (!query) {
            errMsg = "Invalid query specified.";
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
                }
            }
        }
        if (errMsg) {
            reject(errMsg);
        } else {
            var params = pgFormatting ? values : undefined;
            if (options && options.query) {
                var func = options.query;
                if (typeof(func) !== 'function') {
                    throw new Error("Function was expected for 'options.query'");
                }
                try {
                    func(client, query, params); // notify the client;
                } catch (err) {
                    reject(err);
                    return;
                }
            }
            try {
                client.query(query, params, function (err, result) {
                    if (err) {
                        reject(err.message);
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

// Injects additional methods into an access object;
function $extendProtocol(obj, cn, db, options) {

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
    obj.tx = function (cb) {
        var txDB = {};  // transaction instance;
        var internal;   // internal connection flag;

        // connection attachment helper;
        function attach(obj, int) {
            if (txDB.client) {
                throw new Error("Invalid transaction attachment."); // this should never happen;
            }
            txDB.client = obj.client;
            txDB.done = obj.done;
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
                return $query(txDB.client, query, values, qrm, options);
            }
        };
        $extendProtocol(tx, null, txDB, options); // extending for an existing connection;
        return $p(function (resolve, reject) {
            if (cn) {
                // connection required;
                $connect(cn)
                    .then(function (obj) {
                        attach(obj, true);
                        return $transact(tx, cb);
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
                return $transact(tx, cb)
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
}

// Implements transaction logic;
function $transact(obj, cb) {

    // callback invocation helper;
    function invoke() {
        if (typeof(cb) !== 'function') {
            return $p.reject("Cannot invoke tx() without a callback function.");
        }
        var result;
        try {
            result = cb(obj); // invoking the callback function;
        } catch (err) {
            return $p.reject(err); // reject with the error object;
        }
        if (result && typeof(result.then) === 'function') {
            return result; // result is a valid promise object;
        } else {
            // transaction callback is always expected to return a promise object;
            return $p.reject("Callback function passed into tx() didn't return a valid promise object.");
        }
    }

    var cbData, cbReason, success;
    return $p(function (resolve, reject) {
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
                        } else {
                            reject(cbReason); // reject with callback reason;
                        }
                    }, function (reason) {
                        reject(reason); // either COMMIT or ROLLBACK failed;
                    });
            }, function (reason) {
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
