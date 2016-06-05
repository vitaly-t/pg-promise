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

var PreparedStatementError = pgp.errors.PreparedStatementError;

function dummy() {
    // dummy/empty function;
}

describe("PreparedStatement", function () {

    describe("non-class initialization", function () {
        it("must return a new object", function () {
            var ps = pgp.PreparedStatement('test-name', 'test-query');
            expect(ps instanceof pgp.PreparedStatement).toBe(true);
        });
    });

    describe("parameter-object initialization", function () {
        it("must initialize correctly", function () {
            var ps = new pgp.PreparedStatement({name: 'test-name', text: 'test-query', values: [123]});
            expect(ps.parse()).toEqual({name: 'test-name', text: 'test-query', values: [123]});
        });
    });

    describe("property values", function () {
        var values = [1, 2, 3];
        it("must get correctly", function () {
            var ps = new pgp.PreparedStatement({
                name: 'original-name',
                text: 'original-sql',
                values: values,
                binary: true,
                rowMode: 'array',
                rows: 1
            });
            expect(ps.name).toBe('original-name');
            expect(ps.text).toBe('original-sql');
            expect(ps.values).toBe(values);
            expect(ps.binary).toBe(true);
            expect(ps.rowMode).toBe('array');
            expect(ps.rows).toBe(1);
            expect(ps.inspect()).toBe(ps.toString());
        });
        it("must keep original object when set to the same value", function () {
            var ps = new pgp.PreparedStatement({
                name: 'original-name',
                text: 'original-sql',
                values: values,
                binary: true,
                rowMode: 'array',
                rows: 1
            });
            var obj1 = ps.parse();
            ps.name = 'original-name';
            ps.text = 'original-sql';
            ps.values = values;
            ps.binary = true;
            ps.rowMode = 'array';
            ps.rows = 1;
            var obj2 = ps.parse();
            expect(obj1 === obj2).toBe(true);
            expect(ps.inspect()).toBe(ps.toString());
        });
        it("must create a new object when changed", function () {
            var ps = new pgp.PreparedStatement({
                name: 'original-name',
                text: 'original-sql',
                values: values,
                binary: true,
                rowMode: 'array',
                rows: 1
            });
            var obj1 = ps.parse();
            ps.name = 'new value';
            var obj2 = ps.parse();
            ps.text = 'new text';
            var obj3 = ps.parse();
            ps.values = [1, 2, 3];
            var obj4 = ps.parse();
            ps.binary = false;
            var obj5 = ps.parse();
            ps.rowMode = 'new';
            var obj6 = ps.parse();
            ps.rows = 3;
            var obj7 = ps.parse();
            expect(obj1 !== obj2 !== obj3 !== obj4 != obj5 != obj6 != obj7).toBe(true);
            expect(ps.inspect()).toBe(ps.toString());
        });
    });

    describe("parameters", function () {
        var ps = new pgp.PreparedStatement('test-name', 'test-query', [123]);
        it("must expose the values correctly", function () {
            expect(ps.name).toBe('test-name');
            expect(ps.text).toBe('test-query');
            expect(ps.values).toEqual([123]);
            // setting to the same values, for coverage:
            ps.name = ps.name;
            ps.text = ps.text;
        });
        it("must set the values correctly", function () {
            ps.name = "new-name";
            ps.text = "new-query";
            ps.values = [456];
            expect(ps.name).toBe("new-name");
            expect(ps.text).toBe("new-query");
            expect(ps.values).toEqual([456]);
        });
    });

    describe("valid, without parameters", function () {
        var result, ps = new pgp.PreparedStatement('test', 'select 1 as value');
        beforeEach(function (done) {
            db.one(ps)
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
        var result, ps = new pgp.PreparedStatement('test', 'select count(*) from users where login = $1', ['non-existing']);
        beforeEach(function (done) {
            db.one(ps)
                .then(function (data) {
                    result = data;
                }).catch(function (error) {
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

    describe("object inspection", function () {
        var ps1 = new pgp.PreparedStatement('test-name', 'test-query $1');
        var ps2 = new pgp.PreparedStatement('test-name', 'test-query $1', [123]);
        it("must stringify all values", function () {
            expect(ps1.inspect()).toBe(ps1.toString());
            expect(ps2.inspect()).toBe(ps2.toString());
        });
    });

    describe("with QueryFile", function () {

        describe("successful", function () {
            var f = path.join(__dirname, './sql/simple.sql');
            var qf = new pgp.QueryFile(f, {compress: true});
            var ps = new pgp.PreparedStatement('test-name', qf);
            var result = ps.parse();
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.name).toBe('test-name');
            expect(result.text).toBe('select 1;');
            expect(ps.toString()).toBe(ps.inspect());
        });

        describe("with error", function () {
            var qf = new pgp.QueryFile('./invalid.sql');
            var ps = new pgp.PreparedStatement('test-name', qf);
            var result = ps.parse();
            expect(result instanceof pgp.errors.PreparedStatementError).toBe(true);
            expect(result.error instanceof pgp.errors.QueryFileError).toBe(true);
            expect(ps.toString()).toBe(ps.inspect());
        });
    });

});

describe("Direct Prepared Statements", function () {

    describe("valid, without parameters", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                name: "get all users",
                text: "select * from users",
                values: []
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
                name: "find one user",
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
        it("must return one user", function () {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe("valid, with parameters override", function () {
        var result;
        beforeEach(function (done) {
            db.one({
                name: "find one user",
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

    describe("with invalid query", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                name: "break it",
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

    describe("with an empty 'name'", function () {
        var result;
        var ps = new pgp.PreparedStatement({name: "", text: "non-empty"});
        beforeEach(function (done) {
            db.query(ps)
                .then(dummy, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result instanceof PreparedStatementError).toBe(true);
            expect(ps.toString(1) != ps.inspect()).toBe(true);
            expect(result.toString()).toBe(result.inspect());
        });
    });

    describe("with an empty 'text'", function () {
        var result;
        beforeEach(function (done) {
            db.query({
                name: "non-empty",
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
            expect(result instanceof PreparedStatementError).toBe(true);
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
