'use strict';

var QueryStream = require('pg-query-stream');
var JSONStream = require('JSONStream');
var header = require('./db/header');
var promise = header.defPromise;

var options = {
    promiseLib: promise
};

var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

if (options.pgNative) {
    return; // streams do not work with native bindings;
}

function dummy() {
    // dummy/empty function;
}

describe("Method stream", function () {
    describe("with invalid stream object", function () {
        var result;
        beforeEach(function (done) {
            promise.any([
                db.stream(),
                db.stream(null),
                db.stream('test'),
                db.stream({})
            ])
                .then(dummy, function (reason) {
                    result = reason;
                    done();
                });
        });
        it("must throw an error", function () {
            expect(result.length).toBe(4);
            for (var i = 0; i < result.length; i++) {
                expect(result[i] instanceof TypeError).toBe(true);
                expect(result[i].message).toBe("Invalid or missing stream object.");
            }
        });
    });
    describe("with invalid stream state", function () {
        var result;
        beforeEach(function (done) {
            promise.any([
                db.stream({
                    _reading: true,
                    state: undefined
                }),
                db.stream({
                    _reading: false,
                    state: 'unknown'
                })
            ])
                .then(dummy, function (reason) {
                    result = reason;
                    done();
                });
        });
        it("must throw an error", function () {
            expect(result.length).toBe(2);
            for (var i = 0; i < result.length; i++) {
                expect(result[i] instanceof Error).toBe(true);
                expect(result[i].message).toBe("Invalid stream state.");
            }
        });
        describe("with invalid initialization callback", function () {
            var result;
            beforeEach(function (done) {
                var stream = {
                    _reading: false,
                    state: 'initialized'
                };
                promise.any([
                    db.stream(stream),
                    db.stream(stream, null),
                    db.stream(stream, 123),
                    db.stream(stream, {})
                ])
                    .then(dummy, function (reason) {
                        result = reason;
                        done();
                    })
            });
            it("must throw an error", function () {
                expect(result.length).toBe(4);
                for (var i = 0; i < result.length; i++) {
                    expect(result[i] instanceof TypeError).toBe(true);
                    expect(result[i].message).toBe("Invalid or missing stream initialization callback.");
                }
            });
        });
        describe("with initialization callback throwing error", function () {
            var result;
            beforeEach(function (done) {
                var stream = {
                    _reading: false,
                    state: 'initialized'
                };
                db.stream(stream, function () {
                    throw new Error("initialization error");
                })
                    .then(dummy, function (reason) {
                        result = reason;
                        done();
                    })
            });
            it("must throw an error", function () {
                expect(result instanceof Error);
                expect(result.message).toBe("initialization error");
            });
        });

        describe("throwing error during query notification", function () {
            var result;
            beforeEach(function (done) {
                options.query = function () {
                    throw new Error("query notification error");
                };
                db.stream({
                    _reading: false,
                    state: 'initialized'
                }, dummy)
                    .then(dummy, function (reason) {
                        result = reason;
                        done();
                    });
            });
            it("must reject with the same error", function () {
                expect(result instanceof Error).toBe(true);
                expect(result.message).toBe("query notification error");
            });
            afterEach(function () {
                options.query = null;
            });
        });

        describe("with a valid request", function () {
            var result, count = 0, context, initCtx;
            var qs = new QueryStream("select * from users where id=$1", [1]);
            beforeEach(function (done) {
                options.query = function (e) {
                    context = e;
                    count++;
                };
                db.stream.call(qs, qs, function (stream) {
                    initCtx = this;
                    stream.pipe(JSONStream.stringify());
                })
                    .then(function (data) {
                        result = data;
                    }, dummy)
                    .finally(function () {
                        done();
                    });
            });
            it("must return the correct data and provide notification", function () {
                expect(typeof(result)).toBe('object');
                expect(result.processed).toBe(1);
                expect(result.duration >= 0).toBe(true);
                expect(count).toBe(1);
                expect(context.query).toBe("select * from users where id=$1");
                expect(JSON.stringify(context.params)).toBe('["1"]');
                expect(initCtx).toBe(qs);
            });
            afterEach(function () {
                options.query = null;
            });
        });

        describe("with invalid request", function () {
            var result, err, context, count = 0;
            beforeEach(function (done) {
                options.error = function (error, e) {
                    err = error;
                    context = e;
                    count++;
                };
                var qs = new QueryStream('select * from unknown where id=$1', [1]);
                db.stream(qs, function (stream) {
                    stream.pipe(JSONStream.stringify());
                })
                    .then(dummy, function (reason) {
                        result = reason;
                    })
                    .finally(function () {
                        done();
                    });
            });
            it("must return the correct data and provide notification", function () {
                expect(result instanceof Error).toBe(true);
                expect(result.message).toBe('relation "unknown" does not exist');
                expect(count).toBe(1);
                expect(context.query).toBe("select * from unknown where id=$1");
                expect(JSON.stringify(context.params)).toBe('["1"]');
                expect(err instanceof Error).toBe(true);
                expect(err.message).toBe('relation "unknown" does not exist');
            });
            afterEach(function () {
                options.error = null;
            });
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
