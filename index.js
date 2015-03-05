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
module.exports = function (cn, options) {

    if (!cn) {
        throw new Error("Invalid 'cn' parameter passed.");
    }

    // simpler promise instantiation;
    var $p = function (func) {
        return new npm.promise(func);
    };

    var $self = {

        /////////////////////////////////////////////////////////////
        // PG library instance;
        // Exposing it just for flexibility.
        pg: npm.pg,

        /////////////////////////////////////////////////////////////
        // Connects to the database;
        // The caller must invoke done() after requests are finished.
        connect: function () {
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
        },

        ///////////////////////////////////////////////////////////////
        // Terminates pg library; call it when exiting the application.
        end: function () {
            npm.pg.end();
        },

        //////////////////////////////////////////////////////////////
        // Generic query request;
        // qrm is Query Result Mask, combination of queryResult flags.
        query: function (query, qrm) {
            return $p(function (resolve, reject) {
                $self.connect()
                    .then(function (db) {
                        _global.monitor(true, db);
                        _global.query(db.client, query, qrm)
                            .then(function (data) {
                                _global.monitor(false, db);
                                resolve(data);
                            }, function (reason) {
                                _global.monitor(false, db);
                                reject(reason);
                            });
                    }, function (reason) {
                        reject(reason); // connection failed;
                    });
            });
        },

        none: function (query) {
            return this.query(query, queryResult.none);
        },

        one: function (query) {
            return this.query(query, queryResult.one);
        },

        many: function (query) {
            return this.query(query, queryResult.many);
        },

        oneOrNone: function (query) {
            return this.query(query, queryResult.one | queryResult.none);
        },

        manyOrNone: function (query) {
            return this.query(query, queryResult.many | queryResult.none);
        },

        func: function (funcName, params) {
            return this.one(_global.createFuncQuery(funcName, params));
        },

        proc: function (procName, params) {
            return this.oneOrNone(_global.createFuncQuery(procName, params));
        },

        // Namespace for type conversion helpers;
        as: {
            bool: function (val) {
                if (_global.isNull(val)) {
                    return 'null';
                }
                return val ? 'TRUE' : 'FALSE';
            },
            text: function (val) {
                if (_global.isNull(val)) {
                    return 'null';
                }
                return _global.wrapText(_global.fixQuotes(val));
            },
            date: function (val) {
                if (_global.isNull(val)) {
                    return 'null';
                }
                if (val instanceof Date) {
                    return _global.wrapText(val.toUTCString());
                } else {
                    throw new Error(_global.wrapText(val) + " doesn't represent a valid Date object or value");
                }
            }
        },

        // Transaction class;
        tx: function () {

            var tx = this;

            var _local = {
                db: null,
                start: function (db) {
                    this.db = db;
                    _global.monitor(true, db);
                },
                finish: function () {
                    _global.monitor(false, this.db);
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
                    throw new Error('Cannot execute an unfinished transaction');
                }
                var t_data, t_reason, success;
                return $p(function (resolve, reject) {
                    $self.connect()
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
                return _global.query(_local.db.client, query, qrm);
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
                return tx.one(_global.createFuncQuery(funcName, params));
            };

            tx.proc = function (procName, params) {
                return tx.oneOrNone(_global.createFuncQuery(procName, params));
            };
        }
    };

    var _global = {
        options: options,
        isNull: function (val) {
            return typeof(val) === 'undefined' || val === null;
        },
        fixQuotes: function (val) {
            return val.replace("'", "''");
        },
        wrapText: function (text) {
            return "'" + text + "'";
        },
        wrapValue: function (val) {
            if (this.isNull(val)) {
                return 'null';
            }
            switch (typeof(val)) {
                case 'string':
                    return $self.as.text(val);
                case 'boolean':
                    return $self.as.bool(val);
                default:
                    if (val instanceof Date) {
                        return $self.as.date(val);
                    } else {
                        return val;
                    }
            }
        },
        monitor: function (open, db) {
            if (open) {
                if (this.options) {
                    var func = this.options.connect;
                    if (func) {
                        if (typeof(func) !== 'function') {
                            throw new Error('Function was expected for options.connect');
                        }
                        func(db.client);
                    }
                }
            } else {
                if (this.options) {
                    var func = this.options.disconnect;
                    if (func) {
                        if (typeof(func) !== 'function') {
                            throw new Error('Function was expected for options.disconnect');
                        }
                        func(db.client);
                    }
                }
                db.done();
            }
        },
        formatValues: function (values) {
            var s = '';
            if (Array.isArray(values) && values.length > 0) {
                for (var i = 0; i < values.length; i++) {
                    if (i > 0) {
                        s += ',';
                    }
                    s += this.wrapValue(values[i]);
                }
            }
            return s;
        },
        createFuncQuery: function (funcName, params) {
            return 'select * from ' + funcName + '(' + this.formatValues(params) + ');';
        },
        query: function (client, query, qrm) {
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
    };

    return $self;
};
