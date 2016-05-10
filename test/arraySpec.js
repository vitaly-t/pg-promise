'use strict';

require('../lib/array');

var data = [1, 2, 3];

describe("map", function () {

    describe("with context", function () {
        var ctx, indexes = [];
        var res = data.$map(function (d, idx) {
            ctx = this;
            indexes.push(idx);
            return d * 2;
        }, data);
        it("must iterate correctly", function () {
            expect(ctx).toBe(data);
            expect(res).toEqual([2, 4, 6]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

    describe("without context", function () {
        var ctx, indexes = [];
        var res = data.$map(function (d, idx) {
            ctx = ctx || this;
            indexes.push(idx);
            return d * 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(res).toEqual([2, 4, 6]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

});

describe("filter", function () {

    describe("with context", function () {
        var ctx, indexes = [];
        var res = data.$filter(function (d, idx) {
            ctx = this;
            indexes.push(idx);
            return d != 2;
        }, data);
        it("must iterate correctly", function () {
            expect(ctx).toBe(data);
            expect(res).toEqual([1, 3]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

    describe("without context", function () {
        var ctx, indexes = [];
        var res = data.$filter(function (d, idx) {
            ctx = ctx || this;
            indexes.push(idx);
            return d != 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(res).toEqual([1, 3]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

});

describe("forEach", function () {

    describe("with context", function () {
        var ctx, values = [], indexes = [];
        data.$forEach(function (d, idx) {
            ctx = this;
            values.push(d);
            indexes.push(idx);
        }, data);
        it("must iterate correctly", function () {
            expect(ctx).toBe(data);
            expect(values).toEqual([1, 2, 3]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

    describe("without context", function () {
        var ctx, values = [], indexes = [];
        data.$filter(function (d, idx) {
            ctx = ctx || this;
            values.push(d);
            indexes.push(idx);
            return d != 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(values).toEqual([1, 2, 3]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

});

describe("countIf", function () {

    describe("with context", function () {
        var ctx, values = [], indexes = [];
        var res = data.$countIf(function (d, idx) {
            ctx = this;
            values.push(d);
            indexes.push(idx);
            return d != 2;
        }, data);
        it("must iterate correctly", function () {
            expect(res).toBe(2);
            expect(ctx).toBe(data);
            expect(values).toEqual([1, 2, 3]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

    describe("without context", function () {
        var ctx, values = [], indexes = [];
        var res = data.$countIf(function (d, idx) {
            ctx = ctx || this;
            values.push(d);
            indexes.push(idx);
            return d != 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(res).toBe(2);
            expect(values).toEqual([1, 2, 3]);
            expect(indexes).toEqual([0, 1, 2]);
        });
    });

});
