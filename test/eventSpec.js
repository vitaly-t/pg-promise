var promise = require('bluebird');

var options = {}; // options, if needed;

var pgClient = require('pg/lib/client');
var dbHeader = require('./db/header')(options);

var pgp = dbHeader.pgp;
var db = dbHeader.db;

var func = function () {
};

describe("Connect/Disconnect events", function () {

    it("must be sent correctly during a query", function () {
        var stop, c1 = 0, c2 = 0, d1 = 0, d2 = 0, params = [];
        options.connect = function (client) {
            params.push(client);
            c1++;
        };
        options.disconnect = function (client) {
            params.push(client);
            d1++;
        };
        db.on("connect", function (client) {
            params.push(client);
            c2++;
        });
        db.on("disconnect", function (client) {
            params.push(client);
            d2++;
        });
        db.query("select 'test'")
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(c1).toBe(1);
            expect(c2).toBe(1);
            expect(d1).toBe(1);
            expect(d2).toBe(1);
            for (var i = 0; i < 4; i++) {
                expect(params[i] instanceof pgClient).toBe(true);
            }
        });
    });

    it("must be sent correctly during a transaction", function () {
        var stop, c1 = 0, c2 = 0, d1 = 0, d2 = 0, params = [];
        options.connect = function (client) {
            params.push(client);
            c1++;
        };
        options.disconnect = function (client) {
            params.push(client);
            d1++;
        };
        db.on("connect", function (client) {
            params.push(client);
            c2++;
        });
        db.on("disconnect", function (client) {
            params.push(client);
            d2++;
        });
        db.tx(function (t) {
            return promise.all([
                t.query("select 'one'"),
                t.query("select 'two'"),
                t.query("select 'three'")
            ]);
        })
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(c1).toBe(1);
            expect(c2).toBe(1);
            expect(d1).toBe(1);
            expect(d2).toBe(1);
            for (var i = 0; i < 4; i++) {
                expect(params[i] instanceof pgClient).toBe(true);
            }
        });
    });

});

describe("Query event", function () {

    it("must pass query and parameters correctly", function () {
        var stop, p1, p2, c1 = 0, c2 = 0;
        options.query = function (e) {
            c1++;
            p1 = e;
        };
        db.on('query', function (e) {
            c2++;
            p2 = e;
        });
        db.query("select $1", [123])
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(c1).toBe(1);
            expect(c2).toBe(1);
            expect(p1.query).toBe('select 123');
            expect(p2.query).toBe('select 123');
        });
    });
});

describe("Start/Finish transaction events", function () {

    it("must execute correctly", function () {
        var result, tag1, tag2, ctx1, ctx2,
            start1 = 0, start2 = 0, finish1 = 0, finish2 = 0;
        options.transact = function (e) {
            if (e.ctx.finish) {
                finish1++;
                ctx1 = e.ctx;
            } else {
                start1++;
                tag1 = e.ctx.tag;
            }
        };
        db.on('transact', function (e) {
            if (e.ctx.finish) {
                finish2++;
                ctx2 = e.ctx;
            } else {
                start2++;
                tag2 = e.ctx.tag;
            }
        });
        db.tx("myTransaction", function () {
            return promise.resolve('SUCCESS');
        }).then(function (data) {
            result = data;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(result).toBe('SUCCESS');
            expect(start1).toBe(1);
            expect(start2).toBe(1);
            expect(finish1).toBe(1);
            expect(finish2).toBe(1);
            expect(tag1).toBe("myTransaction");
            expect(tag2).toBe("myTransaction");
            expect(ctx1.success).toBe(true);
            expect(ctx2.success).toBe(true);
        });
    });
});

describe("Error event", function () {

    it("must report errors from transaction callbacks", function () {
        var result, r, error1, error2, ctx1, ctx2, c1 = 0, c2 = 0;
        options.error = function (err, e) {
            c1++;
            error1 = err;
            ctx1 = e.ctx;
        };
        db.on('error', function (err, e) {
            c2++;
            error2 = err;
            ctx2 = e.ctx;
        });
        db.tx("Error Transaction", function () {
            throw new Error("Test Error");
        }).then(function () {
        }, function (reason) {
            r = reason;
            result = null;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(r instanceof Error).toBe(true);
            expect(r.message).toBe('Test Error');
            expect(error1 instanceof Error).toBe(true);
            expect(error2 instanceof Error).toBe(true);
            expect(error1.message).toBe('Test Error');
            expect(error2.message).toBe('Test Error');
            expect(c1).toBe(1);
            expect(c2).toBe(1);
            expect(ctx1.tag).toBe("Error Transaction");
            expect(ctx2.tag).toBe("Error Transaction");
        });
    });

    it("must handle null-query", function () {
        var result, txt1, txt2, ctx1, ctx2, c1 = 0, c2 = 0;
        options.error = function (err, e) {
            c1++;
            txt1 = err;
            ctx1 = e;
        };
        db.on('error', function (err, e) {
            c2++;
            txt2 = err;
            ctx2 = e;
        });
        db.query(null)
            .then(function () {
                result = null;
            }, function (reason) {
                result = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            var msg = "Parameter 'query' must be a non-empty text string.";
            expect(txt1).toBe(msg);
            expect(txt2).toBe(msg);
            expect(ctx1.params).toBeUndefined();
            expect(ctx2.params).toBeUndefined();
            expect(c1).toBe(1);
            expect(c2).toBe(1);
        });
    });

    it("must handle incorrect QRM", function () {
        var result, txt1, txt2, ctx1, ctx2, c1 = 0, c2 = 0;
        options.error = function (err, e) {
            c1++;
            txt1 = err;
            ctx1 = e;
        };
        db.on('error', function (err, e) {
            c2++;
            txt2 = err;
            ctx2 = e;
        });
        db.query("Bla-Bla", undefined, 42)
            .then(function () {
                result = null;
            }, function (reason) {
                result = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            var msg = "Invalid Query Result Mask specified.";
            expect(txt1).toBe(msg);
            expect(txt2).toBe(msg);
            expect(ctx1.query).toBe("Bla-Bla");
            expect(ctx2.query).toBe("Bla-Bla");
            expect(ctx1.params).toBeUndefined();
            expect(ctx2.params).toBeUndefined();
            expect(c1).toBe(1);
            expect(c2).toBe(1);
        });
    });

    it("must handle single-row requests", function () {
        var result, errTxt, context, counter = 0;
        options.error = function (err, e) {
            counter++;
            errTxt = err;
            context = e;
        };
        db.one("select * from users")
            .then(function () {
                result = null;
            }, function (reason) {
                result = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(errTxt).toBe("Single row was expected from the query.");
            expect(context.query).toBe("select * from users");
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    it("must handle no-row requests", function () {
        var result, errTxt, context, counter = 0;
        options.error = function (err, e) {
            counter++;
            errTxt = err;
            context = e;
        };
        db.none("select * from users")
            .then(function () {
                result = null;
            }, function (reason) {
                result = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(errTxt).toBe("No return data was expected from the query.");
            expect(context.query).toBe("select * from users");
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    it("must handle empty requests", function () {
        var result, errTxt, context, counter = 0;
        options.error = function (err, e) {
            counter++;
            errTxt = err;
            context = e;
        };
        db.many("select * from users where id > $1", 1000)
            .then(function () {
                result = null;
            }, function (reason) {
                result = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(errTxt).toBe("No data returned from the query.");
            expect(context.query).toBe("select * from users where id > 1000");
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    it("must report passed parameters when needed", function () {
        var result, error, context, counter = 0;
        var params = ['one', 'two'];
        options.error = function (err, e) {
            counter++;
            error = err;
            context = e;
        };
        db.query("$1", params)
            .then(function () {
                result = null;
            }, function (reason) {
                result = reason;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe("No variable $2 found for the value with index 1");
            expect(context.query).toBe("$1");
            expect(context.params).toBe(params);
            expect(counter).toBe(1);
        });
    });

});

var _finishCallback = jasmine.Runner.prototype.finishCallback;
jasmine.Runner.prototype.finishCallback = function () {
    // Run the old finishCallback:
    _finishCallback.bind(this)();

    pgp.end(); // closing pg database application pool;
};

