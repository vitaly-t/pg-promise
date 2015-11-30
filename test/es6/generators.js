'use strict';

var header = require('../db/header');
var promise = header.defPromise;
var dbHeader = header();
var db = dbHeader.db;

describe("Generators - Positive", function () {

    var result;

    function* myTask(t) {
        return yield t.one("select 123 as value");
    }

    beforeEach(function (done) {
        db.task(myTask)
            .then(function (data) {
                result = data;
                done();
            });
    });

    it("must resolve with the right value", function () {
        expect(result && typeof result === 'object').toBeTruthy();
        expect(result.value).toBe(123);
    });
});

describe("Generators - Negative", function () {

    describe("normal reject", function () {
        var result;

        function* myTask() {
            return yield promise.reject(123);
        }

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

        var result;

        function* myTask() {
            throw 123;
        }

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
});
