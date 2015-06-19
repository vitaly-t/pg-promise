var promise = require('bluebird');

var options = {}; // options, if needed;

var pgClient = require('pg/lib/client');
var dbHeader = require('./db/header')(options);

var pgp = dbHeader.pgp;
var db = dbHeader.db;

var func = function () {
};

describe("Connect/Disconnect events", function () {

    describe("during a query", function () {
        var p1, p2, connect = 0, disconnect = 0;
        beforeEach(function (done) {
            options.connect = function (client) {
                p1 = client;
                connect++;
                throw new Error("in connect");
            };
            options.disconnect = function (client) {
                p2 = client;
                disconnect++;
                throw new Error("in disconnect");
            };
            db.query("select 'test'")
                .finally(function () {
                    done();
                });
        });
        it("must be sent correctly", function () {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            expect(p1 instanceof pgClient).toBe(true);
            expect(p2 instanceof pgClient).toBe(true);
        });
    });

    describe("during a transaction", function () {
        var p1, p2, connect = 0, disconnect = 0;
        beforeEach(function (done) {
            options.connect = function (client) {
                p1 = client;
                connect++;
            };
            options.disconnect = function (client) {
                p2 = client;
                disconnect++;
            };
            db.tx(function (t) {
                return promise.all([
                    t.query("select 'one'"),
                    t.query("select 'two'"),
                    t.query("select 'three'")
                ]);
            })
                .finally(function () {
                    done();
                });
        });
        it("must be sent correctly", function () {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            expect(p1 instanceof pgClient).toBe(true);
            expect(p2 instanceof pgClient).toBe(true);
        });
    });
});

describe("Query event", function () {

    describe("with valid handler", function () {
        var param, counter = 0;
        beforeEach(function (done) {
            options.query = function (e) {
                counter++;
                param = e;
                throw new Error("in query");
            };
            db.query("select $1", [123])
                .finally(function () {
                    done();
                });
        });
        afterEach(function () {
            options.query = null;
        });
        it("must pass query and parameters correctly", function () {
            expect(counter).toBe(1);
            expect(param.query).toBe('select 123');
        });
    });

    describe("with invalid handler", function () {
        var error;
        beforeEach(function (done) {
            options.query = 123;
            db.query("select $1", [123])
                .then(function () {

                }, function (reason) {
                    error = reason;
                }).finally(function () {
                    done();
                });
        });
        afterEach(function () {
            options.query = null;
        });
        it("must reject with correct error", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Type 'function' was expected for property 'options.query'");
        });
    });

});

describe("Start/Finish transaction events", function () {
    var result, tag, ctx, start = 0, finish = 0;
    beforeEach(function (done) {
        options.transact = function (e) {
            if (e.ctx.finish) {
                finish++;
                ctx = e.ctx;
            } else {
                start++;
                tag = e.ctx.tag;
            }
            throw "in transact";
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
    it("must execute correctly", function () {
        expect(result).toBe('SUCCESS');
        expect(start).toBe(1);
        expect(finish).toBe(1);
        expect(tag).toBe("myTransaction");
        expect(ctx.success).toBe(true);
    });
});

describe("Error event", function () {

    describe("from transaction callbacks", function () {
        var r, error, ctx, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                ctx = e.ctx;
                throw new Error("in error");
            };
            db.tx("Error Transaction", function () {
                throw new Error("Test Error");
            })
                .then(function () {
                }, function (reason) {
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
            expect(ctx.tag).toBe("Error Transaction");
        });
    });

    describe("for null-queries", function () {
        var txt, ctx, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                txt = err;
                ctx = e;
            };
            db.query(null)
                .finally(function () {
                    done();
                });
        });
        it("must fail correctly", function () {
            var msg = "Parameter 'query' must be a non-empty text string.";
            expect(txt).toBe(msg);
            expect(ctx.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    describe("for incorrect QRM", function () {
        var txt, ctx, counter = 0;
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                txt = err;
                ctx = e;
            };
            db.query("Bla-Bla", undefined, 42)
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            var msg = "Invalid Query Result Mask specified.";
            expect(txt).toBe(msg);
            expect(ctx.query).toBe("Bla-Bla");
            expect(ctx.params).toBeUndefined();
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
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(errTxt).toBe("Single row was expected from the query.");
            expect(context.query).toBe("select * from users");
            expect(context.params).toBeUndefined();
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
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(errTxt).toBe("No return data was expected from the query.");
            expect(context.query).toBe("select * from users");
            expect(context.params).toBeUndefined();
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
                .finally(function () {
                    done();
                });
        });
        it("must reject with correct error", function () {
            expect(errTxt).toBe("No data returned from the query.");
            expect(context.query).toBe("select * from users where id > 1000");
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    describe("for invalid parameters", function () {
        var error, context, counter = 0, params = {};
        beforeEach(function (done) {
            options.error = function (err, e) {
                counter++;
                error = err;
                context = e;
            };
            db.query("${test}", params)
                .finally(function () {
                    done();
                });
        });
        it("must report the parameters correctly", function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("Property 'test' doesn't exist.");
            expect(context.query).toBe("${test}");
            expect(context.params).toBe(params);
            expect(counter).toBe(1);
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
