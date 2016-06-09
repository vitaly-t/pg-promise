'use strict';

var PG = require('pg');
var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise,
    noLocking: true
};
var testDC = 'test_DC_123';
var dbHeader = header(options, testDC);
var pgpLib = dbHeader.pgpLib;
var pgp = dbHeader.pgp;
var db = dbHeader.db;

describe("Library instance", function () {

    it("must NOT have property 'pg'", function () {
        expect(pgpLib.pg).toBeUndefined();
    });

    it("must NOT have function 'end'", function () {
        expect(pgpLib.end).toBeUndefined();
    });

    it("must have valid property 'as'", function () {
        expect(pgpLib.as && typeof pgpLib.as === 'object').toBeTruthy();
        expect(pgpLib.as.text instanceof Function).toBe(true);
        expect(pgpLib.as.bool instanceof Function).toBe(true);
        expect(pgpLib.as.date instanceof Function).toBe(true);
        expect(pgpLib.as.array instanceof Function).toBe(true);
        expect(pgpLib.as.json instanceof Function).toBe(true);
        expect(pgpLib.as.csv instanceof Function).toBe(true);
        expect(pgpLib.as.number instanceof Function).toBe(true);
        expect(pgpLib.as.format instanceof Function).toBe(true);
        expect(pgpLib.as.func instanceof Function).toBe(true);
        expect(pgpLib.as.name instanceof Function).toBe(true);
        expect(pgpLib.as.value instanceof Function).toBe(true);
        expect(pgpLib.as.buffer instanceof Function).toBe(true);
    });

    it("must have all error types", function () {
        expect(pgp.errors && pgp.errors instanceof Object).toBeTruthy();
        expect(pgpLib.errors.QueryResultError instanceof Function).toBe(true);
        expect(pgpLib.errors.queryResultErrorCode instanceof Object).toBe(true);
        expect(pgpLib.errors.PreparedStatementError instanceof Function).toBe(true);
        expect(pgpLib.errors.ParameterizedQueryError instanceof Function).toBe(true);
    });

    it("must have function 'PromiseAdapter'", function () {
        expect(pgpLib.PromiseAdapter instanceof Function).toBe(true);
    });

    it("must have function 'PreparedStatement'", function () {
        expect(pgpLib.PreparedStatement instanceof Function).toBe(true);
    });

    it("must have function 'ParameterizedQuery'", function () {
        expect(pgpLib.ParameterizedQuery instanceof Function).toBe(true);
    });

    it("must have function 'minify'", function () {
        expect(pgpLib.minify instanceof Function).toBe(true);
    });

    it("must have valid property 'queryResult'", function () {
        expect(pgpLib.queryResult && typeof pgpLib.queryResult === 'object').toBeTruthy();
        expect(pgpLib.queryResult.one).toBe(1);
        expect(pgpLib.queryResult.many).toBe(2);
        expect(pgpLib.queryResult.none).toBe(4);
        expect(pgpLib.queryResult.any).toBe(6);
    });

});

describe("Initialized instance", function () {

    it("must have valid property 'pg'", function () {
        if (options.pgNative) {
            expect(typeof pgp.pg).toBe('object');
        } else {
            expect(pgp.pg).toBe(PG);
        }
    });

    it("must have function 'end'", function () {
        expect(pgp.end instanceof Function).toBe(true);
    });

    it("must have valid property 'as'", function () {
        expect(pgp.as && typeof pgp.as === 'object').toBeTruthy();
        expect(pgp.as).toBe(pgpLib.as);
    });

    it("must have all error types", function () {
        expect(pgp.errors && pgp.errors instanceof Object).toBeTruthy();
        expect(pgp.errors.QueryResultError instanceof Function).toBe(true);
        expect(pgp.errors.queryResultErrorCode instanceof Object).toBe(true);
        expect(pgp.errors.PreparedStatementError instanceof Function).toBe(true);
        expect(pgp.errors.ParameterizedQueryError instanceof Function).toBe(true);
    });

    it("must have function 'PromiseAdapter'", function () {
        expect(pgp.PromiseAdapter instanceof Function).toBe(true);
    });

    it("must have function 'PreparedStatement'", function () {
        expect(pgp.PreparedStatement instanceof Function).toBe(true);
    });

    it("must have function 'ParameterizedQuery'", function () {
        expect(pgp.ParameterizedQuery instanceof Function).toBe(true);
    });

    it("must have function 'minify'", function () {
        expect(pgp.minify instanceof Function).toBe(true);
    });

    it("must have valid property 'queryResult'", function () {
        expect(pgp.queryResult && typeof pgp.queryResult === 'object').toBeTruthy();
        expect(pgp.queryResult).toBe(pgpLib.queryResult);
    });

});

describe("Database Protocol", function () {

    it("must have all the root-level methods", function () {
        expect(typeof db.connect).toBe('function');
        expect(typeof db.task).toBe('function');
        expect(typeof db.query).toBe('function');
        expect(typeof db.result).toBe('function');
        expect(typeof db.tx).toBe('function');
        expect(typeof db.one).toBe('function');
        expect(typeof db.many).toBe('function');
        expect(typeof db.any).toBe('function');
        expect(typeof db.none).toBe('function');
        expect(typeof db.oneOrNone).toBe('function');
        expect(typeof db.manyOrNone).toBe('function');
        expect(typeof db.stream).toBe('function');
        expect(typeof db.func).toBe('function');
        expect(typeof db.proc).toBe('function');
        expect(typeof db.map).toBe('function');
        expect(typeof db.each).toBe('function');

        // must not have task-level methods:
        expect(db.batch).toBeUndefined();
        expect(db.page).toBeUndefined();
        expect(db.sequence).toBeUndefined();

        // must not have connection-level methods:
        expect(db.done).toBeUndefined();
        expect(db.client).toBeUndefined();

        // must have a hidden configurator;
        expect(db.$config && typeof db.$config === 'object').toBeTruthy();
        expect(db.$config.promise).toBeTruthy();
        expect(db.$config.promiseLib).toBeTruthy();
        expect(typeof db.$config.options).toBe('object');
        expect(typeof db.$config.pgp).toBe('function');
        expect(typeof db.$config.version).toBe('string');
        expect(typeof db.$config.$npm).toBe('object');
    });

    describe("on connection level", function () {

        var connection;
        beforeEach(function (done) {
            db.connect(function (t) {
                return promise.resolve(t);
            })
                .then(function (obj) {
                    connection = obj;
                })
                .finally(function () {
                    connection.done();
                    done();
                });
        });

        it("must have all the required methods", function () {
            expect(connection && typeof(connection) === 'object').toBe(true);
            expect(connection.connect).toBeUndefined();
            expect(typeof connection.query).toBe('function');
            expect(typeof connection.result).toBe('function');
            expect(typeof connection.tx).toBe('function');
            expect(typeof connection.tx).toBe('function');
            expect(typeof connection.one).toBe('function');
            expect(typeof connection.many).toBe('function');
            expect(typeof connection.any).toBe('function');
            expect(typeof connection.none).toBe('function');
            expect(typeof connection.oneOrNone).toBe('function');
            expect(typeof connection.manyOrNone).toBe('function');
            expect(typeof connection.stream).toBe('function');
            expect(typeof connection.func).toBe('function');
            expect(typeof connection.proc).toBe('function');
            expect(typeof connection.map).toBe('function');
            expect(typeof connection.each).toBe('function');

            expect(typeof connection.done).toBe('function');
            expect(typeof connection.client).toBe('object');
            expect(connection.$config).toBeUndefined();
        });
    });

    describe("on transaction level", function () {

        var protocol;
        beforeEach(function (done) {
            db.tx(function (t) {
                return promise.resolve(t);
            })
                .then(function (data) {
                    protocol = data;
                })
                .finally(function () {
                    done();
                });
        });

        it("must have all the required methods", function () {
            expect(protocol && typeof(protocol) === 'object').toBe(true);
            expect(protocol.connect).toBeUndefined();
            expect(protocol.client).toBeUndefined();
            expect(protocol.$config).toBeUndefined();
            expect(typeof protocol.query).toBe('function');
            expect(typeof protocol.result).toBe('function');
            expect(typeof protocol.task).toBe('function');
            expect(typeof protocol.tx).toBe('function');
            expect(typeof protocol.one).toBe('function');
            expect(typeof protocol.many).toBe('function');
            expect(typeof protocol.any).toBe('function');
            expect(typeof protocol.none).toBe('function');
            expect(typeof protocol.oneOrNone).toBe('function');
            expect(typeof protocol.manyOrNone).toBe('function');
            expect(typeof protocol.stream).toBe('function');
            expect(typeof protocol.func).toBe('function');
            expect(typeof protocol.proc).toBe('function');
            expect(typeof protocol.batch).toBe('function');
            expect(typeof protocol.page).toBe('function');
            expect(typeof protocol.sequence).toBe('function');
            expect(typeof protocol.map).toBe('function');
            expect(typeof protocol.each).toBe('function');
        });
    });

    describe("on task level", function () {

        var protocol;
        beforeEach(function (done) {
            db.task(function (t) {
                return promise.resolve(t);
            })
                .then(function (data) {
                    protocol = data;
                })
                .finally(function () {
                    done();
                });
        });

        it("must have all the required methods", function () {
            expect(protocol && typeof(protocol) === 'object').toBe(true);
            expect(protocol.connect).toBeUndefined();
            expect(protocol.client).toBeUndefined();
            expect(protocol.$config).toBeUndefined();
            expect(typeof(protocol.query)).toBe('function');
            expect(typeof(protocol.result)).toBe('function');
            expect(typeof(protocol.tx)).toBe('function');
            expect(typeof(protocol.task)).toBe('function');
            expect(typeof(protocol.one)).toBe('function');
            expect(typeof(protocol.many)).toBe('function');
            expect(typeof(protocol.any)).toBe('function');
            expect(typeof(protocol.none)).toBe('function');
            expect(typeof(protocol.oneOrNone)).toBe('function');
            expect(typeof(protocol.manyOrNone)).toBe('function');
            expect(typeof(protocol.stream)).toBe('function');
            expect(typeof(protocol.func)).toBe('function');
            expect(typeof(protocol.proc)).toBe('function');
            expect(typeof(protocol.batch)).toBe('function');
            expect(typeof(protocol.page)).toBe('function');
            expect(typeof(protocol.sequence)).toBe('function');
            expect(typeof(protocol.map)).toBe('function');
            expect(typeof(protocol.each)).toBe('function');
        });
    });

});

describe("Protocol Extension", function () {

    describe("on database level", function () {
        var result, dcParam, THIS, ctx, counter = 0;
        var pgpTest = header({
            promiseLib: header.defPromise,
            extend: function (obj, dc) {
                dcParam = dc;
                ctx = obj;
                THIS = this;
                counter++;
                this.getOne = function (query, values) {
                    return this.one(query, values);
                };
                throw new Error("### Testing error output in 'extend'. Please ignore. ###");
            }
        }, testDC);
        beforeEach(function (done) {
            pgpTest.db.getOne("select 'hello' as msg")
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must allow custom properties", function () {
            expect(THIS && ctx && THIS === ctx).toBeTruthy();
            expect(counter).toBe(1);
            expect(result.msg).toBe('hello');
            expect(dcParam).toBe(testDC);
        });
    });

    describe("on transaction level", function () {
        var result, THIS, ctx, counter = 0;
        var pgpTest = header({
            promiseLib: header.defPromise,
            extend: function (obj) {
                counter++;
                if (counter === 2) {
                    // we skip one for the database object,
                    // and into the `extend` for the transaction;
                    THIS = this;
                    ctx = obj;
                    obj.getOne = function (query, values) {
                        return obj.one(query, values);
                    };
                }
            }
        });

        beforeEach(function (done) {
            pgpTest.db.tx(function (t) {
                return t.getOne("select 'hello' as msg");
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });

        it("must allow custom properties", function () {
            expect(THIS && ctx && THIS === ctx).toBeTruthy();
            expect(counter).toBe(2);
            expect(result && typeof(result) === 'object').toBe(true);
            expect(result.msg).toBe('hello');
        });

    });
});

// SPEX tests are just for coverage, because the actual methods
// are properly tested within the spex library itself.
describe("spex", function () {

    describe("batch", function () {
        var result;
        beforeEach(function (done) {
            db.task(function () {
                return this.batch([1, 2]);
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must work in general", function () {
            expect(result).toEqual([1, 2]);
        })
    });

    describe("page", function () {
        var result;
        beforeEach(function (done) {
            function source() {
            }

            db.task(function () {
                return this.page(source);
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must work in general", function () {
            expect(result && typeof result === 'object').toBe(true);
            expect(result.pages).toBe(0);
            expect(result.total).toBe(0);
        })
    });

    describe("sequence", function () {
        var result;
        beforeEach(function (done) {
            function source() {
            }

            db.task(function () {
                return this.sequence(source);
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must work in general", function () {
            expect(result && typeof result === 'object').toBe(true);
            expect(result.total).toBe(0);
        });
    })
});

// This one is just for coverage;
describe("Error protocol", function () {

    var result = {
        rows: []
    };
    it("must return correctly formatted error body", function () {
        var error1 = new pgp.errors.QueryResultError(0, result, '');
        var error2 = new pgp.errors.QueryResultError(0, result, {name: 'name', text: 'text'}, []);
        expect(error1.inspect()).toBe(error1.toString());
        expect(error2.inspect()).toBe(error2.toString());
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
