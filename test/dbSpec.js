var promise = require('bluebird');
var pgResult = require('pg/lib/result');

var options = {}; // options, if needed;

var dbHeader = require('./db/header')(options);

var pgp = dbHeader.pgp;
var db = dbHeader.db;

describe("Database Instantiation", function () {
    it("must throw an error when empty or no connection passed", function () {
        var err = "Invalid parameter 'cn' specified.";
        expect(pgp).toThrow(err);
        expect(function () {
            pgp(null);
        }).toThrow(err);
        expect(function () {
            pgp("");
        }).toThrow(err);
    });
    var testDB = pgp("invalid connection details");
    it("must return a valid, though non-connectible object", function () {
        expect(typeof(testDB)).toBe('object');
    });
});

describe("Connection", function () {
    it("must be successful for default parameters", function () {
        var status = 'connecting';
        var error;
        db.connect()
            .then(function (obj) {
                status = 'success';
                obj.done(); // release connection;
            }, function (reason) {
                error = reason;
                status = 'failed';//reason.error;
            })
            .catch(function (err) {
                error = err;
                status = 'failed';
            });
        waitsFor(function () {
            return status !== 'connecting';
        }, "Connection timed out", 5000);
        runs(function () {
            expect(status).toBe('success');
            expect(error).toBeUndefined();
        });
    });

    it("must provide functioning context for queries", function () {
        var result, sco;
        db.connect()
            .then(function (obj) {
                sco = obj;
                return sco.one("select count(*) from users");
            }, function (reason) {
                result = null;
                return promise.reject(reason);
            })
            .then(function (data) {
                result = data;
            }, function () {
                result = null;
            })
            .done(function () {
                if (sco) {
                    sco.done();
                }
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Connection timed out", 5000);
        runs(function () {
            expect(result).toBeDefined();
            expect(result.count > 0).toBe(true);
            expect(typeof(sco.tx)).toBe('function'); // just a protocol check;
        });
    });

    it("must provide functioning context for raw queries", function () {
        var result, sco;
        db.connect()
            .then(function (obj) {
                sco = obj;
                return sco.raw("select * from users");
            }, function (reason) {
                result = null;
                return promise.reject(reason);
            })
            .then(function (data) {
                result = data;
            }, function () {
                result = null;
            })
            .done(function () {
                if (sco) {
                    sco.done();
                }
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Connection timed out", 5000);
        runs(function () {
            expect(result instanceof pgResult);
            expect(result.rows.length > 0).toBe(true);
            expect(typeof(result.rowCount)).toBe('number');
            expect(result.rows.length === result.rowCount).toBe(true);
        });
    });

    it("must report the right error on invalid server name", function () {
        var errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.host = 'unknown';
        var dbErr = pgp(errCN), result;
        dbErr.connect()
            .then(function () {
                result = null;
            }, function (error) {
                result = error;

            });
        waitsFor(function () {
            return result !== undefined;
        }, "Connection timed out", 60000);
        runs(function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toContain('getaddrinfo ENOTFOUND');
        });
    });

    it("must report the right error on invalid port", function () {
        var errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.port = '12345';
        var dbErr = pgp(errCN), result;
        dbErr.connect()
            .then(function () {
                result = null;
            }, function (error) {
                result = error;

            });
        waitsFor(function () {
            return result !== undefined;
        }, "Connection timed out", 60000);
        runs(function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toContain('connect ECONNREFUSED');
        });
    });

    /*
     The following three tests cannot pass because of a bug in node-postgres:
     https://github.com/brianc/node-postgres/issues/746
     Once the issue has been resolved, these tests should be able to pass.
     In the meantime, they cause an unhandled error that kills the test framework.
     */

    /*
     it("must report the right error on invalid connection", function () {
     var dbErr = pgp('bla-bla'), result;
     dbErr.connect()
     .then(function () {
     result = null;
     }, function (error) {
     result = error;
     });
     waitsFor(function () {
     return result !== undefined;
     }, "Connection timed out", 60000);
     runs(function () {
     expect(result instanceof Error).toBe(true);
     expect(result.message).toBe('password authentication failed for user "' + pgp.pg.defaults.user + '"');
     });
     });

     it("must report the right error on invalid user name", function () {
     var errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
     errCN.user = 'somebody';
     var dbErr = pgp(errCN), result;
     dbErr.connect()
     .then(function () {
     result = null;
     }, function (error) {
     result = error;

     });
     waitsFor(function () {
     return result !== undefined;
     }, "Connection timed out", 60000);
     runs(function () {
     expect(result instanceof Error).toBe(true);
     expect(result.message).toBe('password authentication failed for user "somebody"');
     });
     });

     it("must report the right error on invalid password", function () {
     var errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
     errCN.password = 'invalid';
     var dbErr = pgp(errCN), result;
     dbErr.connect()
     .then(function () {
     result = null;
     }, function (error) {
     result = error;

     });
     waitsFor(function () {
     return result !== undefined;
     }, "Connection timed out", 60000);
     runs(function () {
     expect(result instanceof Error).toBe(true);
     expect(result.message).toBe('password authentication failed for user "postgres"');
     });
     });
     */

});

describe("Selecting one static value", function () {

    it("must return the value via property", function () {
        var result, error;
        db.one('select 123 as value')
            .then(function (data) {
                result = data;
            }, function (reason) {
                error = reason;
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBeUndefined();
            expect(typeof(result)).toBe('object');
            expect(result.value).toBe(123);
        });
    });
});

describe("Executing method query", function () {

    it("with invalid query as parameter must throw an error", function () {
        var finished, result, error = "Parameter 'query' must be a non-empty text string.";
        promise.any([
            db.query(),
            db.query(''),
            db.query('   '),
            db.query(1),
            db.query(null)])
            .then(function () {
                finished = true;
            }, function (reason) {
                result = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result.length).toBe(5);
            expect(result[0]).toBe(error);  // reject to an undefined query;
            expect(result[1]).toBe(error);  // reject to an empty-string query;
            expect(result[2]).toBe(error);  // reject to a white-space query string;
            expect(result[3]).toBe(error);  // reject to an invalid-type query;
            expect(result[4]).toBe(error);  // reject to a null query;
        });
    });

    it("with invalid qrm as parameter must throw an error", function () {
        var finished, result, error = "Invalid Query Result Mask specified.";
        promise.any([
            db.query('something', undefined, ''),
            db.query('something', undefined, -1),
            db.query('something', undefined, 0),
            db.query('something', undefined, 100),
            db.query('something', undefined, NaN),
            db.query('something', undefined, 1 / 0),
            db.query('something', undefined, -1 / 0)])
            .then(function () {
                finished = true;
            }, function (reason) {
                result = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result.length).toBe(7);
            expect(result[0]).toBe(error);  // reject for the wrong data type;
            expect(result[1]).toBe(error);  // reject for -1;
            expect(result[2]).toBe(error);  // reject for 0;
            expect(result[3]).toBe(error);  // reject a large positive number;
            expect(result[4]).toBe(error);  // reject for a NaN;
            expect(result[5]).toBe(error);  // reject for Infinity;
            expect(result[6]).toBe(error);  // reject for -Infinity;
        });
    });

});

describe("Executing an invalid function", function () {

    it("must reject with an error", function () {
        var finished, result, error = "Function name must be a non-empty text string.";
        promise.any([
            db.func(),
            db.func(''),
            db.func('   '),
            db.func(1),
            db.func(null)])
            .then(function () {
                finished = true;
            }, function (reason) {
                result = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result.length).toBe(5);
            expect(result[0]).toBe(error);  // reject to an undefined function name;
            expect(result[1]).toBe(error);  // reject to an empty-string function name;
            expect(result[2]).toBe(error);  // reject to a white-space string for function name;
            expect(result[3]).toBe(error);  // reject to an invalid-type function name;
            expect(result[4]).toBe(error);  // reject to a null function name;
        });
    });
});


// NOTE: The same test for 100,000 inserts works just the same.
// Inserting just 10,000 records to avoid exceeding memory quota on the test server.
// Also, the client shouldn't execute more than 10,000 queries within single transaction,
// huge transactions must be throttled into smaller chunks.
describe("A complex transaction with 10,000 inserts", function () {
    it("must not fail", function () {
        var result, error, context, THIS;
        db.tx(function (t) {
            THIS = this;
            context = t;
            var queries = [
                this.none('drop table if exists test'),
                this.none('create table test(id serial, name text)')
            ];
            for (var i = 1; i <= 10000; i++) {
                queries.push(this.none('insert into test(name) values($1)', 'name-' + i));
            }
            queries.push(this.one('select count(*) from test'));
            return promise.all(queries);
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 15000);
        runs(function () {
            expect(THIS === context).toBe(true);
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(10003); // drop + create + insert x 10000 + select;
            var last = result[result.length - 1]; // result from the select;
            expect(typeof(last)).toBe('object');
            expect(last.count).toBe('10000'); // last one must be the counter (as text);
        });
    });
});

describe("When a nested transaction fails", function () {
    it("must return error from the nested transaction", function () {
        var result, error, THIS, context;
        db.tx(function (t) {
            THIS = this;
            context = t;
            return promise.all([
                this.none('update users set login=$1 where id=$2', ['TestName', 1]),
                this.tx(function () {
                    throw new Error('Nested TX failure');
                })
            ]);
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(THIS === context).toBe(true);
            expect(result).toBeNull();
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Nested TX failure');
        });
    });
});

describe("When a nested transaction fails", function () {
    it("both transactions must rollback", function () {
        var result, error, nestError, THIS1, THIS2, context1, context2;
        db.tx(function (t1) {
            THIS1 = this;
            context1 = t1;
            return promise.all([
                this.none('update users set login=$1', 'External'),
                this.tx(function (t2) {
                    THIS2 = this;
                    context2 = t2;
                    return promise.all([
                        this.none('update users set login=$1', 'Internal'),
                        this.one('select * from unknownTable') // emulating a bad query;
                    ]);
                })
            ]);
        })
            .then(function () {
                result = null; // must not get here;
            }, function (reason) {
                nestError = reason;
                return promise.all([
                    db.one('select count(*) from users where login=$1', 'External'), // 0 is expected;
                    db.one('select count(*) from users where login=$1', 'Internal') // 0 is expected;
                ]);
            })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(THIS1 && THIS2 && context1 && context2).toBeTruthy();
            expect(THIS1 === context1).toBe(true);
            expect(THIS2 === context2).toBe(true);
            expect(THIS1 !== THIS2).toBe(true);
            expect(error).toBeUndefined();
            expect(nestError instanceof Error).toBe(true);
            expect(nestError.message).toBe('relation "unknowntable" does not exist');
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });
});

describe("Calling a transaction with an invalid callback", function () {

    it("must reject when the callback is undefined", function () {
        var result, error;
        db.tx()
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Callback function must be specified for the transaction.");
        });
    });

    it("must reject when the callback returns nothing", function () {
        var result, error;
        db.tx(function () {
            // return nothing;
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Transaction callback function didn't return a promise object.");
        });
    });

    it("must reject when the callback returns nonsense", function () {
        var result, error;
        db.tx(function () {
            return 123; // not quite a promise object;
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Transaction callback function didn't return a promise object.");
        });
    });

});

describe("A nested transaction (10 levels)", function () {
    it("must work the same no matter how many levels", function () {
        var result, error, THIS, context;
        db.tx(function () {
            return this.tx(function () {
                return this.tx(function () {
                    return this.tx(function () {
                        return this.tx(function () {
                            return this.tx(function () {
                                return promise.all([
                                    this.one("select 'Hello' as word"),
                                    this.tx(function () {
                                        return this.tx(function () {
                                            return this.tx(function () {
                                                return this.tx(function (t) {
                                                    THIS = this;
                                                    context = t;
                                                    return this.one("select 'World!' as word");
                                                });
                                            });
                                        });
                                    })
                                ]);
                            });
                        });
                    });
                });
            });
        })
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(THIS && context && THIS === context).toBeTruthy();
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].word).toBe('Hello');
            expect(result[1].word).toBe('World!');
        });
    });
});

describe("Return data from a query must match the request type", function () {

    it("method 'none' must throw an error when there was data returned", function () {
        var result, error;
        db.none("select * from person where name=$1", 'John')
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("No return data was expected from the query.");
        });
    });

    it("method 'one' must throw an error when there was no data returned", function () {
        var result, error;
        db.one("select * from person where name=$1", 'Unknown')
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("No data returned from the query.");
        });
    });

    it("method 'one' must throw an error when more than one row was returned", function () {
        var result, error;
        db.one("select * from person")
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Single row was expected from the query.");
        });
    });

    it("method 'oneOrNone' must resolve into null when no data returned", function () {
        var result, error;
        db.oneOrNone("select * from person where name=$1", "Unknown")
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = 'whatever';
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBeUndefined();
            expect(result).toBeNull();
        });
    });

    it("method 'any' must return an empty array when no records found", function () {
        var result, error;
        db.any("select * from person where name='Unknown'")
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(0);
        });
    });

});

describe("Queries must not allow invalid QRM (Query Request Mask) combinations", function () {
    it("method 'query' must throw an error when mask is one+many", function () {
        var result, error;
        db.query("select * from person", undefined, queryResult.one | queryResult.many)
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });
    it("method 'query' must throw an error when QRM is > 6", function () {
        var result, error;
        db.query("select * from person", undefined, 7)
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });
    it("method 'query' must throw an error when QRM is < 1", function () {
        var result, error;
        db.query("select * from person", undefined, 0)
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });

    it("method 'query' must throw an error when QRM is of the wrong type", function () {
        var result, error;
        db.query("select * from person", undefined, 'wrong qrm')
            .then(function (data) {
                result = data;
            }, function (reason) {
                result = null;
                error = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeNull();
            expect(error).toBe("Invalid Query Result Mask specified.");
        });
    });

});

describe("queryRaw", function () {

    it("must resolve with PG result instance", function () {
        var result;
        db.queryRaw("select * from users")
            .then(function (data) {
                result = data;
            }, function () {
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result instanceof pgResult).toBe(true);
        });
    });
});

describe("Synchronous Transactions", function () {

    it("must reject for an invalid factory", function () {
        var result;
        db.tx(function () {
            return this.queue();
        }).then(function () {
            result = null;
        }, function (reason) {
            result = reason;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(typeof(result)).toBe('string');
            expect(result).toBe("Invalid factory function specified.");
        });
    });

    it("must reject for an invalid factory result", function () {
        var result;
        db.tx(function () {
            return this.queue(function () {
                return 123;
            });
        }).then(function () {
            result = null;
        }, function (reason) {
            result = reason;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe("Promise factory returned invalid result for index 0");
        });
    });

    it("must reject with an error when the error is thrown by the factory", function () {
        var result;
        db.tx(function () {
            return this.queue(function () {
                throw new Error("error test");
            });
        }).then(function () {
            result = null;
        }, function (reason) {
            result = reason;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe("error test");
        });
    });

    it("must resolve promises in correct sequence", function () {
        var result, ctx, THIS;
        db.tx(function () {
            return this.queue(function (idx, context) {
                THIS = this;
                ctx = context;
                switch (idx) {
                    case 0:
                        return this.query("select 'one' as value");
                    case 1:
                        return this.query("select 'two' as value");
                }
            });
        }).then(function (data) {
            result = data;
        }, function (reason) {
            result = reason;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(THIS && ctx && ctx === THIS).toBeTruthy();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0][0].value).toBe('one');
            expect(result[1][0].value).toBe('two');
        });
    });

});

var _finishCallback = jasmine.Runner.prototype.finishCallback;
jasmine.Runner.prototype.finishCallback = function () {
    // Run the old finishCallback:
    _finishCallback.bind(this)();

    pgp.end(); // closing pg database application pool;
};
