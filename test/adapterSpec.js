'use strict';

var pgp = require('../lib/index');
var PromiseAdapter = pgp.PromiseAdapter;

var dummy = function () {
};

describe("Adapter", function () {

    describe("with invalid 'create'", function () {
        it("must throw an error", function () {
            expect(function () {
                new PromiseAdapter();
            }).toThrow("Adapter requires a function to create a promise.");
        });
    });

    describe("with invalid 'resolve'", function () {
        it("must throw an error", function () {
            expect(function () {
                new PromiseAdapter(dummy);
            }).toThrow("Adapter requires a function to resolve a promise.");
        });
    });

    describe("with invalid 'reject'", function () {
        it("must throw an error", function () {
            expect(function () {
                new PromiseAdapter(dummy, dummy);
            }).toThrow("Adapter requires a function to reject a promise.");
        });
    });

    describe("with valid parameters", function () {
        it("must be successful with new", function () {
            expect(new PromiseAdapter(dummy, dummy, dummy)).toBeTruthy();
        });
        it("must be successful without new", function () {
            expect(PromiseAdapter(dummy, dummy, dummy)).toBeTruthy();
        });
    });

});
