'use strict';

var header = require('../db/header');
var promise = header.defPromise;

var options = {};

var dbHeader = header(options);
var db = dbHeader.db;
var pgp = dbHeader.pgp;

describe("Generators - Positive", function () {

    var result, tag, query;

    var tmTest = new pgp.txMode.TransactionMode({
        tiLevel: pgp.txMode.isolationLevel.serializable
    });

    function* myTX(t) {
        return yield t.one("select 123 as value");
    }

    myTX.txMode = tmTest;

    beforeEach(function (done) {
        options.transact = function (e) {
            tag = e.ctx.tag;
        };
        options.query = function (e) {
            if (!query) {
                query = e.query;
            }
        };
        db.tx("Custom", myTX)
            .then(function (data) {
                result = data;
                done();
            });
    });

    it("must resolve with the right value", function () {
        expect(result && typeof result === 'object').toBeTruthy();
        expect(result.value).toBe(123);
        expect(tag).toBe("Custom");
        expect(query).toBe("begin isolation level serializable");
    });

    afterEach(function () {
        delete options.task;
        delete options.query;
    });

});

describe("Generators - Negative", function () {

    describe("normal reject", function () {
        var result;

        var myTask = function*() {
            return yield promise.reject(123);
        };

        beforeEach(function (done) {
            db.task(myTask)
                .catch(function (error) {
                    result = error;
                    done();
                });
        });

        it("must reject with the right value", function () {
            expect(result).toBe(123);
        });
    });

    describe("error thrown", function () {

        var result, tag;

        function* myTask() {
            throw 123;
        }

        myTask.tag = "myTag";

        beforeEach(function (done) {
            options.task = function (e) {
                tag = e.ctx.tag;
            };
            db.task(myTask)
                .catch(function (error) {
                    result = error;
                    done();
                });
        });

        it("must reject with the right value", function () {
            expect(result).toBe(123);
            expect(tag).toBe("myTag");
        });

        afterEach(function () {
            delete options.task;
        });

    });
});
