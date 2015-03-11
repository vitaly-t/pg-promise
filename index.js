// Cannot declare 'use strict' here, because queryResult
// needs to be exported into the global namespace.

var npm; // dynamic package namespace;

///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one + many.
queryResult = {
    one: 1,     // single-row result is expected;
    many: 2,    // multi-row result is expected;
    none: 4,    // no rows expected;
    any: 6      // (default) = many|none = any result.
};

////////////////////////////////////////////////
// Main entry function;
//
// Parameters:
//
// options (optional) -
// {
//    connect: function(client){
//        client has connected;
//        client - pg connection object.
//    },
//
//    disconnect: function(client){
//        client is disconnecting;
//        client - pg connection object.
//    },
//
//    pgFormatting: false,
//      - Redirects query formatting into PG library;
//      - Default is false, and all queries are formatted
//      - within 'pg-promise'.
//
//    promiseLib: null
//      - Overrides the promise library instance used by
//        the library.
// }
module.exports = function (options) {

    if (npm) {
        throw new Error('Cannot initialize the library more than once.');
    } else {
        var promiseLib;
        if (options && options.promiseLib) {
            if (typeof(options.promiseLib) === 'function') {
                promiseLib = options.promiseLib;
            } else {
                throw new Error('Invalid or unsupported promise library override.');
            }
        } else {
            promiseLib = require('promise');
        }
        npm = {
            pg: require('pg'),
            promise: promiseLib
        };
    }

    var lib = function (cn) {
        if (!cn) {
            throw new Error("Invalid 'cn' parameter passed.");
        }
        return dbInit(cn, options);
    };

    // Namespace for type conversion helpers;
    lib.as = $wrap;

    // Exposing PG library instance, just for flexibility.
    lib.pg = npm.pg;

    // Terminates pg library; call it when exiting the application.
    lib.end = function () {
        npm.pg.end();
    };

    return lib;
};

function dbInit(cn, options) {

    var dbInst = {};

    // Returns detached connection instance to allow
    // chaining queries under the same connection.
    dbInst.connect = function () {
        var db;
        var self = {
            query: function (query, values, qrm) {
                if (db) {
                    return $query(db.client, query, values, qrm, options);
                } else {
                    throw new Error("Cannot execute a query on a disconnected client.");
                }
            },
            done: function () {
                if (db) {
                    db.done();
                    db = null;
                } else {
                    throw new Error("Cannot invoke done() on a disconnected client.");
                }
            },
            tx: function (cb) {
                return $transact(self, cb);
            }
        }
        $extendProtocol(self);
        return $connect(cn)
            .then(function (obj) {
                db = {
                    client: obj.client,
                    done: function () {
                        $notify(false, obj, options);
                        obj.done();
                    }
                };
                $notify(true, obj, options);
                return npm.promise.resolve(self);
            });
    };


    //////////////////////////////////////////////////////////////
    // Generic query request;
    // qrm is Query Result Mask, combination of queryResult flags.
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

    dbInst.tx = function (cb) {
        var db;

        function attach(obj) {
            db = obj;
            $notify(true, db, options);
        }

        function detach() {
            $notify(false, db, options);
            db.done();
            db = null;
        }

        var tx = {
            query: function (query, values, qrm) {
                if (!db) {
                    throw new Error("Unexpected call outside of transaction.");
                }
                return $query(db.client, query, values, qrm, options);
            }
        };
        $extendProtocol(tx);
        return $p(function (resolve, reject) {
            $connect(cn)
                .then(function (db) {
                    attach(db);
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
        });
    };

    $extendProtocol(dbInst);

    return dbInst;
}

////////////////////////////////////////////////
// Global, reusable functions, all start with $

// Simpler promise instantiation;
function $p(func) {
    return new npm.promise(func);
}

// Null verification;
function $isNull(val) {
    return typeof(val) === 'undefined' || val === null;
}

// Wraps up text in single quotes;
function $wrapText(text) {
    return "'" + text + "'";
}

// Translates a javascript value into its text presentation,
// according to the type, compatible with PostgreSQL format.
// Returns null, if the value cannot be translated,
// such as: function, array or object (non-date).
// Watch out for a possible 0, not to confuse with null.
function $wrapValue(val) {
    if ($isNull(val)) {
        return 'null';
    }
    switch (typeof(val)) {
        case 'string':
            return $wrap.text(val);
        case 'boolean':
            return $wrap.bool(val);
        case 'function':
            return null; // error
        default:
            if (val instanceof Date) {
                return $wrap.date(val);
            } else {
                return typeof(val) === 'object' ? null : val;
            }
    }
}

// Formats array of javascript-type parameters into a csv list
// to be passed into a function, compatible with PostgreSQL.
// It can understand both a simple value and an array of simple values.
function $formatParams(values) {
    var s = '';
    if (values) {
        if (Array.isArray(values)) {
            for (var i = 0; i < values.length; i++) {
                if (i > 0) {
                    s += ',';
                }
                var v = $wrapValue(values[i]);
                if (v === null) {
                    throw new Error("Cannot convert parameter with index " + i);
                } else {
                    s += v;
                }
            }
        } else {
            // a simple value is presumed;
            s = $wrapValue(values);
            if (s === null) {
                throw new Error("Cannot convert a value of type '" + typeof(values) + "'");
            }
        }
    }
    return s;
}

// Value wrapper to be exposed through 'pgp.as' namespace;
var $wrap = {
    text: function (txt) {
        if ($isNull(txt)) {
            return 'null';
        }
        // replacing single-quote symbols with two of them, and then
        // wrapping in quotes, for compatibility with PostgreSQL.
        return $wrapText(txt.replace(/'/g, "''"));
    },
    bool: function (val) {
        if ($isNull(val)) {
            return 'null';
        }
        return val ? 'TRUE' : 'FALSE';
    },
    date: function (d) {
        if ($isNull(d)) {
            return 'null';
        }
        if (d instanceof Date) {
            return $wrapText(d.toUTCString());
        } else {
            throw new Error($wrapText(d) + " doesn't represent a valid Date object or value.");
        }
    },
    // Creates a comma-separated list of values formatted for use with PostgreSQL;
    csv: function (arr) {
        if ($isNull(arr)) {
            return 'null';
        }
        if (Array.isArray(arr)) {
            return $formatParams(arr);
        } else {
            throw new Error($wrapText(arr) + " doesn't represent a valid Array object or value.");
        }
    },
    // Formats query - parameter using the values passed (simple value or array of simple values);
    // The main reason for exposing this to the client is to make the parser part of auto-testing.
    // The query can contain variables $1, $2, etc, and values is either one simple value or
    // an array of simple values, such as: text, boolean, date, numeric, null.
    format: function (query, values) {
        return $formatValues(query, values);
    }
};

// Formats a proper function call from the parameters.
function $createFuncQuery(funcName, values) {
    return 'select * from ' + funcName + '(' + $formatParams(values) + ');';
}

// Parses query for $1, $2,... variables and
// replaces them with the values passed.
// values can be an array of simple values, or just one value.
function $formatValues(query, values) {
    var q = query;
    var result = {
        success: true
    };
    if (typeof(query) !== 'string') {
        result.success = false;
        result.error = "Parameter 'query' must be a text string.";
    } else {
        if (values) {
            if (Array.isArray(values)) {
                for (var i = 0; i < values.length; i++) {
                    var variable = '$' + (i + 1);
                    if (q.indexOf(variable) === -1) {
                        result.success = false;
                        result.error = "More values passed than variables in the query.";
                        break;
                    } else {
                        var value = $wrapValue(values[i]);
                        if (value === null) {
                            // one of the complex types passed;
                            result.success = false;
                            result.error = "Cannot convert parameter with index " + i;
                            break;
                        } else {
                            var reg = new RegExp("\\" + variable, "g");
                            q = q.replace(reg, value);
                        }
                    }
                }
            } else {
                if (q.indexOf('$1') === -1) {
                    result.success = false;
                    result.error = "No variable found in query to replace with the value passed.";
                } else {
                    var value = $wrapValue(values);
                    if (value === null) {
                        result.success = false;
                        result.error = "Cannot convert type '" + typeof(values) + "' into a query variable value.";
                    } else {
                        q = q.replace(/\$1/g, value);
                    }
                }
            }
        }
    }
    if (result.success) {
        result.query = q;
    }
    return result;
}

// Generic, static query call for the specified connection + query + result.
function $query(client, query, values, qrm, options) {
    return $p(function (resolve, reject) {
        if ($isNull(qrm)) {
            qrm = queryResult.any; // default query result;
        }
        var errMsg, req, pgFormatting = (options && options.pgFormatting);
        if (!query) {
            errMsg = "Invalid query specified.";
        } else {
            var badMask = queryResult.one | queryResult.many;
            if (!qrm || (qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
                errMsg = "Invalid Query Result Mask specified.";
            } else {
                if (pgFormatting) {
                    req = {
                        success: true,
                        query: query
                    };
                } else {
                    req = $formatValues(query, values);
                    if (!req.success) {
                        errMsg = req.error;
                    }
                }
            }
        }
        if (errMsg) {
            reject(errMsg);
        } else {
            var params = pgFormatting ? values : null;
            if (options && options.query) {
                var func = options.query;
                if (typeof(func) !== 'function') {
                    throw new Error("Function was expected for 'options.query'");
                }
                func(client, req.query, params); // notify the client;
            }
            try {
                client.query(req.query, params, function (err, result) {
                    if (err) {
                        reject(err.message);
                    } else {
                        var data = result.rows;
                        var l = result.rows.length;
                        if (l) {
                            if (l > 1 && (qrm & queryResult.one)) {
                                reject("Single row was expected from query: " + req.query);
                            } else {
                                if (!(qrm & (queryResult.one | queryResult.many))) {
                                    reject("No return data was expected from query: " + req.query);
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
                                reject("No rows returned from query: " + req.query);
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
};

// Injects additional methods into an access object.
function $extendProtocol(obj) {

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

    // Expects any kind of return data;
    obj.manyOrNone = function (query, values) {
        return obj.query(query, values, queryResult.many | queryResult.none);
    };

    // Query a function with specified Query Result Mask;
    obj.func = function (funcName, values, qrm) {
        var query = $createFuncQuery(funcName, values);
        return obj.query(query, null, qrm);
    };

    // A procedure is expected to return either no rows
    // or one row that represents a list of OUT values.
    obj.proc = function (procName, values) {
        var query = $createFuncQuery(procName, values);
        return obj.query(query, null, queryResult.one | queryResult.none);
    };
}

function $transact(obj, cb) {
    function invoke() {
        if (typeof(cb) !== 'function') {
            return npm.promise.reject("Cannot invoke tx() without a callback function.");
        }
        var result;
        try {
            result = cb(obj);
        } catch (err) {
            return npm.promise.reject(err);
        }
        if (result && typeof(result.then) === 'function') {
            return result;
        } else {
            return npm.promise.reject("Callback function passed into tx() didn't return a valid promise object.");
        }
    }

    var t_data, t_reason, success;
    return $p(function (resolve, reject) {
        obj.query('begin')
            .then(function () {
                invoke()
                    .then(function (data) {
                        t_data = data;
                        success = true;
                        return obj.query('commit');
                    }, function (reason) {
                        // transaction callback failed;
                        t_reason = reason;
                        success = false;
                        return obj.query('rollback');
                    })
                    .then(function () {
                        if (success) {
                            resolve(t_data);
                        } else {
                            reject(t_reason);
                        }
                    }, function (reason) {
                        reject(reason);
                    });
            }, function (reason) {
                // 'begin' failed;
                reject(reason);
            });
    });
}

// Handles database connection acquire/release
// events, notifying the client as needed.
function $notify(open, db, opt) {
    if (open) {
        if (opt) {
            var func = opt.connect;
            if (func) {
                if (typeof(func) !== 'function') {
                    throw new Error("Function was expected for 'options.connect'");
                }
                func(db.client); // notify the client;
            }
        }
    } else {
        if (opt) {
            var func = opt.disconnect;
            if (func) {
                if (typeof(func) !== 'function') {
                    throw new Error("Function was expected for 'options.disconnect'");
                }
                func(db.client); // notify the client;
            }
        }
    }
}
