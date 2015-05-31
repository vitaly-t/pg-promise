var PG = require('pg');
var promise = require('bluebird');
var pgpLib = require('../lib/index');

var dbHeader = require('./db/header')();

var pgp = dbHeader.pgp;
var db = dbHeader.db;

describe("Library entry function", function () {

    it("must throw an error on invalid promise override", function () {
        expect(function () {
            pgpLib({
                promiseLib: "test"
            });
        }).toThrow("Invalid or unsupported promise library override.");
    });

    it("must throw an error on invalid 'options' parameter", function () {
        expect(function () {
            pgpLib(123);
        }).toThrow("Invalid parameter 'options' specified.");
    });

});

describe("Library instance", function () {

    it("must be a function", function () {
        expect(typeof(pgp)).toBe('function');
    });

    it("must have valid property 'pg'", function () {
        expect(typeof(pgp.pg)).toBe('object');
        expect(pgp.pg).toBe(PG); // the same library instance;
    });

    it("must have function 'end'", function () {
        expect(typeof(pgp.end)).toBe('function');
    });

    it("must have property 'version'", function () {
        expect(typeof(pgp.version)).toBe('object');
        expect(typeof(pgp.version.major)).toBe('number');
        expect(typeof(pgp.version.minor)).toBe('number');
        expect(typeof(pgp.version.patch)).toBe('number');
    });

    it("must have valid property 'as'", function () {
        expect(typeof(pgp.as)).toBe('object');
        expect(typeof(pgp.as.text)).toBe('function');
        expect(typeof(pgp.as.bool)).toBe('function');
        expect(typeof(pgp.as.date)).toBe('function');
        expect(typeof(pgp.as.array)).toBe('function');
        expect(typeof(pgp.as.json)).toBe('function');
        expect(typeof(pgp.as.csv)).toBe('function');
        expect(typeof(pgp.as.number)).toBe('function');
        expect(typeof(pgp.as.format)).toBe('function');
        expect(typeof(pgp.as.func)).toBe('function');
    });
});

describe("Query Result", function () {
    it("must be an object", function () {
        expect(typeof(queryResult)).toBe('object');
    });
    it("must have all properties set correctly", function () {
        expect(queryResult.one).toBe(1);
        expect(queryResult.many).toBe(2);
        expect(queryResult.none).toBe(4);
        expect(queryResult.any).toBe(6);
    });
});

describe("Database Protocol", function () {
    it("must have all the root-level methods", function () {
        expect(typeof(db.connect)).toBe('function');
        expect(typeof(db.query)).toBe('function');
        expect(typeof(db.raw)).toBe('function');
        expect(typeof(db.queryRaw)).toBe('function');
        expect(typeof(db.tx)).toBe('function');
        expect(typeof(db.transact)).toBe('function');
        expect(typeof(db.one)).toBe('function');
        expect(typeof(db.many)).toBe('function');
        expect(typeof(db.any)).toBe('function');
        expect(typeof(db.none)).toBe('function');
        expect(typeof(db.oneOrNone)).toBe('function');
        expect(typeof(db.manyOrNone)).toBe('function');
        expect(typeof(db.func)).toBe('function');
        expect(typeof(db.proc)).toBe('function');

        // must not have transaction-level methods:
        expect(db.sequence).toBeUndefined();
        expect(db.queue).toBeUndefined();
    });

    it("must have all the transaction-level methods", function () {
        var protocol;
        db.tx(function (t) {
            return promise.resolve(t);
        }).then(function (data) {
            protocol = data;
        }, function () {
            protocol = null;
        });

        waitsFor(function () {
            return protocol !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(protocol && typeof(protocol) === 'object').toBe(true);
            expect(protocol.connect).toBeUndefined();
            expect(typeof(protocol.query)).toBe('function');
            expect(typeof(protocol.queryRaw)).toBe('function');
            expect(typeof(protocol.raw)).toBe('function');
            expect(typeof(protocol.tx)).toBe('function');
            expect(typeof(protocol.transact)).toBe('function');
            expect(typeof(protocol.one)).toBe('function');
            expect(typeof(protocol.many)).toBe('function');
            expect(typeof(protocol.any)).toBe('function');
            expect(typeof(protocol.none)).toBe('function');
            expect(typeof(protocol.oneOrNone)).toBe('function');
            expect(typeof(protocol.manyOrNone)).toBe('function');
            expect(typeof(protocol.func)).toBe('function');
            expect(typeof(protocol.proc)).toBe('function');
            expect(typeof(protocol.sequence)).toBe('function');
            expect(typeof(protocol.queue)).toBe('function');
        });
    });
});

describe("Protocol Extension", function () {
    it("must allow custom properties on database level", function () {
        var result, counter = 0, THIS, context;
        var pgpTest = require('./db/header')({
            extend: function (obj) {
                context = obj;
                THIS = this;
                counter++;
                this.getOne = function (query, values) {
                    return this.one(query, values);
                };
            }
        });
        pgpTest.db.getOne("select 'hello' as msg")
            .then(function (data) {
                result = data;
            }, function () {
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(THIS && context && THIS === context).toBeTruthy();
            expect(counter === 1);
            expect(result.msg).toBe('hello');
        });
    });

    it("must allow custom properties on transaction level", function () {
        var result, counter = 0;
        var pgpTest = require('./db/header')({
            extend: function (obj) {
                counter++;
                obj.getOne = function (query, values) {
                    return obj.one(query, values);
                };
            }
        });
        pgpTest.db.tx(function (t) {
            return t.getOne("select 'hello' as msg");
        })
            .then(function (data) {
                result = data;
            }, function () {
                result = null;
            });
        waitsFor(function () {
            return result !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(counter === 1);
            expect(result && typeof(result) === 'object').toBe(true);
            expect(result.msg).toBe('hello');
        });
    });

});

describe("$sequence", function () {
    it("must throw an error correctly", function () {
        var error;
        db.tx(function (t) {
            return t.sequence(function () {
                return 'something'; // not null/undefined and not a promise;
            });
        }).then(function () {
            error = null;
        }, function (reason) {
            error = reason;
        });
        waitsFor(function () {
            return error !== undefined;
        }, "Query timed out", 5000);
        runs(function () {
            expect(error).toBe("Promise factory returned invalid result for index 0");
        });
    });
});

