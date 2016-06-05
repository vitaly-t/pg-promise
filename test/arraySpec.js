'use strict';

var $arr = require('../lib/array');

var data = [1, 2, 3];

describe("map", function () {

    describe("with context", function () {
        var ctx, arr, indexes = [];
        var res = $arr.map(data, function (d, idx, a) {
            arr = a;
            ctx = this;
            indexes.push(idx);
            return d * 2;
        }, data);
        it("must iterate correctly", function () {
            expect(ctx).toBe(data);
            expect(res).toEqual([2, 4, 6]);
            expect(indexes).toEqual([0, 1, 2]);
            expect(arr).toBe(data);
        });
    });

    describe("without context", function () {
        var ctx, arr, indexes = [];
        var res = $arr.map(data, function (d, idx, a) {
            arr = a;
            ctx = ctx || this;
            indexes.push(idx);
            return d * 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(res).toEqual([2, 4, 6]);
            expect(indexes).toEqual([0, 1, 2]);
            expect(arr).toBe(data);
        });
    });

});

describe("filter", function () {

    describe("with context", function () {
        var ctx, arr, indexes = [];
        var res = $arr.filter(data, function (d, idx, a) {
            arr = a;
            ctx = this;
            indexes.push(idx);
            return d != 2;
        }, data);
        it("must iterate correctly", function () {
            expect(ctx).toBe(data);
            expect(res).toEqual([1, 3]);
            expect(indexes).toEqual([0, 1, 2]);
            expect(arr).toBe(data);
        });
    });

    describe("without context", function () {
        var ctx, arr, indexes = [];
        var res = $arr.filter(data, function (d, idx, a) {
            arr = a;
            ctx = ctx || this;
            indexes.push(idx);
            return d != 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(res).toEqual([1, 3]);
            expect(indexes).toEqual([0, 1, 2]);
            expect(arr).toBe(data);
        });
    });

});

describe("forEach", function () {

    describe("with context", function () {
        var ctx, arr, values = [], indexes = [];
        $arr.forEach(data, function (d, idx, a) {
            arr = a;
            ctx = this;
            values.push(d);
            indexes.push(idx);
        }, data);
        it("must iterate correctly", function () {
            expect(ctx).toBe(data);
            expect(values).toEqual([1, 2, 3]);
            expect(indexes).toEqual([0, 1, 2]);
            expect(arr).toBe(data);
        });
    });

    describe("without context", function () {
        var ctx, arr, values = [], indexes = [];
        $arr.filter(data, function (d, idx, a) {
            arr = a;
            ctx = ctx || this;
            values.push(d);
            indexes.push(idx);
            return d != 2;
        });
        it("must iterate correctly", function () {
            expect(ctx).toBeUndefined();
            expect(values).toEqual([1, 2, 3]);
            expect(indexes).toEqual([0, 1, 2]);
            expect(arr).toBe(data);
        });
    });

});

describe("countIf", function () {

    describe("with context", function () {
        var ctx, arr, values = [], indexes = [];
        var res = $arr.countIf(data, function (d, idx, a) {
            arr = a;
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
            expect(arr).toBe(data);
        });
    });

    describe("without context", function () {
        var ctx, arr, values = [], indexes = [];
        var res = $arr.countIf(data, function (d, idx, a) {
            arr = a;
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
            expect(arr).toBe(data);
        });
    });

});

describe("removeIf", function () {

    describe("with context", function () {
        var ctx, arr, indexes = [], values = [1, 2, 3, 4, 5];
        $arr.removeIf(values, function (d, idx, a) {
            arr = a;
            ctx = this;
            indexes.push(idx);
            return d === 2 || d === 4;
        }, values);
        it("must remove correctly", function () {
            expect(ctx).toBe(values);
            expect(arr).toBe(values);
            expect(values).toEqual([1, 3, 5]);
            expect(indexes).toEqual([4, 3, 2, 1, 0]);
        });
    });

    describe("without context", function () {
        var ctx, arr, indexes = [], values = [1, 2, 3, 4, 5];
        $arr.removeIf(values, function (d, idx, a) {
            arr = a;
            ctx = this;
            indexes.push(idx);
            return d === 2 || d === 4;
        });
        it("must remove correctly", function () {
            expect(ctx).toBeUndefined();
            expect(arr).toBe(values);
            expect(values).toEqual([1, 3, 5]);
            expect(indexes).toEqual([4, 3, 2, 1, 0]);
        });
    });

});
