'use strict';

var path = require('path');
var fs = require('fs');
var pgResult = require('pg/lib/result');
var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise
};
var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

var ParameterizedQueryError = pgp.errors.ParameterizedQueryError;

function dummy() {
    // dummy/empty function;
}

describe("ParameterizedQuery", function () {

    describe("non-class initialization", function () {
        it("must return a new object", function () {
            var pq = pgp.ParameterizedQuery('test-query');
            expect(pq instanceof pgp.ParameterizedQuery).toBe(true);
        });
    });

    describe("parameter-object initialization", function () {
        it("must initialize correctly", function () {
            var pq = new pgp.ParameterizedQuery({text: 'test-query', values: [123]});
            expect(pq.parse()).toEqual({text: 'test-query', values: [123]});
        });
    });

    describe("property values", function () {
        var values = [1, 2, 3];
        it("must get correctly", function () {
            var pq = new pgp.ParameterizedQuery({
                text: 'original-sql',
                values: values,
                binary: true,
                rowMode: 'array'
            });
            expect(pq.text).toBe('original-sql');
            expect(pq.values).toBe(values);
            expect(pq.binary).toBe(true);
            expect(pq.rowMode).toBe('array');
            expect(pq.inspect()).toBe(pq.toString());
        });
        it("must keep original object when set to the same value", function () {
            var pq = new pgp.ParameterizedQuery({
                text: 'original-sql',
                values: values,
                binary: true,
                rowMode: 'array'
            });
            var obj1 = pq.parse();
            pq.text = 'original-sql';
            pq.values = values;
            pq.binary = true;
            pq.rowMode = 'array';
            var obj2 = pq.parse();
            expect(obj1 === obj2).toBe(true);
            expect(pq.inspect()).toBe(pq.toString());
        });
        it("must create a new object when changed", function () {
            var pq = new pgp.ParameterizedQuery({
                text: 'original-sql',
                values: values,
                binary: true,
                rowMode: 'array'
            });
            var obj1 = pq.parse();
            pq.text = 'new text';
            var obj2 = pq.parse();
            pq.values = [1, 2, 3];
            var obj3 = pq.parse();
            pq.binary = false;
            var obj4 = pq.parse();
            pq.rowMode = 'new';
            var obj5 = pq.parse();
            expect(obj1 !== obj2 !== obj3 !== obj4 != obj5).toBe(true);
            expect(pq.inspect()).toBe(pq.toString());
        });
    });

    describe("parameters", function () {
        var pq = new pgp.ParameterizedQuery({text: 'test-query', values: [123], binary: true, rowMode: 'array'});
        it("must expose the values correctly", function () {
            expect(pq.text).toBe('test-query');
            expect(pq.values).toEqual([123]);
            expect(pq.binary).toBe(true);
            expect(pq.rowMode).toBe('array');
        });
    });

    describe("valid, without parameters", function () {
        var result, pq = new pgp.ParameterizedQuery('select 1 as value');
        beforeEach(function (done) {
            db.one(pq)
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return the right value", function () {
            expect(result && result.value === 1).toBeTruthy();
        });
    });

    describe("valid, with parameters", function () {
        var result, pq = new pgp.ParameterizedQuery('select count(*) from users where login = $1', ['non-existing']);
        beforeEach(function (done) {
            db.one(pq)
                .then(function (data) {
                    result = data;
                })
                .catch(function (error) {
                    console.log("ERROR:", error);
                })
                .finally(function () {
                    done();
                });
        });
        it("must return the right value", function () {
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.count).toBe('0');
        });
    });

    describe("valid, with parameters override", function () {
        var result;
        beforeEach(function (done) {
            db.one({
                text: "select * from users where id=$1"
            }, 1)
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return one user", function () {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe("object inspection", function () {
        var pq1 = new pgp.ParameterizedQuery('test-query $1');
        var pq2 = new pgp.ParameterizedQuery('test-query $1', []);
        it("must stringify all values", function () {
            expect(pq1.inspect()).toBe(pq1.toString());
            expect(pq2.inspect()).toBe(pq2.toString());
        });
    });

    describe("with QueryFile", function () {

        describe("successful", function () {
            var f = path.join(__dirname, './sql/simple.sql');
            var qf = new pgp.QueryFile(f, {compress: true});
            var pq = new pgp.ParameterizedQuery(qf);
            var result = pq.parse();
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.text).toBe('select 1;');
            expect(pq.toString()).toBe(pq.inspect());
        });

        describe("with an error", function () {
            var qf = new pgp.QueryFile('./invalid.sql');
            var pq = new pgp.ParameterizedQuery(qf);
            var result = pq.parse();
            expect(result instanceof ParameterizedQueryError).toBe(true);
            expect(result.error instanceof pgp.errors.QueryFileError).toBe(true);
            expect(pq.toString()).toBe(pq.inspect());
            expect(pq.toString(1) !== pq.inspect()).toBe(true);
        });

    });

});

describe("Direct Parameterized Query", function () {

    describe("valid, without parameters", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                text: "select * from users"
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return all users", function () {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe("valid, with parameters", function () {
        var result;
        beforeEach(function (done) {
            db.one({
                text: "select * from users where id=$1",
                values: [1]
            })
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return all users", function () {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe("with invalid query", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                text: "select * from somewhere"
            })
                .then(dummy, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toContain('relation "somewhere" does not exist');
        });
    });

    describe("with an empty 'text'", function () {
        var result;
        beforeEach(function (done) {
            db.query({
                text: null
            })
                .then(dummy, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result instanceof pgp.errors.ParameterizedQueryError).toBe(true);
            expect(result.toString()).toBe(result.inspect());
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
