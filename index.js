'use strict';

var npm = {
    promise: require('promise'),
    pg: require('pg')
};

var queryResult = {
    one: 1,
    many: 2,
    none: 4
};

exports.PGPromise = function (config, options) {

    if (!config) {
        throw new Error("Invalid 'config' parameter passed.");
    }

    // IMPORTANT: The caller must invoke done() and then client.end() when finished.
    this.connect = function () {
        return $p(function (resolve, reject) {
            npm.pg.connect(config, function (err, client, done) {
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

    // Simple query, with opening and closing connection;
    this.query = function (query, qr) {
        return $p(function (resolve, reject) {
            $self.connect()
                .then(function (db) {
                    $prop.monitor(true, db);
                    $prop.query(db.client, query, qr)
                        .then(function (data) {
                            $prop.monitor(false, db);
                            resolve(data);
                        }, function (reason) {
                            $prop.monitor(false, db);
                            reject(reason);
                        });
                }, function (reason) {
                    reject(reason); // connection failed;
                });
        });
    };

    this.none = function (query) {
        return this.query(query, queryResult.none);
    };

    this.one = function (query) {
        return this.query(query, queryResult.one);
    };

    this.many = function (query) {
        return this.query(query, queryResult.many);
    };

    this.oneOrNone = function (query) {
        return this.query(query, queryResult.one | queryResult.none);
    };

    this.manyOrNone = function (query) {
        return this.query(query, queryResult.many | queryResult.none);
    };

    this.func = function (funcName, params) {
        return this.one($prop.createFuncQuery(funcName, params));
    };

    this.proc = function (procName, params) {
        return this.oneOrNone($prop.createFuncQuery(procName, params));
    };

    this.as = {
        bool: function (val) {
            if ($prop.isNull(val)) {
                return 'null';
            }
            return val ? 'TRUE' : 'FALSE';
        },
        text: function (val) {
            if ($prop.isNull(val)) {
                return 'null';
            }
            return $prop.wrapText($prop.fixQuotes(val));
        },
        date: function (val) {
            if ($prop.isNull(val)) {
                return 'null';
            }
            if (val instanceof Date) {
                return $prop.wrapText(val.toUTCString());
            } else {
                throw new Error($prop.wrapText(val) + " doesn't represent a valid Date object or value");
            }
        }
    };

    // new promise initializer;
    var $p = function (func) {
        return new npm.promise(func);
    };

    // self-pointer;
    var $self = this;

    // private properties and functions;
    var $prop = {
        options: options,
        cnCounter: 0, // internal connection counter;
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
                this.cnCounter++;
                if (this.options) {
                    var func = this.options.connect;
                    if (func) {
                        if (typeof(func) !== 'function') {
                            throw new Error('Function was expected for options.connect');
                        }
                        func(this.cnCounter, db.client);
                    }
                }
            } else {
                this.cnCounter--;
                if (this.options) {
                    var func = this.options.disconnect;
                    if (func) {
                        if (typeof(func) !== 'function') {
                            throw new Error('Function was expected for options.disconnect');
                        }
                        func(this.cnCounter, db.client);
                    }
                }
                db.done();
                if (this.cnCounter === 0) {
                    db.client.end();
                }
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
        query: function (client, query, qr) {
            return $p(function (resolve, reject) {
                client.query(query, function (err, result) {
                    if (err) {
                        reject(err.message);
                    } else {
                        var data = result.rows;
                        var l = result.rows.length;
                        if (l) {
                            if (l > 1 && !(qr & queryResult.many)) {
                                reject('Single record was expected from query: ' + query);
                            } else {
                                if (!(qr & queryResult.many)) {
                                    data = result.rows[0];
                                }
                            }
                        } else {
                            if (qr & queryResult.none) {
                                data = null;
                            } else {
                                reject('No records returned from query: ' + query);
                            }
                        }
                        resolve(data);
                    }
                });
            });
        }
    };

    this.tx = function () {

        var tx = this;

        tx.exec = function (cb) {
            if (tx.$prop.db) {
                throw new Error('Cannot execute an unfinished transaction');
            }
            var t_data, t_reason, success;
            return $p(function (resolve, reject) {
                $self.connect()
                    .then(function (db) {
                        tx.$prop.start(db);
                        return tx.query('begin', queryResult.none);
                    }, function (reason) {
                        reject(reason); // connection issue;
                    })
                    .then(function () {
                        tx.$prop.call(cb)
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
                                tx.$prop.finish();
                                // either commit or rollback successfully executed;
                                if (success) {
                                    resolve(t_data);
                                } else {
                                    reject(t_reason);
                                }
                            }, function (reason) {
                                // either commit or rollback failed;
                                tx.$prop.finish();
                                reject(reason);
                            });
                    }, function (reason) {
                        tx.$prop.finish();
                        reject(reason); // issue with 'begin' command;
                    });
            });
        };

        tx.query = function (query, qr) {
            if (!tx.$prop.db) {
                throw new Error('Unexpected call outside of transaction');
            }
            return $prop.query(tx.$prop.db.client, query, qr);
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
            return tx.one($prop.createFuncQuery(funcName, params));
        };

        tx.proc = function (procName, params) {
            return tx.oneOrNone($prop.createFuncQuery(procName, params));
        };

        // private properties;
        tx.$prop = {
            db: null,
            start: function (db) {
                this.db = db;
                $prop.monitor(true, db);
            },
            finish: function () {
                $prop.monitor(false, this.db);
                this.db = null;
            },
            call: function(cb){
                var result = cb(this.db.client);
                if(result && typeof(result.then) === 'function'){
                    return result;
                }else{
                    return npm.promise.reject("Callback function passed into tx.exec() didn't return a valid promise object.");
                }
            }
        };
    };
};
