'use strict';

var pgResult = require('pg/lib/result');
var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise
};
var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

function dummy() {
    // dummy/empty function;
}

var $errors = {
    query: "Invalid query format.",
    psNameClass: "'name' must be a non-empty text string.",
    psTextClass: "'text' must be a non-empty text string.",
    psValuesClass: "'values' must be an array or null/undefined.",
    psName: "Invalid 'name' in a prepared statement.",
    psText: "Invalid 'text' in a prepared statement.",
    psValues: "Invalid 'values' in a prepared statement."
};

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
            expect(ps.get()).toEqual({name: 'test-name', text: 'test-query', values: [123]});
        });
    });

    describe("parameters", function () {
        var ps = new pgp.PreparedStatement('test-name', 'test-query', [123]);
        it("must expose the values correctly", function () {
            expect(ps.name).toBe('test-name');
            expect(ps.text).toBe('test-query');
            expect(ps.values).toEqual([123]);
        });
        it("must set the values correctly", function () {
            ps.name = "new-name";
            ps.text = "new-query";
            ps.values = [456];
            expect(ps.name).toBe("new-name");
            expect(ps.text).toBe("new-query");
            expect(ps.values).toEqual([456]);
        });
        it("must throw on setting invalid values", function () {
            expect(function () {
                ps.name = ' ';
            }).toThrow(new TypeError($errors.psNameClass));
            expect(function () {
                ps.text = ' ';
            }).toThrow(new TypeError($errors.psTextClass));
            expect(function () {
                ps.values = 123;
            }).toThrow(new TypeError($errors.psValuesClass));
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
                }).catch(error=> {
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

    describe("create", function () {
        var ps = new pgp.PreparedStatement('test-name', 'test-query');
        it("must return correct object", function () {
            expect(ps.create()).toEqual({name: "test-name", text: "test-query"});
            expect(ps.create([123])).toEqual({name: "test-name", text: "test-query", values: [123]});
        });
        it("must throw on invalid values", function () {
            expect(function () {
                ps.create(123);
            }).toThrow(new TypeError($errors.psValuesClass));
        })
    });

    describe("format", function () {
        it("must return correct query", function () {
            var ps = new pgp.PreparedStatement('test-name', 'test-query $1', [123]);
            expect(ps.format()).toEqual('test-query 123');
        });
        it("must correctly use options", function () {
            var ps = new pgp.PreparedStatement('test-name', 'test-query $1, $2', [123]);
            expect(ps.format({partial: true})).toEqual('test-query 123, $2');
        })
    });

    describe("object inspection", function () {
        var ps1 = new pgp.PreparedStatement('test-name', 'test-query $1');
        var ps2 = new pgp.PreparedStatement('test-name', 'test-query $1', [123]);
        it("must stringify all values", function () {
            expect(ps1.inspect()).toBe(ps1.toString());
            expect(ps2.inspect()).toBe(ps2.toString());
        });
    });
});

describe("Direct Prepared Statements", function () {

    describe("valid, without parameters", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                    name: "get all users",
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
        it("must return all users", function () {
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

    describe("with invalid values", function () {
        var result;
        beforeEach(function (done) {
            db.many({
                    name: "invalid",
                    text: "select 1",
                    values: 123
                })
                .then(dummy, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result).toBe($errors.psValues);
        });
    });

    describe("with an empty 'name'", function () {
        var result;
        beforeEach(function (done) {
            db.query({
                    name: "",
                    text: "non-empty"
                })
                .then(dummy, function (reason) {
                    result = reason;
                })
                .finally(function () {
                    done();
                });
        });
        it("must return an error", function () {
            expect(result).toBe($errors.psName);
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
            expect(result).toBe($errors.psText);
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
