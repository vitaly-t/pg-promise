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

    describe("setting table name", function () {
        var cs = new helpers.ColumnSet(dataSingle, {table: 'external'});
        it("must use its own table when specified", function () {
            expect(helpers.insert(dataSingle, cs, 'internal')).toBe('insert into "internal"("val","msg") values(123,\'test\')');
        });
        it("must use ColumnSet table when not locally specified", function () {
            expect(helpers.insert(dataSingle, cs)).toBe('insert into "external"("val","msg") values(123,\'test\')');
        });
    });

    describe("generating sql in upper case", function () {
        beforeEach(function () {
            options.capSQL = true;
        });
        it("must return a capitalized query", function () {
            expect(helpers.insert(dataSingle, null, 'table')).toBe('INSERT INTO "table"("val","msg") VALUES(123,\'test\')');
        });
        afterEach(function () {
            options.capSQL = false;
        });
    });

    describe("negative", function () {
        it("must throw on invalid data", function () {
            var error = new TypeError("Invalid parameter 'data' specified.");
            expect(function () {
                helpers.insert();
            }).toThrow(error);
            expect(function () {
                helpers.insert(123);
            }).toThrow(error);
        });
        it("must throw on an empty array", function () {
            var error = new TypeError("Cannot generate an INSERT from an empty array.");
            expect(function () {
                helpers.insert([]);
            }).toThrow(error);
        });
        it("must throw for an array without columns specified", function () {
            var error = new TypeError("Parameter 'columns' is required when inserting multiple records.");
            expect(function () {
                helpers.insert([{}]);
            }).toThrow(error);
        });
        it("must throw for an empty column set", function () {
            var error = new TypeError("Cannot generate an INSERT without any columns.");
            expect(function () {
                helpers.insert({}, []);
            }).toThrow(error);
        });
        it("must throw when table is not specified", function () {
            var error = new TypeError("Table name is unknown.");
            expect(function () {
                helpers.insert({}, ['test']);
            }).toThrow(error);
        });
        it("must throw on invalid array data", function () {
            var error = new TypeError("Invalid insert object at index 0.");
            expect(function () {
                helpers.insert([null], ['test'], 'table');
            }).toThrow(error);
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

    describe("setting table name", function () {
        var cs = new helpers.ColumnSet(dataSingle, {table: 'external'});
        it("must use its own table when specified", function () {
            expect(helpers.update(dataSingle, cs, 'internal')).toBe('update "internal" set "val"=123,"msg"=\'test\'');
        });
        it("must use ColumnSet table when not locally specified", function () {
            expect(helpers.update(dataSingle, cs)).toBe('update "external" set "val"=123,"msg"=\'test\'');
        });
    });

    describe("generating sql in upper case", function () {
        var cs = new helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'table'});
        beforeEach(function () {
            options.capSQL = true;
        });
        it("must return a capitalized query for a single data", function () {
            expect(helpers.update(dataSingle, cs)).toBe('UPDATE "table" SET "val"=123,"msg"=\'test\'');
        });
        it("must return a capitalized query for multi-data", function () {
            expect(helpers.update(dataMulti, cs)).toBe('UPDATE "table" AS t SET "val"=v."val","msg"=v."msg" FROM (VALUES(1,123,\'hello\'),(2,456,\'world\')) AS v("id","val","msg")');
        });
        afterEach(function () {
            options.capSQL = false;
        });
    });

    describe("options", function () {
        var cs = new helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'table'});
        var opt = {tableAlias: 'X', valueAlias: 'Y'};
        it("must use the options", function () {
            expect(helpers.update(dataMulti, cs, null, opt)).toBe('update "table" as X set "val"=Y."val","msg"=Y."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as Y("id","val","msg")');
        });
        it("must ignore empty options", function () {
            expect(helpers.update(dataMulti, cs, null, {})).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as v("id","val","msg")');
        });
    });

    describe("negative", function () {
        it("must throw on invalid data", function () {
            var error = new TypeError("Invalid parameter 'data' specified.");
            expect(function () {
                helpers.update();
            }).toThrow(error);
            expect(function () {
                helpers.update(123);
            }).toThrow(error);
        });
        it("must throw on an empty array", function () {
            var error = new TypeError("Cannot generate an UPDATE from an empty array.");
            expect(function () {
                helpers.update([]);
            }).toThrow(error);
        });
        it("must throw for an array without columns specified", function () {
            var error = new TypeError("Parameter 'columns' is required when updating multiple records.");
            expect(function () {
                helpers.update([{}]);
            }).toThrow(error);
        });
        it("must throw for an empty column set", function () {
            var error = new TypeError("Cannot generate an UPDATE without any columns.");
            expect(function () {
                helpers.update({}, []);
            }).toThrow(error);
        });
        it("must throw when table is not specified", function () {
            var error = new TypeError("Table name is unknown.");
            expect(function () {
                helpers.update({}, ['test']);
            }).toThrow(error);
        });
        it("must throw on invalid array data", function () {
            var error = new TypeError("Invalid update object at index 0.");
            expect(function () {
                helpers.update([null], ['test'], 'table');
            }).toThrow(error);
        });
        it("must throw on invalid options", function () {
            var error = new TypeError("Invalid parameter 'options' specified.");
            expect(function () {
                helpers.update(dataMulti, ['test'], 'table', 123);
            }).toThrow(error);
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
    /*
     describe("Negative", function () {
     var error = new TypeError("A column name must be a non-empty text string.");
     it("must throw on invalid column", function () {
     expect(function () {
     helpers.Column();
     }).toThrow(error);
     expect(function () {
     helpers.Column();
     }).toThrow(error);

     });
     });
     */
});

describe("ColumnSet", function () {

    describe("Function call", function () {
        it("must return a new object", function () {
            var obj = helpers.ColumnSet(['col']);
            expect(obj instanceof helpers.ColumnSet).toBe(true);
        });
    });

});
