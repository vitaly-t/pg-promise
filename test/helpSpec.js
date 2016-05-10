'use strict';

var options = {
    capSQL: false
};

var header = require('./db/header');
var helpers = header(options).pgp.helpers;

var dataSingle = {
    val: 123,
    msg: 'test'
};

var dataMulti = [{
    id: 1,
    val: 123,
    msg: 'hello'
}, {
    id: 2,
    val: 456,
    msg: 'world'
}];

describe("INSERT", function () {

    describe("single:", function () {
        describe("direct data", function () {
            it("must return all data properties as columns", function () {
                expect(helpers.insert(dataSingle, null, 'table')).toBe('insert into "table"("val","msg") values(123,\'test\')');
            });
        });
    });


    describe("multi:", function () {
        describe("direct data", function () {
            it("must return all data columns", function () {
                expect(helpers.insert(dataMulti, ['val', 'msg'], 'table')).toBe('insert into "table"("val","msg") values(123,\'hello\'),(456,\'world\')');
            });
        });
    });

});

describe("UPDATE", function () {

    describe("single:", function () {
        describe("direct data", function () {
            it("must return all data properties as columns", function () {
                expect(helpers.update(dataSingle, null, 'table')).toBe('update "table" set "val"=123,"msg"=\'test\'');
            });
        });
    });

    describe("multi:", function () {
        describe("direct data", function () {
            it("must return all data columns", function () {
                expect(helpers.update(dataMulti, ['?id', 'val', 'msg'], 'table')).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as v("id","val","msg")');
            });
        });
    });

});

describe("TableName", function () {

    describe("Function call", function () {
        it("must return a new object", function () {
            var obj = helpers.TableName('table');
            expect(obj instanceof helpers.TableName).toBe(true);
        });
    });

    describe("Negative", function () {

        describe("invalid 'table' parameter", function () {
            var error = new TypeError("Table name must be non-empty text string.");
            it("must throw an error", function () {
                expect(function () {
                    helpers.TableName();
                }).toThrow(error);
                expect(function () {
                    helpers.TableName(123);
                }).toThrow(error);
                expect(function () {
                    helpers.TableName('');
                }).toThrow(error);
                expect(function () {
                    helpers.TableName('   ');
                }).toThrow(error);
            });
        });

        describe("invalid 'schema' parameter", function () {
            var error = new TypeError("Invalid schema name.");
            it("must throw an error", function () {
                expect(function () {
                    helpers.TableName('table', 123);
                }).toThrow(error);
            });
        });
    });

    describe("options", function () {
        it("must find the options correctly", function () {
            var t = new helpers.TableName({table: 'table', schema: 'schema'});
            expect(t.table).toBe('table');
            expect(t.schema).toBe('schema');
        });
        it("must skip an empty schema", function () {
            var t = new helpers.TableName({table: 'table', schema: ''});
            expect('schema' in t).toBe(false);
        });
    });

    describe("console output", function () {
        it("must be formatted", function () {
            var t = new helpers.TableName({table: 'table', schema: 'schema'});
            expect(t.toString()).toBe('"schema"."table"');
            expect(t.toString()).toBe(t.inspect());
        });
    });
});

describe("Column", function () {

    describe("Function call", function () {
        it("must return a new object", function () {
            var obj = helpers.Column('col');
            expect(obj instanceof helpers.Column).toBe(true);
        });
    });

});

describe("ColumnSet", function () {

    describe("Function call", function () {
        it("must return a new object", function () {
            var obj = helpers.ColumnSet(['col']);
            expect(obj instanceof helpers.ColumnSet).toBe(true);
        });
    });

});
