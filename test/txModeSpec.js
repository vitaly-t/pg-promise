'use strict';

var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise
};
var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

describe("Transaction Mode", function () {

    describe("without parameters, capitalized", function () {
        var queries = [], result, ctx, context = {};
        beforeEach(function (done) {

            options.capSQL = true;
            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                ctx = this.ctx.context;
                return promise.resolve("success");
            }

            txNoParams.txMode = new pgp.txMode.TransactionMode();

            db.tx.call(context, txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute default transaction opening", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('BEGIN');
            expect(ctx).toBe(context);
        });
        afterEach(function () {
            delete options.query;
            delete options.capSQL;
        });
    });

    describe("initialized without new", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            txNoParams.txMode = pgp.txMode.TransactionMode();

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute default transaction opening", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin');
        });
        afterEach(function () {
            delete options.query;
        });
    });

    describe("with isolation level", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            txNoParams.txMode = new pgp.txMode.TransactionMode(pgp.txMode.isolationLevel.serializable);

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute correct command", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable');
        });
        afterEach(function () {
            delete options.query;
        });
    });

    describe("with access mode = read only", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            txNoParams.txMode = new pgp.txMode.TransactionMode({readOnly: true});

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute correct command", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin read only');
        });
        afterEach(function () {
            delete options.query;
        });
    });

    describe("with access mode = read/write", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            txNoParams.txMode = new pgp.txMode.TransactionMode({readOnly: false});

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute correct command", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin read write');
        });
        afterEach(function () {
            delete options.query;
        });
    });

    describe("with serializable and read-only", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            var level = pgp.txMode.isolationLevel;

            txNoParams.txMode = new pgp.txMode.TransactionMode({
                tiLevel: level.serializable,
                readOnly: true
            });

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute correct command", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable read only');
        });
        afterEach(function () {
            delete options.query;
        });
    });

    describe("with deferrable", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            var level = pgp.txMode.isolationLevel;

            txNoParams.txMode = new pgp.txMode.TransactionMode({
                tiLevel: level.serializable,
                readOnly: true,
                deferrable: true
            });

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute correct command", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable read only deferrable');
        });
        afterEach(function () {
            delete options.query;
        });
    });

    describe("with not deferrable", function () {
        var queries = [], result;
        beforeEach(function (done) {

            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve("success");
            }

            var level = pgp.txMode.isolationLevel;

            txNoParams.txMode = new pgp.txMode.TransactionMode({
                tiLevel: level.serializable,
                readOnly: true,
                deferrable: false
            });

            db.tx(txNoParams)
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must execute correct command", function () {
            expect(result).toBe("success");
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable read only not deferrable');
        });
        afterEach(function () {
            delete options.query;
        });
    });
    /*
     describe("with a combination", function () {
     var queries = [], result;
     beforeEach(function (done) {

     options.query = function (e) {
     queries.push(e.query);
     };

     function txNoParams() {
     return promise.resolve("success");
     }

     var level = pgp.txMode.isolationLevel;
     txNoParams.txMode = new pgp.txMode.TransactionMode(level.repeatableRead, true, false);

     db.tx(txNoParams)
     .then(function (data) {
     result = data;
     done();
     });
     });
     it("must execute correct command", function () {
     expect(result).toBe("success");
     expect(queries.length).toBe(2);
     expect(queries[0]).toBe('begin isolation level repeatable read read only not deferrable');
     });
     afterEach(function () {
     delete options.query;
     });
     });
     */
});

if (jasmine.Runner) {
    var _finishCallback = jasmine.Runner.prototype.finishCallback;
    jasmine.Runner.prototype.finishCallback = function () {
        // Run the old finishCallback:
        _finishCallback.bind(this)();

        pgp.end(); // closing pg database application pool;
    };
}
