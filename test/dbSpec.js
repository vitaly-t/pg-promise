'use strict';

var capture = require('./db/capture');
var pgResult = require('pg/lib/result');
var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise
};
var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

function dummy() {
    // dummy/empty function;
}

var BatchError = pgp.spex.errors.BatchError;

var $errors = {
    func: "Invalid function name.",
    query: "Invalid query format.",
    emptyQuery: "Empty or undefined query.",
    notEmpty: "No return data was expected.",
    noData: "No data returned from the query.",
    multiple: "Multiple rows were not expected."
};

describe("Database Instantiation", function () {
    it("must throw an invalid connection passed", function () {
        var err = "Invalid connection details.";
        expect(pgp).toThrow(err);
        expect(function () {
            pgp(null);
        }).toThrow(err);
        expect(function () {
            pgp("");
        }).toThrow(err);
        expect(function () {
            pgp(123);
        }).toThrow(err);
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
        var errCN, dbErr, result, log;
        beforeEach(function () {
            errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
            errCN.port = 9999;
            dbErr = pgp(errCN);
            options.error = function (err, e) {
                log = {
                    err: err,
                    e: e
                }
            };
        });
        describe("using connect()", function () {
            beforeEach(function (done) {
                dbErr.connect()
                    .then(dummy, function (error) {
                        result = error;
                    })
                    .finally(function () {
                        done();
                    });
            });
            it("must report the right error", function () {
                expect(log.e.cn).toEqual(errCN);
                expect(result instanceof Error).toBe(true);

                if (options.pgNative) {
                    expect(result.message).toContain('could not connect to server');
                } else {
                    expect(result.message).toContain('connect ECONNREFUSED');
                }

            });
        });
        describe("with transaction connection", function () {
            beforeEach(function (done) {
                dbErr.tx(dummy)
                    .then(dummy, function (error) {
                        result = error;
                    })
                    .finally(function () {
                        done();
                    });
            });
            it("must report the right error", function () {
                expect(result instanceof Error).toBe(true);
                if (options.pgNative) {
                    expect(result.message).toContain('could not connect to server');
                } else {
                    expect(result.message).toContain('connect ECONNREFUSED');
                }
            });
        });
        afterEach(function () {
            delete options.error;
        });
    });

    describe("for an invalid port", function () {
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
            if (options.pgNative) {
                expect(result.message).toContain('could not connect to server');
            } else {
                expect(result.message).toContain('connect ECONNREFUSED');
            }
        });
    });

    describe("direct end() call", function () {
        var txt;
        beforeEach(function (done) {
            db.connect()
                .then(function (obj) {
                    var c = capture();
                    obj.client.end();
                    txt = c();
                    done();
                });
        });
        it("must be reported into the console", function () {
            expect(txt).toContain('Abnormal client.end() call, due to invalid code or failed server connection.');
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

describe("Direct Connection", function () {

    describe("successful connection", function () {
        var sco;
        beforeEach(function (done) {
            db.connect({direct: true})
                .then(function (obj) {
                    sco = obj;
                    sco.done();
                    done();
                });
        });
        it("must connect correctly", function () {
            expect(typeof sco).toBe('object');
        });
    });

    describe("direct end() call", function () {
        var txt;
        beforeEach(function (done) {
            db.connect({direct: true})
                .then(function (obj) {
                    var c = capture();
                    obj.client.end();
                    txt = c();
                    done();
                });
        });
        it("must be reported into the console", function () {
            expect(txt).toContain('Abnormal client.end() call, due to invalid code or failed server connection.');
        });
    });

    describe("for an invalid port", function () {
        var errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.port = '12345';
        var dbErr = pgp(errCN), result;
        beforeEach(function (done) {
            dbErr.connect({direct: true})
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
            if (options.pgNative) {
                expect(result.message).toContain('could not connect to server');
            } else {
                expect(result.message).toContain('connect ECONNREFUSED');
            }
        });
    });

});

describe("Masked Connection Log", function () {

    var cn;
    beforeEach(function () {
        options.error = function (err, e) {
            cn = e.cn;
        };
    });
    describe("as an object", function () {
        var connection = {
            host: 'localhost',
            user: 'unknown',
            password: '123'
        };
        beforeEach(function (done) {
            var errDB = pgp(connection);
            errDB.connect()
                .catch(function () {
                    done();
                });
        });
        it("must report the password masked correctly", function () {
            expect(cn).toEqual({
                host: 'localhost',
                user: 'unknown',
                password: '###'
            });
        });
    });

    describe("as a string", function () {
        var connection = "postgres://username:password@server:port/database";
        beforeEach(function (done) {
            var errDB = pgp(connection);
            errDB.connect()
                .catch(function () {
                    done();
                });
        });
        it("must report the password masked correctly", function () {
            expect(cn).toBe("postgres://username:########@server:port/database");
        });
    });

    afterEach(function () {
        delete options.error;
        cn = undefined;
    });
});

describe("Method 'map'", function () {

    describe("positive:", function () {
        var pValue, pIndex, pArr, pData;
        beforeEach(function (done) {
            db.map('SELECT 1 as value', null, function (value, index, arr) {
                pValue = value;
                pIndex = index;
                pArr = arr;
                return {newVal: 2};
            })
                .then(function (data) {
                    pData = data;
                    done();
                });
        });
        it("must reject with an error", function () {
            expect(pValue).toEqual({value: 1});
            expect(pIndex).toBe(0);
            expect(pArr).toEqual([{value: 1}]);
            expect(pData).toEqual([{newVal: 2}]);
        });
    });

    describe("negative:", function () {

        describe("with invalid parameters", function () {
            var err;
            beforeEach(function (done) {
                db.map('SELECT 1')
                    .catch(function (error) {
                        err = error;
                        done();
                    });
            });
            it("must reject with an error", function () {
                expect(err instanceof TypeError).toBe(true);
                expect(err.message).toContain("is not a function");
            });
        });

        describe("with error thrown inside the callback", function () {
            var err;
            beforeEach(function (done) {
                db.map('SELECT 1', null, function () {
                    throw new Error("Ops!");
                })
                    .catch(function (error) {
                        err = error;
                        done();
                    });
            });
            it("must reject with an error", function () {
                expect(err).toEqual(new Error("Ops!"));
            });
        });

    });
});

describe("Method 'each'", function () {

    describe("positive:", function () {
        var pValue, pIndex, pArr, pData;
        beforeEach(function (done) {
            db.each('SELECT 1 as value', null, function (value, index, arr) {
                pValue = value;
                pIndex = index;
                pArr = arr;
                value.value = 2;
            })
                .then(function (data) {
                    pData = data;
                    done();
                });
        });
        it("must reject with an error", function () {
            expect(pValue).toEqual({value: 2});
            expect(pIndex).toBe(0);
            expect(pArr).toEqual([{value: 2}]);
            expect(pData).toEqual([{value: 2}]);
        });
    });

    describe("negative:", function () {

        describe("with invalid parameters", function () {
            var err;
            beforeEach(function (done) {
                db.each('SELECT 1')
                    .catch(function (error) {
                        err = error;
                        done();
                    });
            });
            it("must reject with an error", function () {
                expect(err instanceof TypeError).toBe(true);
                expect(err.message).toContain("is not a function");
            });
        });

        describe("with error thrown inside the callback", function () {
            var err;
            beforeEach(function (done) {
                db.each('SELECT 1', null, function () {
                    throw new Error("Ops!");
                })
                    .catch(function (error) {
                        err = error;
                        done();
                    });
            });
            it("must reject with an error", function () {
                expect(err).toEqual(new Error("Ops!"));
            });
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
            expect(result).toBe(null);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.toString(1) != error.inspect()).toBe(true);
            expect(error.message).toBe($errors.notEmpty);
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

    describe("value transformation", function () {
        var result, context;
        beforeEach(function (done) {
            db.one('select count(*) from users', null, function (value) {
                context = this;
                return parseInt(value.count);
            }, 123)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must resolve with the new value", function () {
            expect(typeof result).toBe('number');
            expect(result > 0).toBe(true);
            expect(context).toBe(123);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.noData);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.multiple);
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

    describe("value transformation", function () {
        var result, context;
        beforeEach(function (done) {
            db.oneOrNone('select count(*) from users', null, function (value) {
                context = this;
                return parseInt(value.count);
            }, 123)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must resolve with the new value", function () {
            expect(typeof result).toBe('number');
            expect(result > 0).toBe(true);
            expect(context).toBe(123);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.multiple);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.noData);
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
        var finished, result;
        promise.any([
            db.query(),
            db.query(''),
            db.query('   '),
            db.query({}),
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
            expect(result.length).toBe(6);
            expect(result[0].message).toBe($errors.emptyQuery);  // reject to an undefined query;
            expect(result[1].message).toBe($errors.emptyQuery);  // reject to an empty-string query;
            expect(result[2].message).toBe($errors.query);  // reject to a white-space query string;
            expect(result[3].message).toBe($errors.query);  // reject for an empty object;
            expect(result[4].message).toBe($errors.query);  // reject to an invalid-type query;
            expect(result[5].message).toBe($errors.emptyQuery);  // reject to a null query;
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
            for (var i = 0; i < 9; i++) {
                expect(result[i] instanceof TypeError).toBe(true);
                expect(result[i].message).toBe(error);
            }
        });
    });

});

describe("Transactions", function () {

    // NOTE: The same test for 100,000 inserts works also the same.
    // Inserting just 10,000 records to avoid exceeding memory quota on the test server.
    // Also, the client shouldn't execute more than 10,000 queries within a single transaction,
    // huge transactions should  be throttled into smaller chunks.
    describe("A complex transaction with 10,000 inserts", function () {

        var result, error, context, THIS, tag;
        beforeEach(function (done) {
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
                    done();
                });
        });

        it("must not fail", function () {
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

    describe("When a nested transaction fails", function () {
        var result, error, THIS, context;
        beforeEach(function (done) {
            options.capSQL = true;
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
                .catch(function (reason) {
                    error = reason.data[1].result;
                    done();
                });
        });
        it("must return error from the nested transaction", function () {
            expect(THIS === context).toBe(true);
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Nested TX failure');
        });
        afterEach(function () {
            delete options.capSQL;
        });
    });

    describe("Detached Transaction", function () {
        var stop, error, tx;
        beforeEach(function (done) {
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
                })
                .finally(function () {
                    done();
                });
        });
        it("must throw an error on any query request", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Unexpected call outside of transaction.");
        });
    });

    describe("bottom-level failure", function () {
        var result, nestError, THIS1, THIS2, context1, context2;
        beforeEach(function (done) {
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
                .then(dummy, function (reason) {
                    nestError = reason.data[1].result.data[1].result;
                    return promise.all([
                        db.one('select count(*) from users where login=$1', 'External'), // 0 is expected;
                        db.one('select count(*) from users where login=$1', 'Internal') // 0 is expected;
                    ]);
                })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must rollback everything", function () {
            expect(THIS1 && THIS2 && context1 && context2).toBeTruthy();
            expect(THIS1 === context1).toBe(true);
            expect(THIS2 === context2).toBe(true);
            expect(THIS1 !== THIS2).toBe(true);
            expect(nestError instanceof Error).toBe(true);
            expect(nestError.message).toContain('relation "unknowntable" does not exist');
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });

    describe("top-level failure", function () {
        var result;
        beforeEach(function (done) {
            db.tx(function () {
                return this.batch([
                    this.none('update users set login=$1 where id=1', 'Test'),
                    this.tx(function () {
                        return this.none('update person set name=$1 where id=1', 'Test');
                    })
                ])
                    .then(function () {
                        return promise.reject();
                    });
            })
                .then(dummy, function () {
                    return promise.all([
                        db.one('select count(*) from users where login=$1', 'Test'), // 0 is expected;
                        db.one('select count(*) from person where name=$1', 'Test') // 0 is expected;
                    ]);
                })
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must rollback everything", function () {
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
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
                expect(error instanceof TypeError).toBe(true);
                expect(error.message).toBe("Callback function is required for the transaction.");
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
                expect(error instanceof TypeError).toBe(true);
                expect(error.message).toBe("Callback function is required for the task.");
            });
        });

    });

    describe("A nested transaction (10 levels)", function () {
        var result, THIS, context, ctx = [];
        beforeEach(function (done) {
            options.capSQL = true;
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
                    done();
                });
        });
        it("must work the same no matter how many levels", function () {
            expect(THIS && context && THIS === context).toBeTruthy();
            expect(result instanceof Array).toBe(true);
            expect(result).toEqual([{word: 'Hello'}, {word: 'World!'}]);
            for (var i = 0; i < 10; i++) {
                expect(ctx[i].tag).toBe(i);
            }
        });
        afterEach(function () {
            delete options.capSQL;
        });
    });

});


describe("Return data from a query must match the request type", function () {

    describe("when no data returned", function () {
        var error;
        beforeEach(function (done) {
            db.none("select * from person where name=$1", 'John')
                .catch(function (err) {
                    error = err;
                    done();
                });
        });
        it("method 'none' must return an error", function () {
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.notEmpty);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.noData);
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
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($errors.multiple);
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
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe("Invalid Query Result Mask specified.");
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
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe("Invalid Query Result Mask specified.");
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
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe("Invalid Query Result Mask specified.");
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
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe("Invalid Query Result Mask specified.");
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
            if (!options.pgNative) {
                expect(result instanceof pgResult).toBe(true);
            }
        });
    });
});

describe("Querying a function", function () {

    describe("that expects multiple rows", function () {
        var result;
        beforeEach(function (done) {
            options.capSQL = true;
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
        afterEach(function () {
            delete options.capSQL;
        });
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

    describe("value transformation", function () {
        var result, context;
        beforeEach(function (done) {
            db.proc('findUser', 1, function (value) {
                context = this;
                return value.id;
            }, 123)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must resolve with the new value", function () {
            expect(typeof result).toBe('number');
            expect(result > 0).toBe(true);
            expect(context).toBe(123);
        });
    });

    describe("with function-parameter that throws an error", function () {
        var result, errCtx;
        beforeEach(function (done) {
            options.error = function (err, e) {
                errCtx = e;
            };
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
        it("must throw an error", function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe("format failed");
            expect(errCtx.query).toBe('select * from findUser(...)');
        });
        afterEach(function () {
            delete options.error;
        });
    });

    describe("with function-parameter that throws an error + capitalized", function () {
        var errCtx;
        beforeEach(function (done) {
            options.capSQL = true;
            options.error = function (err, e) {
                errCtx = e;
            };
            db.func("findUser", [function () {
                throw 1;
            }])
                .catch(function () {
                    done();
                });
        });
        it("must throw an error", function () {
            expect(errCtx.query).toBe('SELECT * FROM findUser(...)');
        });
        afterEach(function () {
            delete options.error;
            delete options.capSQL;
        });
    });

    describe("with invalid parameters", function () {
        var result;
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
                expect(result[i] instanceof Error).toBe(true);
                expect(result[i].message).toBe($errors.func);
            }
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
            db.task(dummy)
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
                .then(dummy, function (reason) {
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

    describe("with a notification error", function () {
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
                return promise.resolve("success");
            }

            myTask.tag = "testTag";
            db.task(myTask)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        afterEach(function () {
            delete options.task;
        });
        it("that must be ignored", function () {
            expect(result).toBe("success");
            expect(counter).toBe(1); // successful notification 'Start', failed for 'Finish';
            expect(event && event.ctx && typeof event.ctx === 'object').toBeTruthy();
            expect(event.ctx.tag).toBe("testTag");
        });
    });

});

describe("negative query formatting", function () {

    describe("with invalid property name", function () {
        var error;
        beforeEach(function (done) {
            db.one('select ${invalid}', {})
                .catch(function (e) {
                    error = e;
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Property 'invalid' doesn't exist.");
        });
    });

    describe("with invalid variable index", function () {
        var error;
        beforeEach(function (done) {
            db.one('select $1', [])
                .catch(function (e) {
                    error = e;
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(error instanceof RangeError).toBe(true);
            expect(error.message).toBe("Variable $1 out of range. Parameters array length: 0");
        });
    });

    describe("with formatting parameter throwing error", function () {
        var error;
        beforeEach(function (done) {
            db.one('select $1', [function () {
                throw new Error("ops!");
            }])
                .catch(function (e) {
                    error = e;
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("ops!");
        });
    });

    describe("with formatting parameter throwing value", function () {
        var error;
        beforeEach(function (done) {
            db.one('select $1', [function () {
                throw 123;
            }])
                .catch(function (e) {
                    error = e;
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(error).toBe(123);
        });
    });

    describe("with formatting parameter throwing undefined", function () {
        var error, handled;
        beforeEach(function (done) {
            db.one('select $1', [function () {
                throw undefined;
            }])
                .catch(function (e) {
                    handled = true;
                    error = e;
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(handled).toBe(true);
            expect(error).toBeUndefined();
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
