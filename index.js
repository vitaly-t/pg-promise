// Cannot declare 'use strict' here, because queryResult
// needs to be exported into the global namespace.

var npm = {
    promise: require('promise'),
    pg: require('pg')
};

///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one + many.
queryResult = {
    one: 1,     // single-row result is expected;
    many: 2,    // multi-row result is expected;
    none: 4     // no rows expected.
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
//    disconnect: function(client){
//        client is disconnecting;
//        client - pg connection object.
//    }
// }
module.exports = function (options) {

    var lib = function (cn) {
        if (!$isEmptyObject(this)) {
            // This makes it easy to locate the most common mistake -
            // skipping keyword 'new' when calling: var db = new pgp(cn);
            throw new Error("Invalid database object instantiation.");
        }
        if (!cn) {
            throw new Error("Invalid 'cn' parameter passed.");
        }
        return dbInit(this, cn, options);
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

function dbInit(dbInst, cn, options) {

    // Detached connection instance to allow chaining
    // queries under the same connection.
    dbInst.connect = function () {
        return new $Connection(cn, options);
    };

    //////////////////////////////////////////////////////////////
    // Generic query request;
    // qrm is Query Result Mask, combination of queryResult flags.
    dbInst.query = function (query, values, qrm) {
        return $p(function (resolve, reject) {
            $connect(cn)
                .then(function (db) {
                    $notify(true, db, options);
                    $query(db.client, query, values, qrm)
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

    $extendProtocol(dbInst);

    //////////////////////////
    // Transaction class;
    dbInst.tx = function () {

        var tx = this;

        if (!$isEmptyObject(tx)) {
            // This makes it easy to locate the most common mistake -
            // skipping keyword 'new' when calling: var tx = new db.tx(cn);
            throw new Error("Invalid transaction object instantiation.");
        }

        var local = {
            db: null,
            start: function (db) {
                this.db = db;
                $notify(true, db, options);
            },
            finish: function () {
                $notify(false, this.db, options);
                this.db.done();
                this.db = null;
            },
            call: function (cb) {
                if (typeof(cb) !== 'function') {
                    return npm.promise.reject("Cannot invoke tx.exec() without a callback function.");
                }
                var result = cb(this.db.client);
                if (result && typeof(result.then) === 'function') {
                    return result;
                } else {
                    return npm.promise.reject("Callback function passed into tx.exec() didn't return a valid promise object.");
                }
            }
        };

        // Executes transaction;
        tx.exec = function (cb) {
            if (local.db) {
                throw new Error("Previous call to tx.exec() hasn't finished.");
            }
            var t_data, t_reason, success;
            return $p(function (resolve, reject) {
                $connect(cn)
                    .then(function (db) {
                        local.start(db);
                        return tx.query('begin');
                    }, function (reason) {
                        reject(reason); // connection issue;
                    })
                    .then(function () {
                        local.call(cb)
                            .then(function (data) {
                                t_data = data;
                                success = true;
                                return tx.query('commit');
                            }, function (reason) {
                                t_reason = reason;
                                success = false;
                                return tx.query('rollback');
                            })
                            .then(function () {
                                local.finish();
                                // either commit or rollback successfully executed;
                                if (success) {
                                    resolve(t_data);
                                } else {
                                    reject(t_reason);
                                }
                            }, function (reason) {
                                // either commit or rollback failed;
                                local.finish();
                                reject(reason);
                            });
                    }, function (reason) {
                        local.finish();
                        reject(reason); // issue with 'begin' command;
                    });
            });
        };

        tx.query = function (query, values, qrm) {
            if (!local.db) {
                throw new Error("Unexpected call outside of transaction.");
            }
            return $query(local.db.client, query, values, qrm);
        };

        $extendProtocol(tx);
    };
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

// Checks if the object is empty (has no properties);
function $isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

// Fixes single-quote symbols in text fields;
function $fixQuotes(val) {
    return val.replace("'", "''");
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

// Formats array of javascript-type values into a list of
// parameters for a function call, compatible with PostgreSQL.
// It can understand both a simple value and an array of simple values.
function $formatValues(values) {
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
                throw new Error("Cannot convert the value of type '" + typeof(values) + "'");
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
        return $wrapText($fixQuotes(txt));
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
    csv: function (arr) {
        if ($isNull(arr)) {
            return 'null';
        }
        if (Array.isArray(arr)) {
            return $formatValues(arr);
        } else {
            throw new Error($wrapText(arr) + " doesn't represent a valid Array object or value.");
        }
    }
};

// Formats a proper function call from the parameters.
function $createFuncQuery(funcName, values) {
    return 'select * from ' + funcName + '(' + $formatValues(values) + ');';
}

// Parses query for $1, $2,... variables and
// replaces them with the values passed.
// values can be an array of simple values, or just one value.
function $parseValues(query, values) {
    var q = query;
    var result = {
        success: true
    };
    if (values) {
        if (Array.isArray(values) && values.length > 0) {
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
                        q = q.replace(variable, value);
                    }
                }
            }
        } else {
            var variable = '$1';
            if (q.indexOf(variable) === -1) {
                result.success = false;
                result.error = "No variable found in query to replace with the value passed.";
            } else {
                var value = $wrapValue(values);
                if (value === null) {
                    result.success = false;
                    result.error = "Cannot convert type '" + typeof(values) + "' into a query variable value.";
                } else {
                    q = q.replace(variable, value);
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
function $query(client, query, values, qrm) {
    return $p(function (resolve, reject) {
        if ($isNull(qrm)) {
            qrm = queryResult.many | queryResult.none; // default query result;
        }
        var errMsg, req;
        if (!query) {
            errMsg = "Invalid query specified.";
        } else {
            var badMask = queryResult.one | queryResult.many;
            if (!qrm || (qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
                errMsg = "Invalid Query Result Mask specified.";
            } else {
                req = $parseValues(query, values);
                if (!req.success) {
                    errMsg = req.error;
                }
            }
        }
        if (errMsg) {
            reject(errMsg);
        } else {
            client.query(req.query, function (err, result) {
                if (err) {
                    reject(err.message);
                } else {
                    var data = result.rows;
                    var l = result.rows.length;
                    if (l) {
                        if (l > 1 && (qrm & queryResult.one)) {
                            reject("Single row was expected from query: '" + query + "'");
                        } else {
                            if (!(qrm & (queryResult.one | queryResult.many))) {
                                reject("No return data was expected from query: '" + query + "'");
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
                            reject("No rows returned from query: '" + query + "'");
                        }
                    }
                    resolve(data);
                }
            });
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

// Initializes a new connection instance;
function $Connection(cn, options) {
    var db, self = this;
    self.query = function (query, values, qrm) {
        return $query(db.client, query, values, qrm);
    };
    self.done = function () {
        db.done();
    };
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
