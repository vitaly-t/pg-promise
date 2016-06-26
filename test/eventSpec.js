'use strict';

var QueryStream = require('pg-query-stream');
var JSONStream = require('JSONStream');

var pgResult = require('pg/lib/result');
var pgClient = require('pg/lib/client');

var header = require('./db/header');

var promise = header.defPromise;
var options = {
    promiseLib: promise // use Bluebird for testing;
};

var testDC = 'test_DC_123';

var dbHeader = header(options, testDC);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

// empty function;
var dummy = function () {
};

describe("Connect/Disconnect events", function () {

    describe("during a query", function () {
        var p1, p2, dc1, dc2, connect = 0, disconnect = 0;
        beforeEach(function (done) {
            options.connect = function (client, dc) {
                dc1 = dc;
                p1 = client;
                connect++;
                throw new Error("### Testing error output in 'connect'. Please ignore. ###");
            };
            options.disconnect = function (client, dc) {
                dc2 = dc;
                p2 = client;
                disconnect++;
                throw new Error("### Testing error output in 'disconnect'. Please ignore. ###");
            };
            db.query("select 'test'")
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        afterEach(function () {
            options.connect = null;
            options.disconnect = null;
        });
        it("must be sent correctly", function () {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            if (!options.pgNative) {
                expect(p1 instanceof pgClient).toBe(true);
                expect(p2 instanceof pgClient).toBe(true);
            }
            expect(dc1).toBe(testDC);
            expect(dc2).toBe(testDC);
        });
    });

    describe("during a transaction", function () {
        var p1, p2, dc1, dc2, ctx, connect = 0, disconnect = 0;
        beforeEach(function (done) {
            options.connect = function (client, dc) {
                dc1 = dc;
                p1 = client;
                connect++;
            };
            options.disconnect = function (client, dc) {
                dc2 = dc;
                p2 = client;
                disconnect++;
            };
            db.tx(function (t) {
                ctx = t.ctx;
                return this.batch([
                    t.query("select 'one'"),
                    t.query("select 'two'"),
                    t.query("select 'three'")
                ]);
            })
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        afterEach(function () {
            options.connect = null;
            options.disconnect = null;
        });
        it("must be sent correctly", function () {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            if (!options.pgNative) {
                expect(p1 instanceof pgClient).toBe(true);
                expect(p2 instanceof pgClient).toBe(true);
            }
            expect(dc1).toBe(testDC);
            expect(dc2).toBe(testDC);
            expect(ctx.dc).toBe(testDC);
        });
    });
});

describe("Query event", function () {

    describe("positive", function () {
        var param, counter = 0;
        beforeEach(function (done) {
            options.query = function (e) {
                counter++;
                param = e;
            };
            db.query("select $1", [123])
                .then(function () {
                    done();
                });
        });
        it("must pass query and parameters correctly", function () {
            expect(counter).toBe(1);
            expect(param.query).toBe('select 123');
            expect(param.params).toBeUndefined();
            expect(param.dc).toBe(testDC);
        });
    });

    describe("negative, with an error object", function () {
        var result, errMsg = "Throwing a new Error during 'query' notification.";
        beforeEach(function (done) {
            options.query = function () {
                throw new Error(errMsg);
            };
            db.query("select $1", [123])
                .catch(function (error) {
                    result = error;
                    done();
                });
        });
        it("must reject with the right error", function () {
            expect(result).toEqual(new Error(errMsg));
        });
    });

    describe("negative, with undefined", function () {
        var result, handled;
        beforeEach(function (done) {
            options.query = function () {
                throw undefined;
            };
            db.query("select $1", [123])
                .catch(function (error) {
                    handled = true;
                    result = error;
                    done();
                });
        });
        it("must reject with undefined", function () {
            expect(handled).toBe(true);
            expect(result).toBeUndefined();
        });
    });

    afterEach(function () {
        delete options.query;
    });

});

describe("Start/Finish transaction events", function () {
    var result, tag, ctx, e1, e2, start = 0, finish = 0;
    beforeEach(function (done) {
        options.transact = function (e) {
            if (e.ctx.finish) {
                finish++;
                ctx = e.ctx;
                e1 = e;
            } else {
                start++;
                tag = e.ctx.tag;
                e2 = e;
            }
            throw "### Testing error output in 'transact'. Please ignore. ###";
        };
        db.tx("myTransaction", function () {
            return promise.resolve('SUCCESS');
        })
            .then(function (data) {
                result = data;
            })
            .finally(function () {
                done();
            });
    });
    afterEach(function () {
        options.transact = null;
    });

    it("must execute correctly", function () {
        expect(result).toBe('SUCCESS');
        expect(start).toBe(1);
        expect(finish).toBe(1);
        expect(tag).toBe("myTransaction");
        expect(ctx.success).toBe(true);
        expect(ctx.isTX).toBe(true);
        expect(ctx.dc).toBe(testDC);
        expect(e1.dc).toBe(testDC);
        expect(e2.dc).toBe(testDC);
    });
});

describe("Error event", function () {

    describe("from transaction callbacks", function () {
        var r, error, context, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                context = e;
                throw new Error("### Testing error output in 'error'. Please ignore. ###");
            };
            db.tx("Error Transaction", function () {
                throw new Error("Test Error");
            })
                .then(dummy, function (reason) {
                    r = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must report errors", function () {
            expect(r instanceof Error).toBe(true);
            expect(r.message).toBe('Test Error');
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Test Error');
            expect(counter).toBe(1);
            expect(context.ctx.tag).toBe("Error Transaction");
            expect(context.dc).toBe(testDC);
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
        });
    });

    describe("for null-queries", function () {
        var error, context, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                context = e;
            };
            db.query(null)
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        it("must fail correctly", function () {
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe("Empty or undefined query.");
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe("for incorrect QRM", function () {
        var error, context, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                context = e;
            };
            db.query("Bla-Bla", undefined, 42)
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe("Invalid Query Result Mask specified.");
            expect(context.query).toBe("Bla-Bla");
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe("for single-row requests", function () {
        var errTxt, context, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                errTxt = err;
                context = e;
            };
            db.one("select * from users")
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(errTxt instanceof pgp.errors.QueryResultError).toBe(true);
            expect(errTxt.message).toBe("Multiple rows were not expected.");
            expect(context.query).toBe("select * from users");
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe("for no-row requests", function () {
        var errTxt, context, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                errTxt = err;
                context = e;
            };
            db.none("select * from users")
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(errTxt instanceof pgp.errors.QueryResultError).toBe(true);
            expect(errTxt.message).toBe("No return data was expected.");
            expect(context.query).toBe("select * from users");
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe("for empty requests", function () {
        var errTxt, context, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                errTxt = err;
                context = e;
            };
            db.many("select * from users where id > $1", 1000)
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(errTxt instanceof pgp.errors.QueryResultError).toBe(true);
            expect(errTxt.message).toBe("No data returned from the query.");
            expect(context.query).toBe("select * from users where id > 1000");
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe("for loose query requests", function () {
        var error, r, context, counter = 0, msg = "Loose request outside an expired connection.";
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                context = e;
            };
            var query, sco;
            db.connect()
                .then(function (obj) {
                    sco = obj;
                    query = sco.query("select * from users where($1)", false);
                    return null;
                })
                .finally(function () {
                    sco.done();
                    query
                        .then(dummy, function (reason) {
                            r = reason;
                        })
                        .finally(function () {
                            done();
                        });
                });
        });
        it("must notify with correct error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe(msg);
            expect(r instanceof Error).toBe(true);
            expect(r.message).toBe(msg);
            expect(context.query).toBe("select * from users where(false)");
            expect(context.client).toBeUndefined();
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    if (!options.pgNative) {
        describe("for loose stream requests", function () {
            var error, r, context, counter = 0, msg = "Loose request outside an expired connection.";
            beforeEach(function (done) {
                options.error = function (err, e) {
                    counter++;
                    error = err;
                    context = e;
                };
                var query, sco;
                var qs = new QueryStream("select $1::int", [123]);
                db.connect()
                    .then(function (obj) {
                        sco = obj;
                        query = sco.stream(qs, function (s) {
                            s.pipe(JSONStream.stringify());
                        });
                        return null;
                    })
                    .finally(function () {
                        sco.done();
                        query
                            .then(dummy, function (reason) {
                                r = reason;
                            })
                            .finally(function () {
                                done();
                            });
                    });
            });
            it("must notify with correct error", function () {
                expect(error instanceof Error).toBe(true);
                expect(r instanceof Error).toBe(true);
                expect(error.message).toBe(msg);
                expect(r.message).toBe(msg);
                expect(context.query).toBe("select $1::int");
                expect(context.client).toBeUndefined();
                expect(context.params).toEqual(['123']);
                expect(counter).toBe(1);
            });
        });
    }

    describe("for invalid parameters", function () {
        var error, context, counter = 0, params = {};
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                context = e;
            };
            db.query("${test}", params)
                .then(dummy, dummy)
                .finally(function () {
                    done();
                });
        });
        it("must report the parameters correctly", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Property 'test' doesn't exist.");
            expect(context.query).toBe("${test}");
            expect(context.params).toBe(params);
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    afterEach(function () {
        delete options.error;
    });

});

describe("Receive event", function () {

    describe("query positive", function () {
        var ctx, data, res, counter = 0;
        beforeEach(function (done) {
            options.receive = function (d, r, e) {
                counter++;
                data = d;
                res = r;
                ctx = e;
            };
            db.one("select $1 as value", [123])
                .then(function () {
                    done();
                });
        });
        it("must pass in correct data and context", function () {
            expect(counter).toBe(1);
            expect(ctx.query).toBe('select 123 as value');
            expect(ctx.params).toBeUndefined();
            expect(ctx.dc).toBe(testDC);
            expect(data).toEqual([{
                value: 123
            }]);
            if (!options.pgNative) {
                expect(res instanceof pgResult).toBe(true);
            }
        });
    });

    describe("query negative", function () {
        var result, error = new Error("ops!");
        beforeEach(function (done) {
            options.receive = function () {
                throw error;
            };
            db.one("select $1 as value", [123])
                .catch(function (reason) {
                    result = reason;
                    done();
                });
        });
        it("must reject with the right error", function () {
            expect(result).toBe(error);
        });
    });

    describe("query negative, undefined", function () {
        var result, handled;
        beforeEach(function (done) {
            options.receive = function () {
                throw undefined;
            };
            db.one("select $1 as value", [123])
                .catch(function (error) {
                    handled = true;
                    result = error;
                    done();
                });
        });
        it("must reject with undefined", function () {
            expect(handled).toBe(true);
            expect(result).toBeUndefined();
        });
    });

    if (!options.pgNative) {
        // Cannot test streams against native bindings;

        describe("stream positive", function () {
            var ctx, data, res, counter = 0;
            beforeEach(function (done) {
                options.receive = function (d, r, e) {
                    counter++;
                    data = d;
                    res = r;
                    ctx = e;
                };
                var qs = new QueryStream("select $1::int as value", [123]);
                db.stream(qs, function (s) {
                    s.pipe(JSONStream.stringify());
                })
                    .then(function () {
                        done();
                    });
            });
            it("must pass in correct data and context", function () {
                expect(counter).toBe(1);
                expect(ctx.query).toBe('select $1::int as value');
                expect(ctx.params).toEqual(['123']);
                expect(data).toEqual([{
                    value: 123
                }]);
                expect(res).toBeUndefined();
            });
        });

        describe("stream negative", function () {
            var result;
            beforeEach(function (done) {
                options.receive = function () {
                    throw "ops!";
                };
                var qs = new QueryStream("select $1::int as value", [123]);
                db.stream(qs, function (s) {
                    s.pipe(JSONStream.stringify());
                })
                    .catch(function (error) {
                        result = error;
                        done();
                    });
            });
            it("must reject with the right error", function () {
                expect(result).toBe("ops!");
            });
        });

        describe("stream negative, undefined", function () {
            var result, handled;
            beforeEach(function (done) {
                options.receive = function () {
                    throw undefined;
                };
                var qs = new QueryStream("select $1::int as value", [123]);
                db.stream(qs, function (s) {
                    s.pipe(JSONStream.stringify());
                })
                    .catch(function (error) {
                        handled = true;
                        result = error;
                        done();
                    });
            });
            it("must reject with undefined", function () {
                expect(handled).toBe(true);
                expect(result).toBeUndefined();
            });
        });
    }

    afterEach(function () {
        delete options.receive;
    });

});

describe("pgFormatting", function () {
    var result;
    beforeEach(function () {
        result = undefined;
        options.pgFormatting = true;
    });
    afterEach(function () {
        options.pgFormatting = false;
    });
    describe("query event", function () {
        var ctx = [];
        beforeEach(function (done) {
            options.query = function (e) {
                ctx.push(e);
            };
            promise.all([
                db.func("findUser", 1),
                db.one("select * from users where id=$1", [1])
            ])
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        afterEach(function () {
            options.query = null;
        });
        it("must affect formatting accordingly", function () {
            expect(Array.isArray(result)).toBe(true);
            expect(ctx.length).toBe(2);
            // params will be passed back only because the formatting
            // is done by PG, and not by pg-promise:
            //
            // Cannot verify the second parameter because of the bug in pg:
            // https://github.com/brianc/node-postgres/issues/750
            // expect(ctx[0].params === 1 && ctx[1].params[0] === 1).toBe(true);
            expect(ctx[0].params === 1).toBe(true);
        });
    });

    describe("empty / null query", function () {
        var err;
        beforeEach(function (done) {
            promise.any([
                db.query(),
                db.query(''),
                db.query(null),
                db.query(0)
            ])
                .then(function (data) {
                }, function (reason) {
                    err = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must provide the original pg response", function () {
            if (!options.pgNative) {
                expect(err.length).toBe(4);
                for (var i = 0; i < 4; i++) {
                    expect(err[i] instanceof TypeError).toBe(true);
                    expect(err[i].message).toBe("Empty or undefined query.");
                }
            }
        })
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
