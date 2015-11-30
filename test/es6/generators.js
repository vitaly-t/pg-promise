'use strict';

var header = require('../db/header');
var promise = header.defPromise;

var options = {};

var dbHeader = header(options);
var db = dbHeader.db;

describe("Generators - Positive", function () {

    var result, tag;

    function* myTask(t) {
        return yield t.one("select 123 as value");
    }

    beforeEach(function (done) {
        options.task = function (e) {
            tag = e.ctx.tag;
        };
        db.task("Custom", myTask)
            .then(function (data) {
                result = data;
                done();
            });
    });

    it("must resolve with the right value", function () {
        expect(result && typeof result === 'object').toBeTruthy();
        expect(result.value).toBe(123);
        expect(tag).toBe("Custom");
    });

    afterEach(function () {
        delete options.task;
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
