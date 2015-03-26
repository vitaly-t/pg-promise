var pgpLib = require('../index');
var promise = require('promise');

var options = {};

var pgp = pgpLib(options); // initializing the library;

var cn = {
    host: 'localhost',
    port: 5432,
    database: 'pg_promise_test',
    user: 'postgres'
};

var db = pgp(cn);

describe("Database", function () {
    it("must be able to connect", function () {
        var status = 'connecting';
        var error = '';
        db.connect()
            .then(function (obj) {
                status = 'success';
                obj.done();
            }, function (reason) {
                error = reason.message;
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
            expect(error).toBe('');
        });
    });
});

describe("Selecting one static value", function () {

    it("must return the value via property", function () {
        var result;
        db.one('select 123 as value')
            .then(function (data) {
                result = data.value;
            }, function () {
                result = null;
            });

        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);

        runs(function () {
            expect(result).toBe(123);
        });
    });
});

describe("A complex transaction", function () {
    it("must resolve all objects correctly", function () {
        var result, error;
        db.tx(function (ctx) {
            var queries = [
                ctx.none('drop table if exists users'),
                ctx.none('create table users(id serial, name text)')
            ];
            for (var i = 0; i < 10; i++) {
                queries.push(ctx.none('insert into users(name) values($1)', 'name-' + (i + 1)));
            }
            queries.push(ctx.one('select count(*) from users'));
            return promise.all(queries);
        }).then(function (data) {
            result = data;
        }, function (reason) {
            result = null;
            error = reason;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(13); // drop + create + insert x 10 + select;
            var last = result[result.length - 1]; // result from the select;
            expect(typeof(last)).toBe('object');
            expect(last.count).toBe('10'); // last one must be the counter (as text);
        });
    });
});

describe("A nested transaction (10 levels)", function () {
    it("must work the same no matter how many levels", function () {
        var result, error;
        db.tx(function (ctx) {
            return ctx.tx(function () {
                return ctx.tx(function () {
                    return ctx.tx(function () {
                        return ctx.tx(function () {
                            return ctx.tx(function () {
                                return promise.all([
                                    ctx.one("select 'Hello' as word"),
                                    ctx.tx(function () {
                                        return ctx.tx(function () {
                                            return ctx.tx(function () {
                                                return ctx.tx(function () {
                                                    return ctx.one("select 'World!' as word");
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
        }).then(function (data) {
            result = data;
        }, function (reason) {
            result = null;
            error = reason;
        });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe(undefined);
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].word).toBe('Hello');
            expect(result[1].word).toBe('World!');
        });
    });
});

var _finishCallback = jasmine.Runner.prototype.finishCallback;
jasmine.Runner.prototype.finishCallback = function () {
    // Run the old finishCallback
    _finishCallback.bind(this)();

    pgp.end(); // closing pg database application pool;
};
