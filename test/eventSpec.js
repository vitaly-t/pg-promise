var promise = require('bluebird');

var options = {}; // options, if needed;

var dbHeader = require('./db/header')(options);

var pgp = dbHeader.pgp;
var db = dbHeader.db;

var func = function () {
};

describe("Connect/Disconnect notification events", function () {

    it("must each execute once during a query", function () {
        var stop, connected = 0, disconnected = 0;
        options.connect = function () {
            connected++;
        };
        options.disconnect = function () {
            disconnected++;
        };
        db.query("select 'test'")
            .then(function () {
                stop = true;
            });
        waitsFor(function () {
            return stop;
        }, "Query timed out", 5000);
        runs(function () {
            expect(connected).toBe(1);
            expect(disconnected).toBe(1);
        });
    });

    it("must each execute once during a transaction", function () {
        var stop, connected = 0, disconnected = 0;
        options.connect = function () {
            connected++;
        };
        options.disconnect = function () {
            disconnected++;
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
            expect(connected).toBe(1);
            expect(disconnected).toBe(1);
        });
    });

});

describe("Query event", function () {

    it("must pass query and parameters correctly", function () {
        var stop, p, counter = 0;
        options.query = function (e) {
            counter++;
            p = e;
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
            expect(p.query).toBe('select 123');
        });
    });
});

describe("Start/Finish transaction events", function () {

    it("must execute each once for every transaction, with the right properties", function () {
        var result, tag, start = 0, finish = 0, finishContext;
        options.transact = function (e) {
            if (e.ctx.finish) {
                finish++;
                finishContext = e.ctx;
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
            expect(finishContext.success).toBe(true);
        });
    });
});

describe("Error event", function () {

    it("must report errors from transaction callbacks", function () {
        var result, error, context, r, counter = 0;
        options.error = function (err, e) {
            counter++;
            error = err;
            context = e.ctx;
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
            expect(context.tag).toBe("Error Transaction");
        });
    });

    it("must handle null-query", function () {
        var result, errTxt, context, counter = 0;
        options.error = function (err, e) {
            counter++;
            errTxt = err;
            context = e;
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
            expect(errTxt).toBe("Parameter 'query' must be a non-empty text string.");
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    it("must handle incorrect QRM", function () {
        var result, errTxt, context, counter = 0;
        options.error = function (err, e) {
            counter++;
            errTxt = err;
            context = e;
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
            expect(errTxt).toBe("Invalid Query Result Mask specified.");
            expect(context.query).toBe("Bla-Bla");
            expect(context.params).toBeUndefined();
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

