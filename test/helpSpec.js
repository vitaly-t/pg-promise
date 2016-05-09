'use strict';

var options = {
    capSQL: false
};

var header = require('./db/header');
var helpers = header(options).pgp.helpers;

describe("single object", function () {

    var data = {
        val: 123,
        msg: 'test'
    };

    describe("insert data directly", function () {
        it("must return all data columns", function () {
            expect(helpers.insert(data, null, 'table')).toBe('insert into "table"("val","msg") values(123,\'test\')');
        });
    });

    describe("update data directly", function () {
        it("must return all data columns", function () {
            expect(helpers.update(data, null, 'table')).toBe('update "table" set "val"=123,"msg"=\'test\'');
        });
    });

});

describe("multi-object", function () {

    var data = [{
        id: 1,
        val: 123,
        msg: 'hello'
    }, {
        id: 2,
        val: 456,
        msg: 'world'
    }];

    describe("insert data directly", function () {
        it("must return all data columns", function () {
            expect(helpers.insert(data, ['val', 'msg'], 'table')).toBe('insert into "table"("val","msg") values(123,\'hello\'),(456,\'world\')');
        });
    });

    describe("update data directly", function () {
        it("must return all data columns", function () {
            expect(helpers.update(data, ['?id', 'val', 'msg'], 'table')).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as v("id","val","msg")');
        });
    });

});
