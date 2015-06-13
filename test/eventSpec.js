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
        var stop, p1, p2, connect = 0, disconnect = 0;
        options.connect = function (client) {
            p1 = client;
            connect++;
        };
        options.disconnect = function (client) {
            p2 = client;
            disconnect++;
        };
        db.query("select 'test'")
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            expect(p1 instanceof pgClient).toBe(true);
            expect(p2 instanceof pgClient).toBe(true);
        });
    });

    it("must be sent correctly during a transaction", function () {
        var stop, p1, p2, connect = 0, disconnect = 0;
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
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            expect(p1 instanceof pgClient).toBe(true);
            expect(p2 instanceof pgClient).toBe(true);
        });
    });

});

describe("Query event", function () {

    it("must pass query and parameters correctly", function () {
        var stop, param, counter = 0;
        options.query = function (e) {
            counter++;
            param = e;
        };
        db.query("select $1", [123])
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(counter).toBe(1);
            expect(param.query).toBe('select 123');
        });
    });
});

describe("Start/Finish transaction events", function () {

    it("must execute correctly", function () {
        var result, tag, ctx, start = 0, finish = 0;
        options.transact = function (e) {
            if (e.ctx.finish) {
                finish++;
                ctx = e.ctx;
            } else {
                start++;
                tag = e.ctx.tag;
            }
        };
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
            expect(start).toBe(1);
            expect(finish).toBe(1);
            expect(tag).toBe("myTransaction");
            expect(ctx.success).toBe(true);
        });
    });
});

describe("Error event", function () {

    it("must report errors from transaction callbacks", function () {
        var result, r, error, ctx, counter = 0;
        options.error = function (err, e) {
            counter++;
            error = err;
            ctx = e.ctx;
        };
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
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Test Error');
            expect(counter).toBe(1);
            expect(ctx.tag).toBe("Error Transaction");
        });
    });

    it("must handle null-query", function () {
        var result, txt, ctx, counter = 0;
        options.error = function (err, e) {
            counter++;
            txt = err;
            ctx = e;
        };
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
            expect(txt).toBe(msg);
            expect(ctx.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    it("must handle incorrect QRM", function () {
        var result, txt, ctx, counter = 0;
        options.error = function (err, e) {
            counter++;
            txt = err;
            ctx = e;
        };
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
            expect(txt).toBe(msg);
            expect(ctx.query).toBe("Bla-Bla");
            expect(ctx.params).toBeUndefined();
            expect(counter).toBe(1);
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
        var params = 'one';
        options.error = function (err, e) {
            counter++;
            error = err;
            context = e;
        };
        db.query("empty", params)
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
            expect(error.message).toBe("No variable $1 found to replace with the value passed.");
            expect(context.query).toBe("empty");
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

