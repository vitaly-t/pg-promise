'use strict';

var pgResult = require('pg/lib/result');
var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise
};
var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

function nope() {
    // dummy/empty function;
}

describe("Database Instantiation", function () {
    it("must throw an error when empty or no connection passed", function () {
        var err = "Connection details must be specified.";
        expect(pgp).toThrow(new Error(err));
        expect(function () {
            pgp(null);
        }).toThrow(new Error(err));
        expect(function () {
            pgp("");
        }).toThrow(new Error(err));
    });
    var testDB = pgp("invalid connection details");
    it("must return a valid, though non-connectible object", function () {
        expect(typeof(testDB)).toBe('object');
    });
});

describe("Connection", function () {

    describe("with default parameters", function () {
        var status = 'connecting', error;
        beforeEach(function (done) {
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
                    status = 'exception';
                })
                .finally(function () {
                    done();
                });
        });
        it("must be successful", function () {
            expect(status).toBe('success');
            expect(error).toBeUndefined();
        });
    });

    describe("for regular queries", function () {
        var result, sco;
        beforeEach(function (done) {
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
                .finally(function () {
                    if (sco) {
                        sco.done();
                    }
                    done();
                });
        });
        it("must provide functioning context", function () {
            expect(result).toBeDefined();
            expect(result.count > 0).toBe(true);
            expect(typeof(sco.tx)).toBe('function'); // just a protocol check;
        });
    });

    describe("for raw queries", function () {
        var result, sco;
        beforeEach(function (done) {
            db.connect()
                .then(function (obj) {
                    sco = obj;
                    return sco.result("select * from users");
                }, function (reason) {
                    result = null;
                    return promise.reject(reason);
                })
                .then(function (data) {
                    result = data;
                }, function () {
                    result = null;
                })
                .finally(function () {
                    if (sco) {
                        sco.done();
                    }
                    done();
                });
        });
        it("must provide functioning context", function () {
            expect(result instanceof pgResult);
            expect(result.rows.length > 0).toBe(true);
            expect(typeof(result.rowCount)).toBe('number');
            expect(result.rows.length === result.rowCount).toBe(true);
        });
    });

    describe("for invalid port", function () {
        var errCN, dbErr, result;
        beforeEach(function () {
            errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
            errCN.port = 9999;
            dbErr = pgp(errCN);
        });
        describe("with direction connection", function () {
            beforeEach(function (done) {
                dbErr.connect()
                    .then(nope, function (error) {
                        result = error;
                    })
                    .finally(function () {
                        done();
                    });
            });
            it("must report the right error", function () {
                expect(result instanceof Error).toBe(true);
                expect(result.message).toContain('connect ECONNREFUSED');
            });
        });
        describe("with transaction connection", function () {
            beforeEach(function (done) {
                dbErr.tx(nope)
                    .then(nope, function (error) {
                        result = error;
                    })
                    .finally(function () {
                        done();
                    });
            });
            it("must report the right error", function () {
                expect(result instanceof Error).toBe(true);
                expect(result.message).toContain('connect ECONNREFUSED');
            });
        });

    });

    describe("for invalid port", function () {
        var errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.port = '12345';
        var dbErr = pgp(errCN), result;
        beforeEach(function (done) {
            dbErr.connect()
                .then(function () {
                    result = null;
                }, function (error) {
                    result = error;
                })
                .finally(function () {
                    done();
                });
        });
        it("must report the right error", function () {
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
     }, "Connection timed out", 5000);
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

    describe("on repeated disconnection", function () {
        var error;
        beforeEach(function (done) {
            db.connect()
                .then(function (obj) {
                    obj.done(); // disconnecting;
                    try {
                        obj.done(); // invalid disconnect;
                    } catch (err) {
                        error = err;
                    }
                }, function (err) {
                    error = err;
                })
                .finally(function () {
                    done();
                });
        });
        it("must throw the right error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Cannot invoke done() on a disconnected client.");
        });
    });

    describe("when executing a disconnected query", function () {
        var error;
        beforeEach(function (done) {
            db.connect()
                .then(function (obj) {
                    obj.done(); // disconnecting;
                    try {
                        obj.query(); // invalid disconnected query;
                    } catch (err) {
                        error = err;
                    }
                }, function (err) {
                    error = err;
                })
                .finally(function () {
                    done();
                });
        });
        it("must throw the right error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Cannot execute a query on a disconnected client.");
        });
    });
});

describe("Method 'none'", function () {

    it("must resolve with 'undefined'", function () {
        var result, error, finished;
        db.none('select * from users where id=$1', 12345678)
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBeUndefined();
            expect(result).toBeUndefined();
        });
    });

    it("must reject on any data returned", function () {
        var result, error, finished;
        db.none('select * from users')
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("No return data was expected from the query.");
        });
    });

});

describe("Method 'one'", function () {

    it("must resolve with one object", function () {
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

    it("must reject when no data found", function () {
        var result, error, finished;
        db.one('select * from users where id=$1', 12345678)
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("No data returned from the query.");
        });
    });

    it("must reject when multiple rows are found", function () {
        var result, error, finished;
        db.one('select * from users')
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("Single row was expected from the query, but multiple returned.");
        });
    });
});

describe("Method 'oneOrNone'", function () {

    it("must resolve with one object when found", function () {
        var result, error;
        db.oneOrNone('select * from users where id=$1', 1)
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
            expect(result.id).toBe(1);
        });
    });

    it("must resolve with null when no data found", function () {
        var result, error, finished;
        db.oneOrNone('select * from users where id=$1', 12345678)
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBeUndefined();
            expect(result).toBeNull();
        });
    });

    it("must reject when multiple rows are found", function () {
        var result, error, finished;
        db.oneOrNone('select * from users')
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("Single row was expected from the query, but multiple returned.");
        });
    });

});

describe("Method 'many'", function () {

    it("must resolve with array of objects", function () {
        var result, error;
        db.many('select * from users')
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
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    it("must reject when no data found", function () {
        var result, error, finished;
        db.many('select * from users where id=$1', 12345678)
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("No data returned from the query.");
        });
    });

});

describe("Method 'manyOrNone'", function () {

    it("must resolve with array of objects", function () {
        var result, error;
        db.manyOrNone('select * from users')
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
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    it("must resolve with an empty array when no data found", function () {
        var result, error, finished;
        db.manyOrNone('select * from users where id=$1', 12345678)
            .then(function (data) {
                result = data;
                finished = true;
            }, function (reason) {
                error = reason;
                finished = true;
            });
        waitsFor(function () {
            return finished === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(0);
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
            db.query('something', undefined, '2'),
            db.query('something', undefined, -1),
            db.query('something', undefined, 0),
            db.query('something', undefined, 100),
            db.query('something', undefined, NaN),
            db.query('something', undefined, 1 / 0),
            db.query('something', undefined, -1 / 0),
            db.query('something', undefined, 2.45)])
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
            expect(result.length).toBe(9);
            expect(result[0]).toBe(error);  // reject for an empty string;
            expect(result[1]).toBe(error);  // reject for number as a string;
            expect(result[2]).toBe(error);  // reject for a negative integer;
            expect(result[3]).toBe(error);  // reject for a 0;
            expect(result[4]).toBe(error);  // reject for a large number;
            expect(result[5]).toBe(error);  // reject for a NaN;
            expect(result[7]).toBe(error);  // reject for Infinity;
            expect(result[7]).toBe(error);  // reject for -Infinity;
            expect(result[8]).toBe(error);  // reject for a float;
        });
    });

});

// NOTE: The same test for 100,000 inserts works also the same.
// Inserting just 10,000 records to avoid exceeding memory quota on the test server.
// Also, the client shouldn't execute more than 10,000 queries within a single transaction,
// huge transactions should  be throttled into smaller chunks.
describe("A complex transaction with 10,000 inserts", function () {
    it("must not fail", function () {
        var result, error, context, THIS, tag;
        db.tx("complex", function (t) {
            tag = t.ctx.tag;
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
            return this.batch(queries);
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
            expect(tag).toBe("complex");
        });
    });
});

describe("When a nested transaction fails", function () {
    it("must return error from the nested transaction", function () {
        var result, error, THIS, context;
        db.tx(function (t) {
            THIS = this;
            context = t;
            return this.batch([
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
                error = reason[1].result;
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

describe("Detached Transaction", function () {
    it("must throw an error on any query request", function () {
        var stop, error, tx;
        db.tx(function () {
            tx = this;
            return promise.resolve();
        })
            .then(function () {
                try {
                    // cannot use transaction context
                    // outside of transaction callback;
                    tx.query("select 'test'");
                } catch (err) {
                    error = err;
                }
                stop = true;
            }, function (reason) {
                error = reason;
                stop = true;
            });
        waitsFor(function () {
            return stop === true;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Unexpected call outside of transaction.");
        });
    });
});

describe("When a nested transaction fails", function () {
    it("both transactions must rollback", function () {
        var result, error, nestError, THIS1, THIS2, context1, context2;
        db.tx(function (t1) {
            THIS1 = this;
            context1 = t1;
            return this.batch([
                this.none('update users set login=$1', 'External'),
                this.tx(function (t2) {
                    THIS2 = this;
                    context2 = t2;
                    return this.batch([
                        this.none('update users set login=$1', 'Internal'),
                        this.one('select * from unknownTable') // emulating a bad query;
                    ]);
                })
            ]);
        })
            .then(function () {
                result = null; // must not get here;
            }, function (reason) {
                nestError = reason[1].result[1].result;
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

describe("Calling without a callback", function () {
    describe("for a transaction", function () {
        var error;
        beforeEach(function (done) {
            db.tx()
                .catch(function (reason) {
                    error = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must reject", function () {
            expect(error).toBe("Callback function must be specified for the transaction.");
        });
    });
    describe("for a task", function () {
        var error;
        beforeEach(function (done) {
            db.task()
                .catch(function (reason) {
                    error = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must reject", function () {
            expect(error).toBe("Callback function must be specified for the task.");
        });
    });

});

describe("A nested transaction (10 levels)", function () {
    it("must work the same no matter how many levels", function () {
        var result, error, THIS, context, ctx = [];
        db.tx(0, function () {
            ctx.push(this.ctx);
            return this.tx(1, function () {
                ctx.push(this.ctx);
                return this.tx(2, function () {
                    ctx.push(this.ctx);
                    return this.tx(3, function () {
                        ctx.push(this.ctx);
                        return this.tx(4, function () {
                            ctx.push(this.ctx);
                            return this.tx(5, function () {
                                ctx.push(this.ctx);
                                return this.batch([
                                    this.one("select 'Hello' as word"),
                                    this.tx(6, function () {
                                        ctx.push(this.ctx);
                                        return this.tx(7, function () {
                                            ctx.push(this.ctx);
                                            return this.tx(8, function () {
                                                ctx.push(this.ctx);
                                                return this.tx(9, function (t) {
                                                    ctx.push(this.ctx);
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
            expect(result).toEqual([{word: 'Hello'}, {word: 'World!'}]);
            for (var i = 0; i < 10; i++) {
                expect(ctx[i].tag).toBe(i);
            }
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
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("No return data was expected from the query.");
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
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("No data returned from the query.");
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
            expect(error instanceof pgp.QueryResultError).toBe(true);
            expect(error.message).toBe("Single row was expected from the query, but multiple returned.");
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
        db.query("select * from person", undefined, pgp.queryResult.one | pgp.queryResult.many)
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

describe("result", function () {

    it("must resolve with PG result instance", function () {
        var result;
        db.result("select * from users")
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

describe("Batch", function () {
    describe("with invalid values", function () {
        var error;
        beforeEach(function (done) {
            db.task(function () {
                return this.batch();
            })
                .then(nope, function (reason) {
                    error = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must throw an error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Batch requires an array of values.");
        });
    });
    describe("with an empty array", function () {
        var result;
        beforeEach(function (done) {
            db.task(function () {
                return this.batch([]);
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must resolve with an empty array", function () {
            expect(result).toEqual([]);
        });
    });

    describe("with a function throwing an error", function () {
        var error;
        beforeEach(function (done) {
            db.task(function () {
                return this.batch([function () {
                    throw new Error("Ops!");
                }]);
            })
                .then(nope, function (reason) {
                    error = reason[0].result;
                })
                .finally(function () {
                    done();
                });
        });
        it("must reject with the error details", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Ops!");
        });
    });

    describe("with mixed values", function () {
        var result;
        beforeEach(function (done) {
            db.task(function () {
                return this.batch([0, null, promise.reject("one"), undefined, "hello", promise.reject("two"), {test: true}]);
            })
                .then(nope, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must provide correct output", function () {
            var data = [
                {
                    success: true,
                    result: 0
                },
                {
                    success: true,
                    result: null
                },
                {
                    success: false,
                    result: "one"
                },
                {
                    success: true,
                    result: undefined
                },
                {
                    success: true,
                    result: "hello"
                },
                {
                    success: false,
                    result: "two"
                },
                {
                    success: true,
                    result: {test: true}
                }
            ];
            expect(JSON.stringify(result)).toEqual(JSON.stringify(data));
            expect(result.getErrors instanceof Function).toBe(true);
            expect(result.getErrors()).toEqual(["one", "two"]);
        });
    });

    describe("with all rejects", function () {
        var result;
        beforeEach(function (done) {
            function nested() {
                return this.batch([2, promise.reject("three")]);
            }

            db.task(function () {
                return this.batch([promise.reject("one"), nested, promise.reject("four")]);
            })
                .then(nope, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must provide correct output", function () {
            var data = [
                {
                    success: false,
                    result: "one"
                },
                {
                    success: false,
                    result: [
                        {
                            success: true,
                            result: 2
                        },
                        {
                            success: false,
                            result: "three"
                        }
                    ]
                },
                {
                    success: false,
                    result: "four"
                }
            ];
            expect(JSON.stringify(result)).toEqual(JSON.stringify(data));
            expect(result.getErrors instanceof Function).toBe(true);
            expect(result.getErrors()).toEqual(["one", ["three"], "four"]);
        });
    });

});


describe("Sequence", function () {

    describe("for an invalid source", function () {
        var result;
        beforeEach(function (done) {
            db.tx(function () {
                return this.sequence();
            })
                .then(function () {
                }, function (reason) {
                    result = reason;
                }).finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe("Invalid sequence source.");
        });
    });

    describe("for a rejected request", function () {
        var result;
        beforeEach(function (done) {
            db.tx(function () {
                return this.sequence(function () {
                    return promise.reject("testing reject");
                });
            })
                .then(function (data) {
                }, function (reason) {
                    result = reason;
                }).finally(function () {
                    done();
                });
        });
        it("must reject with the same reason", function () {
            expect(result).toEqual({
                index: 0,
                error: "testing reject",
                source: undefined
            });
        });
    });

    describe("without tracking", function () {
        var result;
        beforeEach(function (done) {
            db.tx(function () {
                return this.sequence(function (idx) {
                    if (idx < 10) {
                        return this.query("select $1", idx);
                    }
                });
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must resolve with the stat object", function () {
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.total).toBe(10);
        });
    });

});


describe("Querying a function", function () {

    describe("that expects multiple rows", function () {
        var result;
        beforeEach(function (done) {
            db.func("getUsers")
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return correctly", function () {
            expect(result instanceof Array).toBe(true);
            expect(result.length >= 4).toBe(true);
        })
    });

    describe("that expects a single row", function () {
        var result;
        beforeEach(function (done) {
            db.proc("findUser", 1)
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return correctly", function () {
            expect(typeof(result)).toBe('object');
            expect('id' in result && 'login' in result && 'active' in result).toBe(true);
        })
    });

    describe("with function-parameter that throws an error", function () {
        var result;
        beforeEach(function (done) {
            db.proc("findUser", [function () {
                throw new Error("format failed");
            }])
                .then(function () {
                }, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return correctly", function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe("format failed");
        })
    });

    describe("with invalid parameters", function () {
        var result, error = "Function name must be a non-empty text string.";
        beforeEach(function (done) {
            promise.any([
                db.func(),      // undefined function name;
                db.func(''),    // empty-string function name;
                db.func('   '), // white-space string for function name;
                db.func(1),     // invalid-type function name;
                db.func(null),  // null function name;
                // query function overrides:
                db.query({
                    funcName: null
                }),
                db.query({
                    funcName: ''
                }),
                db.query({
                    funcName: '   '
                })
            ])
                .then(function () {
                }, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must reject with the right error", function () {
            expect(result.length).toBe(8);
            for (var i = 0; i < result.length; i++) {
                expect(result[i]).toBe(error);
            }
        });
    });
});

describe("Prepared Statements", function () {

    describe("valid, without parameters", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                name: "get all users",
                text: "select * from users"
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return all users", function () {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe("valid, with parameters", function () {
        var result;
        beforeEach(function (done) {
            db.one({
                name: "find one user",
                text: "select * from users where id=$1",
                values: [1]
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return all users", function () {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe("with invalid query", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                name: "break it",
                text: "select * from somewhere"
            })
                .then(nope, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe('relation "somewhere" does not exist');
        });
    });

    describe("with an empty 'name'", function () {
        var result;
        beforeEach(function (done) {
            db.query({
                name: "",
                text: "non-empty"
            })
                .then(nope, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result).toBe("Property 'name' in prepared statement must be a non-empty text string.");
        });
    });

    describe("with an empty 'text'", function () {
        var result;
        beforeEach(function (done) {
            db.query({
                name: "non-empty",
                text: null
            })
                .then(nope, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result).toBe("Property 'text' in prepared statement must be a non-empty text string.");
        });
    });

});

describe("Task", function () {

    describe("with detached connection", function () {
        var error, tsk;
        beforeEach(function (done) {
            db.task(function () {
                tsk = this;
                return promise.resolve();
            })
                .then(function () {
                    // try use the task connection context outside of the task callback;
                    return tsk.query("select 'test'");
                })
                .catch(function (err) {
                    error = err;
                })
                .finally(function () {
                    done();
                });
        });
        it("must throw an error on any query request", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Unexpected call outside of task.");
        });
    });

    describe("with a callback that returns nothing", function () {
        var result;
        beforeEach(function (done) {
            db.task(nope)
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must resolve with undefined", function () {
            expect(result).toBeUndefined();
        });
    });

    describe("with a callback that returns a value", function () {
        var result;
        beforeEach(function (done) {
            db.task(function () {
                return 123;
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must resolve with the value", function () {
            expect(result).toBe(123);
        });
    });

    describe("with the callback throwing an error", function () {
        var result;
        beforeEach(function (done) {
            db.task(function () {
                throw new Error("test");
            })
                .then(nope, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must reject with the error thrown", function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe("test");
        });
    });

    describe("with a simple promise result", function () {
        var result, context, THIS;
        beforeEach(function (done) {
            db.task(function (t) {
                THIS = this;
                context = t;
                return promise.resolve("Ok");
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must resolve with that result", function () {
            expect(result).toBe("Ok");
        });
        it("must provide correct connection context", function () {
            expect(context && typeof context === 'object').toBeTruthy();
            expect(context === THIS).toBe(true);
        });
    });

    describe("with a query result", function () {
        var result, event, counter = 0;
        beforeEach(function (done) {
            options.task = function (e) {
                if (counter) {
                    throw "ops!";
                }
                counter++;
                event = e;
            };
            function myTask() {
                return this.one("select count(*) as counter from users");
            }

            myTask.tag = "testTag";
            db.task(myTask)
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        afterEach(function () {
            delete options.task;
        });
        it("must resolve with that result", function () {
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.counter > 0).toBe(true);
            expect(counter).toBe(1); // successful notification 'Start', failed for 'Finish';
            expect(event && event.ctx && typeof event.ctx === 'object').toBeTruthy();
            expect(event.ctx.tag).toBe("testTag");
        });
    });

});

if (jasmine.Runner) {
    var _finishCallback = jasmine.Runner.prototype.finishCallback;
    jasmine.Runner.prototype.finishCallback = function () {
        // Run the old finishCallback:
        _finishCallback.bind(this)();

        pgp.end(); // closing pg database application pool;
    };
}
