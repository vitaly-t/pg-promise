// Cannot declare 'use strict' here, because queryResult
// needs to be exported into the global namespace.

var npm = {
    promise: require('promise'),
    pg: require('pg')
};

//////////////////////////////////////
// Query result mask flags;
//
// NOTE: Cannot combine one + many, while the
// rest of combinations are all supported.
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
// 1. cn (required) - either configuration object or connection string.
//    It is merely passed on to PG and not used by this library.
// 2. options (optional) -
//    {
//       connect: function(client){
//           on-connect event;
//           client - pg connection object.
//       },
//       disconnect: function(client){
//           on-disconnect event;
//           client - pg connection object.
//       }
//    }

module.exports = function (options) {

    var lib = function (cn) {
        if (cn) {
            return dbInit(this, cn, options);
        }else{
            throw new Error("Invalid 'cn' parameter passed.");
        }
    };

    /////////////////////////////////////////////////////////////
    // PG library instance;
    // Exposing it just for flexibility.
    lib.pg = npm.pg;

    ///////////////////////////////////////////////////////////////
    // Terminates pg library; call it when exiting the application.
    lib.end = function(){
        npm.pg.end();
    };

    return lib;
};

function dbInit(dbInst, cn, options) {

    //////////////////////////////////////////////
    // Set of shared functions - all start with $

    // simpler promise instantiation;
    function $p(func) {
        return new npm.promise(func);
    }

    // private function and properties;
    function $isNull(val) {
        return typeof(val) === 'undefined' || val === null;
    }

    function $fixQuotes(val) {
        return val.replace("'", "''");
    }

    function $wrapText(text) {
        return "'" + text + "'";
    }

    function $wrapValue(val) {
        if ($isNull(val)) {
            return 'null';
        }
        switch (typeof(val)) {
            case 'string':
                return dbInst.as.text(val);
            case 'boolean':
                return dbInst.as.bool(val);
            default:
                if (val instanceof Date) {
                    return dbInst.as.date(val);
                } else {
                    return val;
                }
        }
    }

    function $monitor(open, db) {
        if (open) {
            if (options) {
                var func = options.connect;
                if (func) {
                    if (typeof(func) !== 'function') {
                        throw new Error('Function was expected for options.connect');
                    }
                    func(db.client);
                }
            }
        } else {
            if (options) {
                var func = options.disconnect;
                if (func) {
                    if (typeof(func) !== 'function') {
                        throw new Error('Function was expected for options.disconnect');
                    }
                    func(db.client);
                }
            }
            db.done();
        }
    }

    function $formatValues(values) {
        var s = '';
        if (Array.isArray(values) && values.length > 0) {
            for (var i = 0; i < values.length; i++) {
                if (i > 0) {
                    s += ',';
                }
                s += $wrapValue(values[i]);
            }
        }
        return s;
    }

    function $createFuncQuery(funcName, params) {
        return 'select * from ' + funcName + '(' + $formatValues(params) + ');';
    }

    function $query(client, query, qrm) {
        return $p(function (resolve, reject) {
            var badMask = queryResult.one | queryResult.many;
            if ((qrm & badMask) === badMask) {
                reject("Invalid query result mask: one + many");
            } else {
                client.query(query, function (err, result) {
                    if (err) {
                        reject(err.message);
                    } else {
                        var data = result.rows;
                        var l = result.rows.length;
                        if (l) {
                            if (l > 1 && !(qrm & queryResult.many)) {
                                reject("Single row was expected from query: '" + query + "'");
                            } else {
                                if (!(qrm & queryResult.many)) {
                                    data = result.rows[0];
                                }
                            }
                        } else {
                            if (qrm & queryResult.none) {
                                data = null;
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

    /////////////////////////////////////////
    // database instance-related properties;

    // Namespace for type conversion helpers;
    dbInst.as = {
        bool: function (val) {
            if ($isNull(val)) {
                return 'null';
            }
            return val ? 'TRUE' : 'FALSE';
        },
        text: function (val) {
            if ($isNull(val)) {
                return 'null';
            }
            return $wrapText($fixQuotes(val));
        },
        date: function (val) {
            if ($isNull(val)) {
                return 'null';
            }
            if (val instanceof Date) {
                return $wrapText(val.toUTCString());
            } else {
                throw new Error($wrapText(val) + " doesn't represent a valid Date object or value");
            }
        }
    };

    /////////////////////////////////////////////////////////////
    // Connects to the database;
    // The caller must invoke done() after requests are finished.
    dbInst.connect = function () {
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

    //////////////////////////////////////////////////////////////
    // Generic query request;
    // qrm is Query Result Mask, combination of queryResult flags.
    dbInst.query = function (query, qrm) {
        return $p(function (resolve, reject) {
            dbInst.connect()
                .then(function (db) {
                    $monitor(true, db);
                    $query(db.client, query, qrm)
                        .then(function (data) {
                            $monitor(false, db);
                            resolve(data);
                        }, function (reason) {
                            $monitor(false, db);
                            reject(reason);
                        });
                }, function (reason) {
                    reject(reason); // connection failed;
                });
        });
    };

    dbInst.none = function (query) {
        return dbInst.query(query, queryResult.none);
    };

    dbInst.one = function (query) {
        return dbInst.query(query, queryResult.one);
    };

    dbInst.many = function (query) {
        return dbInst.query(query, queryResult.many);
    };

    dbInst.oneOrNone = function (query) {
        return dbInst.query(query, queryResult.one | queryResult.none);
    };

    dbInst.manyOrNone = function (query) {
        return dbInst.query(query, queryResult.many | queryResult.none);
    };

    dbInst.func = function (funcName, params) {
        return dbInst.one($createFuncQuery(funcName, params));
    };

    dbInst.proc = function (procName, params) {
        return dbInst.oneOrNone($createFuncQuery(procName, params));
    };

    // Transaction class;
    dbInst.tx = function () {

        var tx = this;

        var _local = {
            db: null,
            start: function (db) {
                this.db = db;
                $monitor(true, db);
            },
            finish: function () {
                $monitor(false, this.db);
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

        tx.exec = function (cb) {
            if (_local.db) {
                throw new Error("Previous call to tx.exec() hasn't finished.");
            }
            var t_data, t_reason, success;
            return $p(function (resolve, reject) {
                dbInst.connect()
                    .then(function (db) {
                        _local.start(db);
                        return tx.query('begin', queryResult.none);
                    }, function (reason) {
                        reject(reason); // connection issue;
                    })
                    .then(function () {
                        _local.call(cb)
                            .then(function (data) {
                                t_data = data;
                                success = true;
                                return tx.query('commit', queryResult.none);
                            }, function (reason) {
                                t_reason = reason;
                                success = false;
                                return tx.query('rollback', queryResult.none);
                            })
                            .then(function () {
                                _local.finish();
                                // either commit or rollback successfully executed;
                                if (success) {
                                    resolve(t_data);
                                } else {
                                    reject(t_reason);
                                }
                            }, function (reason) {
                                // either commit or rollback failed;
                                _local.finish();
                                reject(reason);
                            });
                    }, function (reason) {
                        _local.finish();
                        reject(reason); // issue with 'begin' command;
                    });
            });
        };

        tx.query = function (query, qrm) {
            if (!_local.db) {
                throw new Error('Unexpected call outside of transaction');
            }
            return $query(_local.db.client, query, qrm);
        };

        tx.none = function (query) {
            return tx.query(query, queryResult.none);
        };

        tx.one = function (query) {
            return tx.query(query, queryResult.one);
        };

        tx.many = function (query) {
            return tx.query(query, queryResult.many);
        };

        tx.oneOrNone = function (query) {
            return tx.query(query, queryResult.one | queryResult.none);
        };

        tx.manyOrNone = function (query) {
            return tx.query(query, queryResult.many | queryResult.none);
        };

        tx.func = function (funcName, params) {
            return tx.one($createFuncQuery(funcName, params));
        };

        tx.proc = function (procName, params) {
            return tx.oneOrNone($createFuncQuery(procName, params));
        };
    };
}
