'use strict';

var options = {
    capSQL: false
};

var os = require('os');
var utils = require('../lib/utils');
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

    describe("set all", function () {
        it("must set all values", function () {
            var col = new helpers.Column({
                name: 'name',
                prop: 'prop',
                def: 123,
                cnd: true,
                cast: 'int',
                mod: '^',
                init: function () {
                },
                skip: function () {
                }
            });
            expect(col.name).toBe('name');
            expect(col.prop).toBe('prop');
            expect(col.def).toBe(123);
            expect(col.cnd).toBe(true);
            expect(col.cast).toBe('int');
            expect(col.mod).toBe('^');
            expect(typeof col.init).toBe('function');
            expect(typeof col.skip).toBe('function');
            expect(col.toString()).toBe(col.inspect());
        });
    });

    describe("set defaults", function () {
        it("must set all values", function () {
            var col = new helpers.Column({
                name: 'name',
                prop: null,
                cast: null,
                mod: null
            });
            expect(col.name).toBe('name');
            expect('prop' in col).toBe(false);
            expect('cast' in col).toBe(false);
            expect('mod' in col).toBe(false);
        });
    });

    describe("cast", function () {
        var col = new helpers.Column({
            name: 'name',
            cast: '::int'
        });
        it("must strip the cast", function () {
            expect(col.cast).toBe('int');
        });
    });

    describe("mod", function () {
        it("must strip the mod", function () {
            var col = new helpers.Column('name^');
            expect(col.name).toBe('name');
            expect(col.mod).toBe('^');
        });
        it("must set the mod", function () {
            var col = new helpers.Column({
                name: 'name',
                mod: '^'
            });
            expect(col.mod).toBe('^');
        });
    });

    describe("Negative", function () {
        it("must throw on invalid column", function () {
            var error = new TypeError("Invalid column details.");
            expect(function () {
                helpers.Column();
            }).toThrow(error);
            expect(function () {
                helpers.Column(123);
            }).toThrow(error);
        });
        it("must throw on invalid input name", function () {
            var error = new TypeError("Invalid column syntax.");
            expect(function () {
                helpers.Column('');
            }).toThrow(error);
            expect(function () {
                helpers.Column('  ');
            }).toThrow(error);
        });
        it("must throw on invalid property 'name'", function () {
            var error1 = new TypeError("Property 'name' must be a non-empty text string.");
            var error2 = new TypeError("Property 'name' must be a valid variable name when 'prop' isn't specified.");
            expect(function () {
                helpers.Column({name: ''});
            }).toThrow(error1);
            expect(function () {
                helpers.Column({name: '   '});
            }).toThrow(error1);
            expect(function () {
                helpers.Column({name: 123});
            }).toThrow(error1);
            expect(function () {
                helpers.Column({name: 'n-a-m-e'});
            }).toThrow(error2);
        });
        it("must throw on invalid property 'prop'", function () {
            var error = new TypeError("The value of 'prop' must be a valid variable name.");
            expect(function () {
                helpers.Column({name: 'name', prop: 123});
            }).toThrow(error);
            expect(function () {
                helpers.Column({name: 'name', prop: ''});
            }).toThrow(error);
            expect(function () {
                helpers.Column({name: 'name', prop: '   '});
            }).toThrow(error);
        });
        it("must throw on invalid property 'cast'", function () {
            var error = new TypeError("Invalid property 'cast' specified.");
            expect(function () {
                helpers.Column({name: 'name', cast: 123});
            }).toThrow(error);
            expect(function () {
                helpers.Column({name: 'name', cast: ''});
            }).toThrow(error);
            expect(function () {
                helpers.Column({name: 'name', cast: '   '});
            }).toThrow(error);
        });
        it("must throw on invalid property 'mod'", function () {
            var error = new TypeError("Invalid property 'mod' specified.");
            expect(function () {
                helpers.Column({name: 'name', mod: 123});
            }).toThrow(error);
            expect(function () {
                helpers.Column({name: 'name', mod: ''});
            }).toThrow(error);
            expect(function () {
                helpers.Column({name: 'name', mod: '   '});
            }).toThrow(error);
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

    describe("options", function () {
        it("must ignore empty options", function () {
            var cs = new helpers.ColumnSet(['name'], {});
            expect('table' in cs).toBe(false);
        });
        it("must set table correctly", function () {
            var t = new helpers.TableName('table');
            var cs = new helpers.ColumnSet(['name'], {table: t});
            expect(cs.table.toString()).toBe('"table"');
        });
        it("must support inherited properties", function () {
            function A() {
            }

            A.prototype.first = 1;

            function B() {
                this.second = 2;
            }

            utils.inherits(B, A);

            var obj = new B();

            var cs1 = new helpers.ColumnSet(obj);
            var cs2 = new helpers.ColumnSet(obj, {inherit: true});
            expect(cs1.columns.length).toBe(1);
            expect(cs1.columns[0].name).toBe('second');
            expect(cs2.columns.length).toBe(2);
            expect(cs2.columns[0].name).toBe('second');
            expect(cs2.columns[1].name).toBe('first');

        });
    });

    describe("initialization", function () {
        it("must accept a Column directly", function () {
            var col = new helpers.Column('name');
            var cs = new helpers.ColumnSet(col);
            expect(cs.columns.length).toBe(1);
            expect(cs.columns[0]).toBe(col);
        });
        it("must accept a Column from array directly", function () {
            var col = new helpers.Column('name');
            var cs = new helpers.ColumnSet([col]);
            expect(cs.columns.length).toBe(1);
            expect(cs.columns[0]).toBe(col);
        });
        it("must enumerate an object properties", function () {
            var cs = new helpers.ColumnSet(dataSingle);
            expect(cs.columns.length).toBe(2);
            expect(cs.columns[0].name).toBe('val');
            expect(cs.columns[1].name).toBe('msg');
        });
    });

    describe("method 'canUpdate'", function () {
        it("must throw on empty data", function () {
            var cs = new helpers.ColumnSet([]);
            var error = new TypeError("Invalid parameter 'data' specified.");
            expect(function () {
                cs.canUpdate();
            }).toThrow(error);
        });
        it("must reject on an empty set", function () {
            var cs = new helpers.ColumnSet([]);
            expect(cs.canUpdate({})).toBe(false);
        });
        it("must approve for a non-empty set", function () {
            var cs = new helpers.ColumnSet(['name']);
            expect(cs.canUpdate([{}])).toBe(true);
            expect(cs.canUpdate([{}])).toBe(true); // the second one is to cover 'canUpdateMany'
            expect(cs.canUpdate({})).toBe(true);
        });
        it("must reject for conditional columns", function () {
            var cs = new helpers.ColumnSet(['?name']);
            expect(cs.canUpdate({})).toBe(false);
        });
        it("must reject for skipped columns", function () {
            var cs = new helpers.ColumnSet([{
                name: 'name',
                skip: function () {
                    return true;
                }
            }]);
            expect(cs.canUpdate({})).toBe(false);
        });
        it("must approve for non-skipped columns", function () {
            var cs = new helpers.ColumnSet([{
                name: 'name',
                skip: function () {
                    return false;
                }
            }]);
            expect(cs.canUpdate({})).toBe(true);
        });
    });

    describe("property 'names'", function () {
        var cs = new helpers.ColumnSet(['name1', 'name2']);
        var csEmpty = new helpers.ColumnSet([]);
        it("must return the right string", function () {
            expect(cs.names).toBe('("name1","name2")');
            expect(csEmpty.names).toBe('');
        });
        it("must reuse the data", function () {
            expect(cs.names).toBe('("name1","name2")');
        });
    });

    describe("method 'getUpdates'", function () {
        var cs = new helpers.ColumnSet(dataSingle);
        var csEmpty = new helpers.ColumnSet([]);
        it("must return the right update string", function () {
            expect(cs.getUpdates(dataSingle)).toBe('"val"=${val},"msg"=${msg}');
            expect(csEmpty.getUpdates(dataSingle)).toBe('');
        });
        it("must reuse the data", function () {
            expect(cs.getUpdates(dataSingle)).toBe('"val"=${val},"msg"=${msg}');
        });
        it("must handle cnd and skip", function () {
            var cs1 = new helpers.ColumnSet(['?val', 'msg']);
            var cs2 = new helpers.ColumnSet(['val', {
                name: 'msg', skip: function () {
                }
            }]);
            var cs3 = new helpers.ColumnSet(['val', {
                name: 'msg', skip: function () {
                    return true;
                }
            }]);
            expect(cs1.getUpdates(dataSingle)).toBe('"msg"=${msg}');
            expect(cs2.getUpdates(dataSingle)).toBe('"val"=${val},"msg"=${msg}');
            expect(cs3.getUpdates(dataSingle)).toBe('"val"=${val}');
        });

    });

    describe("method 'prepare'", function () {
        it("must replicate full objects", function () {
            var cs = new helpers.ColumnSet(dataSingle);
            var obj = cs.prepare(dataSingle);
            expect(obj).toEqual(dataSingle);
        });
        it("must set defaults for missing properties", function () {
            var cs = new helpers.ColumnSet(['val',
                {
                    name: 'msg',
                    init: function (value) {
                        return value + '-init';
                    }
                },
                {
                    name: 'test1',
                    def: 'def-test'
                },
                {
                    name: 'test2',
                    init: function () {
                        return 'init-test';
                    }
                },
                'wrong']);
            var obj = cs.prepare(dataSingle);
            expect(obj).toEqual({
                val: dataSingle.val,
                msg: dataSingle.msg + '-init',
                test1: 'def-test',
                test2: 'init-test'
            });
        });
    });

    describe("Negative", function () {
        it("must throw on invalid columns", function () {
            var error = new TypeError("Invalid parameter 'columns' specified.");
            expect(function () {
                helpers.ColumnSet();
            }).toThrow(error);
            expect(function () {
                helpers.ColumnSet(123);
            }).toThrow(error);
        });
        it("must throw on invalid options", function () {
            var error = new TypeError("Invalid parameter 'options' specified.");
            expect(function () {
                helpers.ColumnSet({}, 123);
            }).toThrow(error);
        });
    });

    describe("console coverage", function () {
        var cs1 = new helpers.ColumnSet(['name']);
        var cs2 = new helpers.ColumnSet(['name'], {table: 'table'});
        var cs3 = new helpers.ColumnSet([]);
        var gap = utils.messageGap(1);
        it("must cover all lines", function () {
            expect(cs1.toString()).toContain('columns: [');
            expect(cs2.toString()).toContain('table: "table"');
            expect(cs3.toString()).toBe("ColumnSet {" + os.EOL + gap + "columns: []" + os.EOL + '}');
            expect(cs1.toString(1) !== cs1.inspect()).toBe(true);
        });
    });

});
