'use strict';

const header = require('./db/header');
const tools = require('./tools');

const promise = header.defPromise;
const options = {
    promiseLib: promise,
    capSQL: false,
    noWarnings: true
};
const pgp = header(options).pgp;

const os = require('os');
const path = require('path');
const utils = require('../lib/utils');
const helpers = pgp.helpers;
const QueryFile = pgp.QueryFile;

const dataSingle = {
    val: 123,
    msg: 'test'
};

const dataMulti = [{
    id: 1,
    val: 123,
    msg: 'hello'
}, {
    id: 2,
    val: 456,
    msg: 'world'
}];

describe('INSERT', function () {

    describe('single:', function () {
        describe('direct data', function () {
            it('must return all data properties as columns', function () {
                expect(helpers.insert(dataSingle, null, 'table')).toBe('insert into "table"("val","msg") values(123,\'test\')');
            });
        });
    });

    describe('multi:', function () {
        describe('direct data', function () {
            it('must return all data columns', function () {
                expect(helpers.insert(dataMulti, ['val', 'msg'], 'table')).toBe('insert into "table"("val","msg") values(123,\'hello\'),(456,\'world\')');
            });
        });
    });

    describe('setting table name', function () {
        const cs = new helpers.ColumnSet(dataSingle, {table: 'external'});
        it('must use its own table when specified', function () {
            expect(helpers.insert(dataSingle, cs, 'internal')).toBe('insert into "internal"("val","msg") values(123,\'test\')');
        });
        it('must use ColumnSet table when not locally specified', function () {
            expect(helpers.insert(dataSingle, cs)).toBe('insert into "external"("val","msg") values(123,\'test\')');
        });
    });

    describe('generating sql in upper case', function () {
        beforeEach(function () {
            options.capSQL = true;
        });
        it('must return a capitalized query', function () {
            expect(helpers.insert(dataSingle, null, 'table')).toBe('INSERT INTO "table"("val","msg") VALUES(123,\'test\')');
        });
        afterEach(function () {
            options.capSQL = false;
        });
    });

    describe('negative', function () {
        it('must throw on invalid data', function () {
            const error = new TypeError('Invalid parameter \'data\' specified.');
            expect(function () {
                helpers.insert();
            }).toThrow(error);
            expect(function () {
                helpers.insert(123);
            }).toThrow(error);
        });
        it('must throw on an empty array', function () {
            const error = new TypeError('Cannot generate an INSERT from an empty array.');
            expect(function () {
                helpers.insert([]);
            }).toThrow(error);
        });
        it('must throw for an array without columns specified', function () {
            const error = new TypeError('Parameter \'columns\' is required when inserting multiple records.');
            expect(function () {
                helpers.insert([{}]);
            }).toThrow(error);
        });
        it('must throw for an empty column set', function () {
            const error = new TypeError('Cannot generate an INSERT without any columns.');
            expect(function () {
                helpers.insert({}, []);
            }).toThrow(error);
        });
        it('must throw when table is not specified', function () {
            const error = new TypeError('Table name is unknown.');
            expect(function () {
                helpers.insert({}, ['test']);
            }).toThrow(error);
        });
        it('must throw on invalid array data', function () {
            const error = new TypeError('Invalid insert object at index 0.');
            expect(function () {
                helpers.insert([null], ['test'], 'table');
            }).toThrow(error);
        });
    });
});

describe('UPDATE', function () {

    describe('single:', function () {
        describe('direct data', function () {
            it('must return all properties correctly', function () {
                const cs = ['?val', {name: 'msg', cast: 'text'}, {name: 'extra', def: 555}];
                expect(helpers.update(dataSingle, cs, 'table')).toBe('update "table" set "msg"=\'test\'::text,"extra"=555');
                expect(helpers.update(dataSingle, null, 'table')).toBe('update "table" set "val"=123,"msg"=\'test\'');
            });
        });
        describe('skipping columns', () => {
            const cs = ['val', {name: 'msg', skip: () => true}];
            it('must work', () => {
                expect(helpers.update(dataSingle, cs, 'table')).toBe('update "table" set "val"=123');
            });
        });
    });

    describe('multi:', function () {
        describe('direct data', function () {
            it('must return all data columns', function () {
                expect(helpers.update(dataMulti, ['?id', 'val', {
                    name: 'msg',
                    cast: 'text'
                }], 'table')).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'::text),(2,456,\'world\'::text)) as v("id","val","msg")');
            });
        });
    });

    describe('setting table name', function () {
        const cs = new helpers.ColumnSet(dataSingle, {table: 'external'});
        it('must use its own table when specified', function () {
            expect(helpers.update(dataSingle, cs, 'internal')).toBe('update "internal" set "val"=123,"msg"=\'test\'');
        });
        it('must use ColumnSet table when not locally specified', function () {
            expect(helpers.update(dataSingle, cs)).toBe('update "external" set "val"=123,"msg"=\'test\'');
        });
    });

    describe('generating sql in upper case', function () {
        const cs = new helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'table'});
        beforeEach(function () {
            options.capSQL = true;
        });
        it('must return a capitalized query for a single data', function () {
            expect(helpers.update(dataSingle, cs)).toBe('UPDATE "table" SET "val"=123,"msg"=\'test\'');
        });
        it('must return a capitalized query for multi-row data', function () {
            expect(helpers.update(dataMulti, cs)).toBe('UPDATE "table" AS t SET "val"=v."val","msg"=v."msg" FROM (VALUES(1,123,\'hello\'),(2,456,\'world\')) AS v("id","val","msg")');
        });
        afterEach(function () {
            options.capSQL = false;
        });
    });

    describe('options', function () {
        const cs = new helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'table'});
        const opt = {tableAlias: 'X', valueAlias: 'Y'};
        it('must use the options', function () {
            expect(helpers.update(dataMulti, cs, null, opt)).toBe('update "table" as X set "val"=Y."val","msg"=Y."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as Y("id","val","msg")');
        });
        it('must ignore empty options', function () {
            expect(helpers.update(dataMulti, cs, null, {})).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as v("id","val","msg")');
        });
    });

    describe('emptyUpdate', function () {
        const cs = new helpers.ColumnSet(['?id', '?val', '?msg'], {table: 'table'});
        it('must return the option value', function () {
            expect(helpers.update(dataSingle, cs, null, {emptyUpdate: 123})).toBe(123);
            expect(helpers.update(dataMulti, cs, null, {emptyUpdate: 123})).toBe(123);
        });
    });

    describe('negative', function () {
        it('must throw on invalid data', function () {
            const error = new TypeError('Invalid parameter \'data\' specified.');
            expect(function () {
                helpers.update();
            }).toThrow(error);
            expect(function () {
                helpers.update(123);
            }).toThrow(error);
        });
        it('must throw on an empty array', function () {
            const error = new TypeError('Cannot generate an UPDATE from an empty array.');
            expect(function () {
                helpers.update([]);
            }).toThrow(error);
        });
        it('must throw for an array without columns specified', function () {
            const error = new TypeError('Parameter \'columns\' is required when updating multiple records.');
            expect(function () {
                helpers.update([{}]);
            }).toThrow(error);
        });
        it('must throw for an empty column set', function () {
            const error = new TypeError('Cannot generate an UPDATE without any columns.');
            expect(function () {
                helpers.update({}, []);
            }).toThrow(error);
        });
        it('must throw when table is not specified for an array', function () {
            const error = new TypeError('Table name is unknown.');
            expect(function () {
                helpers.update({}, ['test']);
                helpers.update([{}], ['test']);
            }).toThrow(error);
        });
        it('must throw on invalid array data', function () {
            const error = new TypeError('Invalid update object at index 0.');
            expect(function () {
                helpers.update([null], ['test'], 'table');
            }).toThrow(error);
        });
    });

});

describe('TableName', function () {

    describe('Function call', function () {
        it('must return a new object', function () {
            // eslint-disable-next-line
            const obj = helpers.TableName('table');
            expect(obj instanceof helpers.TableName).toBe(true);
        });
    });

    describe('Negative', function () {

        describe('invalid \'table\' parameter', function () {
            const error = new TypeError('Table name must be a non-empty text string.');
            it('must throw an error', function () {
                expect(function () {
                    new helpers.TableName();
                }).toThrow(error);
                expect(function () {
                    new helpers.TableName(123);
                }).toThrow(error);
                expect(function () {
                    new helpers.TableName('');
                }).toThrow(error);
                expect(function () {
                    new helpers.TableName('   ');
                }).toThrow(error);
            });
        });

        describe('invalid \'schema\' parameter', function () {
            const error = new TypeError('Invalid schema name.');
            it('must throw an error', function () {
                expect(function () {
                    new helpers.TableName('table', 123);
                }).toThrow(error);
            });
        });
    });

    describe('options', function () {
        it('must find the options correctly', function () {
            const t = new helpers.TableName({table: 'table', schema: 'schema'});
            expect(t.table).toBe('table');
            expect(t.schema).toBe('schema');
        });
        it('must skip an empty schema', function () {
            const t = new helpers.TableName({table: 'table', schema: ''});
            expect('schema' in t).toBe(false);
        });
    });

    describe('console output', function () {
        it('must be formatted', function () {
            const t = new helpers.TableName({table: 'table', schema: 'schema'});
            expect(t.toString()).toBe('"schema"."table"');
            expect(t.toString()).toBe(tools.inspect(t));
        });
    });

    describe('custom-type formatting', () => {
        const t = new helpers.TableName({table: 'table', schema: 'schema'});
        it('must return the full name', () => {
            const toPostgres = pgp.as.ctf.toPostgres;
            expect(t[toPostgres](t)).toBe(t.name);
            expect(t[toPostgres].call(null, t)).toBe(t.name);
            expect(t[toPostgres]()).toBe(t.name);
        });
    });
});

describe('Column', function () {

    describe('Function call', function () {
        it('must return a new object', function () {
            // eslint-disable-next-line
            const obj = helpers.Column('col');
            expect(obj instanceof helpers.Column).toBe(true);
        });
    });

    describe('set all', function () {
        it('must set all values', function () {
            const col = new helpers.Column({
                name: '_colName',
                prop: '$propName01',
                def: 123,
                cnd: true,
                cast: 'int',
                mod: '^',
                init: function () {
                },
                skip: function () {
                }
            });
            expect(col.name).toBe('_colName');
            expect(col.prop).toBe('$propName01');
            expect(col.def).toBe(123);
            expect(col.cnd).toBe(true);
            expect(col.cast).toBe('int');
            expect(col.mod).toBe('^');
            expect(typeof col.init).toBe('function');
            expect(typeof col.skip).toBe('function');
            expect(col.toString()).toBe(tools.inspect(col));
        });
    });

    describe('set defaults', function () {
        it('must set all values', function () {
            const col = new helpers.Column({
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

    describe('cast', function () {
        const cols = [
            new helpers.Column({
                name: 'name',
                cast: '::int'
            }),
            new helpers.Column({
                name: 'name',
                cast: '  :  : \t  : int'
            }),
            new helpers.Column({
                name: 'name',
                cast: ': : int: \t: '
            }),
            new helpers.Column({
                name: 'name',
                cast: ':a:'
            })
        ];
        it('must strip the cast', function () {
            expect(cols[0].cast).toBe('int');
            expect(cols[1].cast).toBe('int');
            expect(cols[2].cast).toBe('int: \t:');
            expect(cols[3].cast).toBe('a:');
        });
    });

    describe('prop', () => {
        const col = new helpers.Column({
            name: 'testName',
            prop: 'testName'
        });
        it('must not be set if matches \'name\'', () => {
            expect(col.name).toBe('testName');
            expect('prop' in col).toBe(false);
        });
        it('must throw on invalid property names', () => {
            expect(() => new helpers.Column({
                name: 'name',
                prop: '-test'
            })).toThrow(new TypeError('Invalid \'prop\' syntax: "-test".'));
        });
    });

    describe('mod', function () {
        it('must strip the mod', function () {
            const col = new helpers.Column('name^');
            expect(col.name).toBe('name');
            expect(col.mod).toBe('^');
        });
        it('must set the mod', function () {
            const col = new helpers.Column({
                name: 'name',
                mod: '^'
            });
            expect(col.mod).toBe('^');
        });
    });

    describe('Negative', function () {
        it('must throw on invalid construction', function () {
            const error = new TypeError('Invalid column details.');
            expect(function () {
                new helpers.Column();
            }).toThrow(error);
            expect(function () {
                new helpers.Column(123);
            }).toThrow(error);
        });
        it('must throw on invalid input name', function () {
            expect(function () {
                new helpers.Column('');
            }).toThrow(new TypeError('Invalid column syntax: "".'));
            expect(function () {
                new helpers.Column('  ');
            }).toThrow(new TypeError('Invalid column syntax: "  ".'));
            expect(function () {
                new helpers.Column('name.bla');
            }).toThrow(new TypeError('Invalid column syntax: "name.bla".'));
        });
        it('must throw on invalid property \'name\'', function () {
            expect(function () {
                new helpers.Column({name: ''});
            }).toThrow(new TypeError('Invalid \'name\' value: "". A non-empty string was expected.'));
            expect(function () {
                new helpers.Column({name: '  '});
            }).toThrow(new TypeError('Invalid \'name\' value: "  ". A non-empty string was expected.'));
            expect(function () {
                new helpers.Column({name: 123});
            }).toThrow(new TypeError('Invalid \'name\' value: 123. A non-empty string was expected.'));
            expect(function () {
                new helpers.Column({name: 'name.first'});
            }).toThrow(new TypeError('Invalid \'name\' syntax: "name.first".'));
        });
        it('must throw on invalid property \'prop\'', function () {
            expect(function () {
                new helpers.Column({name: 'name', prop: 123});
            }).toThrow(new TypeError('Invalid \'prop\' value: 123. A non-empty string was expected.'));
            expect(function () {
                new helpers.Column({name: 'name', prop: ''});
            }).toThrow(new TypeError('Invalid \'prop\' value: "". A non-empty string was expected.'));
            expect(function () {
                new helpers.Column({name: 'name', prop: '  '});
            }).toThrow(new TypeError('Invalid \'prop\' value: "  ". A non-empty string was expected.'));
            expect(function () {
                new helpers.Column({name: 'name', prop: 'one.two'});
            }).toThrow(new TypeError('Invalid \'prop\' syntax: "one.two".'));
        });
        it('must throw on invalid property \'cast\'', function () {
            expect(function () {
                new helpers.Column({name: 'name', cast: 123});
            }).toThrow(new TypeError('Invalid \'cast\' value: 123.'));
            expect(function () {
                new helpers.Column({name: 'name', cast: ''});
            }).toThrow(new TypeError('Invalid \'cast\' value: "".'));
            expect(function () {
                new helpers.Column({name: 'name', cast: '  '});
            }).toThrow(new TypeError('Invalid \'cast\' value: "  ".'));
        });
        it('must throw on invalid property \'mod\'', function () {
            expect(function () {
                new helpers.Column({name: 'name', mod: 123});
            }).toThrow(new TypeError('Invalid \'mod\' value: 123.'));
            expect(function () {
                new helpers.Column({name: 'name', mod: ''});
            }).toThrow(new TypeError('Invalid \'mod\' value: "".'));
            expect(function () {
                new helpers.Column({name: 'name', mod: '  '});
            }).toThrow(new TypeError('Invalid \'mod\' value: "  ".'));
        });
    });

});

describe('ColumnSet', function () {

    describe('Function call', function () {
        it('must return a new object', function () {
            // eslint-disable-next-line
            const obj = helpers.ColumnSet(['colName']);
            expect(obj instanceof helpers.ColumnSet).toBe(true);
        });
    });

    describe('options', function () {
        it('must ignore empty options', function () {
            const cs = new helpers.ColumnSet(['nameName'], {});
            expect('table' in cs).toBe(false);
        });
        it('must set table correctly', function () {
            const t = new helpers.TableName('table');
            const cs = new helpers.ColumnSet(['name'], {table: t});
            expect(cs.table.toString()).toBe('"table"');
        });
        it('must support inherited properties', function () {
            function A() {
            }

            A.prototype.first = 1;

            function B() {
                this.second = 2;
            }

            utils.inherits(B, A);

            const obj = new B();

            const cs1 = new helpers.ColumnSet(obj);
            const cs2 = new helpers.ColumnSet(obj, {inherit: true});
            expect(cs1.columns.length).toBe(1);
            expect(cs1.columns[0].name).toBe('second');
            expect(cs2.columns.length).toBe(2);
            expect(cs2.columns[0].name).toBe('second');
            expect(cs2.columns[1].name).toBe('first');

        });
    });

    describe('initialization', function () {
        it('must accept a Column directly', function () {
            const col = new helpers.Column('colName');
            const cs = new helpers.ColumnSet(col);
            expect(cs.columns.length).toBe(1);
            expect(cs.columns[0]).toBe(col);
        });
        it('must accept a Column from array directly', function () {
            const col = new helpers.Column('colName');
            const cs = new helpers.ColumnSet([col]);
            expect(cs.columns.length).toBe(1);
            expect(cs.columns[0]).toBe(col);
        });
        it('must enumerate an object properties', function () {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(cs.columns.length).toBe(2);
            expect(cs.columns[0].name).toBe('val');
            expect(cs.columns[1].name).toBe('msg');
        });
    });

    describe('property \'names\'', function () {
        const cs = new helpers.ColumnSet(['name1', 'name2']);
        const csEmpty = new helpers.ColumnSet([]);
        it('must return the right string', function () {
            expect(cs.names).toBe('"name1","name2"');
            expect(csEmpty.names).toBe('');
        });
        it('must reuse the data', function () {
            expect(cs.names).toBe('"name1","name2"');
        });
    });

    describe('property \'variables\'', function () {
        const cs = new helpers.ColumnSet(['id^', {name: 'cells', cast: 'int[]'}, 'doc:json']);
        const csEmpty = new helpers.ColumnSet([]);
        it('must return the right string', function () {
            expect(cs.variables).toBe('${id^},${cells}::int[],${doc:json}');
            expect(csEmpty.variables).toBe('');
        });
        it('must reuse the data', function () {
            expect(cs.variables).toBe('${id^},${cells}::int[],${doc:json}');
        });
    });

    describe('method \'assign\'', function () {
        const cs = new helpers.ColumnSet(dataSingle);
        const csEmpty = new helpers.ColumnSet([]);
        it('must return the right update string', function () {
            expect(cs.assign({source: dataSingle})).toBe('"val"=${val},"msg"=${msg}');
            expect(csEmpty.assign({source: dataSingle})).toBe('');
        });
        it('must return the right string without source', function () {
            const specialCS = new helpers.ColumnSet([{name: 'val', skip: () => false}, 'msg']);
            expect(specialCS.assign()).toBe('"val"=${val},"msg"=${msg}');
            expect(specialCS.assign(null)).toBe('"val"=${val},"msg"=${msg}');
            expect(specialCS.assign(123)).toBe('"val"=${val},"msg"=${msg}');
        });
        it('must reuse the data', function () {
            expect(cs.assign({source: dataSingle})).toBe('"val"=${val},"msg"=${msg}');
        });
        it('must handle cnd and skip', function () {
            const cs1 = new helpers.ColumnSet(['?val', 'msg']);
            const cs2 = new helpers.ColumnSet(['val', {
                name: 'msg', skip: function () {
                }
            }]);
            const cs3 = new helpers.ColumnSet(['val', {
                name: 'msg', skip: function () {
                    return true;
                }
            }]);
            expect(cs1.assign({source: dataSingle})).toBe('"msg"=${msg}');
            expect(cs2.assign({source: dataSingle})).toBe('"val"=${val},"msg"=${msg}');
            expect(cs3.assign({source: dataSingle})).toBe('"val"=${val}');
        });

        describe('with prefix', () => {
            const cs = new helpers.ColumnSet(['val', 'msg']);
            it('must correctly escape as alias', () => {
                expect(cs.assign({
                    source: dataSingle,
                    prefix: 'a b c'
                })).toBe('"a b c"."val"=${val},"a b c"."msg"=${msg}');
            });
        });
    });

    describe('method assignColumns', () => {
        const cs = new helpers.ColumnSet(['?id', 'name', 'title']);
        describe('without options', () => {
            it('must provide default processing', () => {
                expect(cs.assignColumns()).toBe('"id"="id","name"="name","title"="title"');
            });
        });
        describe('option "skip"', () => {
            it('must skip the columns', () => {
                expect(cs.assignColumns({skip: ''})).toBe('"id"="id","name"="name","title"="title"');
                expect(cs.assignColumns({skip: 'id'})).toBe('"name"="name","title"="title"');
                expect(cs.assignColumns({skip: ['id']})).toBe('"name"="name","title"="title"');
                expect(cs.assignColumns({skip: c => c.cnd})).toBe('"name"="name","title"="title"');
            });
        });
        describe('option "from"', () => {
            it('must append to the source columns', () => {
                expect(cs.assignColumns({from: ''})).toBe('"id"="id","name"="name","title"="title"');
                expect(cs.assignColumns({from: 'source'})).toBe('"id"=source."id","name"=source."name","title"=source."title"');
            });
        });
        describe('option "to"', () => {
            it('must append to the target columns', () => {
                expect(cs.assignColumns({to: ''})).toBe('"id"="id","name"="name","title"="title"');
                expect(cs.assignColumns({to: 'dest'})).toBe('dest."id"="id",dest."name"="name",dest."title"="title"');
            });
        });
        describe('in a complex scenario', () => {
            it('must allow all combinations', () => {
                expect(cs.assignColumns({
                    from: 'EXCLUDED',
                    to: 'Target',
                    skip: 'id'
                })).toBe('"Target"."name"=EXCLUDED."name","Target"."title"=EXCLUDED."title"');
            });
        });
    });

    describe('method \'prepare\'', function () {
        it('must replicate full objects', function () {
            const cs = new helpers.ColumnSet(dataSingle);
            const obj = cs.prepare(dataSingle);
            expect(obj).toEqual(dataSingle);
        });
        it('must set defaults for missing properties', function () {
            const cs = new helpers.ColumnSet(['val',
                {
                    name: 'msg',
                    init: function (col) {
                        return col.value + '-init';
                    }
                },
                {
                    name: 'one',
                    def: 'def-test'
                },
                {
                    name: 'first',
                    init: function () {
                        return 'init-test';
                    }
                },
                'wrong']);
            const obj = cs.prepare(dataSingle);
            expect(obj).toEqual({
                val: dataSingle.val,
                msg: dataSingle.msg + '-init',
                one: 'def-test',
                first: 'init-test'
            });
        });
    });

    describe('method \'extend\'', function () {
        it('must extend columns', function () {
            const first = new helpers.ColumnSet(['one', 'two'], {table: 'my-table'});
            const second = new helpers.ColumnSet(['three', 'four']);
            const result = new helpers.ColumnSet(['one', 'two', 'three', 'four'], {table: 'my-table'});
            const dest1 = first.extend(second);
            const dest2 = first.extend(['three', 'four']);
            expect(dest1.table).toBe(first.table);
            expect(dest2.table).toBe(first.table);
            expect(dest1.toString()).toBe(result.toString());
            expect(dest2.toString()).toBe(result.toString());
        });
        it('must throw on duplicate columns names', function () {
            const cs = new helpers.ColumnSet(['one', 'two']);
            expect(function () {
                cs.extend(['two']);
            }).toThrow(new Error('Duplicate column name "two".'));
        });
    });

    describe('method \'merge\'', function () {
        it('must merge all columns', function () {
            const first = new helpers.ColumnSet(['one', 'two'], {table: 'my-table'});
            const second = new helpers.ColumnSet(['two', 'three']);
            const result = new helpers.ColumnSet(['one', 'two', 'three'], {table: 'my-table'});
            const dest1 = first.merge(second);
            const dest2 = first.merge(['two', 'three']);
            expect(dest1.table).toBe(first.table);
            expect(dest2.table).toBe(first.table);
            expect(dest1.toString()).toBe(result.toString());
            expect(dest2.toString()).toBe(result.toString());
        });
    });

    describe('Negative', function () {
        it('must throw on invalid columns', function () {
            const error = new TypeError('Invalid parameter \'columns\' specified.');
            expect(function () {
                new helpers.ColumnSet();
            }).toThrow(error);
            expect(function () {
                new helpers.ColumnSet(123);
            }).toThrow(error);
        });
        it('must throw on duplicate columns', function () {
            expect(function () {
                new helpers.ColumnSet(['one', 'one']);
            }).toThrow(new Error('Duplicate column name "one".'));
        });

        it('must throw on invalid options', function () {
            const error = new TypeError('Invalid parameter \'options\' specified.');
            expect(function () {
                new helpers.ColumnSet({}, 123);
            }).toThrow(error);
        });
    });

    describe('console coverage', function () {
        const cs1 = new helpers.ColumnSet(['name']);
        const cs2 = new helpers.ColumnSet(['name'], {table: 'table'});
        const cs3 = new helpers.ColumnSet([]);
        const gap = utils.messageGap(1);
        it('must cover all lines', function () {
            expect(cs1.toString()).toContain('columns: [');
            expect(cs2.toString()).toContain('table: "table"');
            expect(cs3.toString()).toBe('ColumnSet {' + os.EOL + gap + 'columns: []' + os.EOL + '}');
            expect(cs1.toString(1) !== tools.inspect(cs1)).toBe(true);
        });
    });

});

describe('method \'sets\'', function () {

    describe('with a ColumnSet', function () {
        it('must reuse the ColumnSet', function () {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(helpers.sets(dataSingle, cs)).toBe('"val"=123,"msg"=\'test\'');
        });
        it('must skip conditional columns', function () {
            const cs = new helpers.ColumnSet(['?val', 'msg']);
            expect(helpers.sets(dataSingle, cs)).toBe('"msg"=\'test\'');
        });
        it('must skip dynamic columns correctly', function () {
            const cs = new helpers.ColumnSet(['val', {name: 'msg', skip: () => true}]);
            expect(helpers.sets(dataSingle, cs)).toBe('"val"=123');
        });
        it('must apply sql casting correctly', function () {
            const cs = new helpers.ColumnSet([{name: 'msg', cast: 'text'}]);
            expect(helpers.sets(dataSingle, cs)).toBe('"msg"=\'test\'::text');
        });
    });

    describe('without a ColumnSet', function () {
        it('must create local ColumnSet', function () {
            expect(helpers.sets(dataSingle)).toBe('"val"=123,"msg"=\'test\'');
        });
    });

    describe('without columns', function () {
        it('must return an empty string', function () {
            const cs = new helpers.ColumnSet(['?val', '?msg']);
            expect(helpers.sets(dataSingle, cs)).toBe('');
            expect(helpers.sets(dataSingle, [])).toBe('');
        });
    });

    describe('Negative', function () {
        const error = new TypeError('Invalid parameter \'data\' specified.');
        it('must throw when \'data\' is not an object', function () {
            expect(function () {
                helpers.sets();
            }).toThrow(error);
            expect(function () {
                helpers.sets(null);
            }).toThrow(error);
            expect(function () {
                helpers.sets(123);
            }).toThrow(error);
            expect(function () {
                helpers.sets([]);
            }).toThrow(error);
        });
    });
});

describe('method \'values\'', function () {

    describe('with a ColumnSet', function () {
        it('must reuse the ColumnSet', function () {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(helpers.values(dataSingle, cs)).toBe('(123,\'test\')');
        });
        it('must apply sql casting', function () {
            const cs = new helpers.ColumnSet(['val', {name: 'msg', cast: 'text'}]);
            expect(helpers.values(dataSingle, cs)).toBe('(123,\'test\'::text)');
        });
    });

    describe('without a ColumnSet', function () {
        it('must create local ColumnSet', function () {
            expect(helpers.values(dataSingle)).toBe('(123,\'test\')');
        });
    });

    describe('with an array of data', function () {
        it('must return query for a single object', function () {
            expect(helpers.values(dataSingle)).toBe('(123,\'test\')');
        });
        it('must return query for multiple objects', function () {
            expect(helpers.values(dataMulti, ['val', 'msg'])).toBe('(123,\'hello\'),(456,\'world\')');
        });
        it('must apply casting correctly', function () {
            expect(helpers.values(dataMulti, ['val', {
                name: 'msg',
                cast: 'text'
            }])).toBe('(123,\'hello\'::text),(456,\'world\'::text)');
        });
    });

    describe('with an empty data array', function () {
        it('must return an empty string', function () {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(helpers.values([], cs)).toBe('');
        });
    });

    describe('Negative', function () {
        it('must throw when \'data\' is not valid', function () {
            const error = new TypeError('Invalid parameter \'data\' specified.');
            expect(function () {
                helpers.values();
            }).toThrow(error);
            expect(function () {
                helpers.values(null);
            }).toThrow(error);
            expect(function () {
                helpers.values(123);
            }).toThrow(error);
        });
        it('must throw when there are no columns', function () {
            const error = new TypeError('Cannot generate values without any columns.');
            expect(function () {
                helpers.values(dataSingle, []);
            }).toThrow(error);
        });
        it('must throw when no columns for an array', function () {
            const error = new TypeError('Parameter \'columns\' is required when generating multi-row values.');
            expect(function () {
                helpers.values([{}]);
            }).toThrow(error);
        });
        it('must throw on invalid data object', function () {
            const error = new TypeError('Invalid object at index 0.');
            expect(function () {
                helpers.values([null], ['val']);
            }).toThrow(error);
            expect(function () {
                helpers.values([123], ['val']);
            }).toThrow(error);
        });
    });
});

describe('method \'concat\'', function () {
    describe('Negative', function () {
        it('must throw on a non-array input', function () {
            const error = new TypeError('Parameter \'queries\' must be an array.');
            expect(function () {
                helpers.concat();
            }).toThrow(error);
            expect(function () {
                helpers.concat(123);
            }).toThrow(error);
        });
        it('must throw on invalid elements inside array', function () {
            const error = new Error('Invalid query element at index 0.');
            expect(function () {
                helpers.concat([1]);
            }).toThrow(error);
            expect(function () {
                helpers.concat([{}]);
            }).toThrow(error);
        });
    });

    describe('Positive', function () {
        describe('with simple strings', function () {
            it('must allow an empty array', function () {
                expect(helpers.concat([])).toBe('');
            });
            it('must remove symbols correctly', function () {
                expect(helpers.concat(['one', 'two'])).toBe('one;two'); // normal
                expect(helpers.concat(['\t;;one;\t;', '  two ;;\t\t'])).toBe('one;two');
                expect(helpers.concat(['\t;;one;\t;here ', '  two ;;\t\t'])).toBe('one;\t;here;two');
            });
        });
        describe('with QueryFile', function () {
            it('must support mixed types correctly', function () {
                const qf = new QueryFile(path.join(__dirname, './sql/allUsers.sql'), {minify: true, noWarnings: true});
                expect(helpers.concat(['one', {query: 'two'}, qf])).toBe('one;two;select * from users');
            });
        });
        describe('with formatting options', function () {
            it('must format parameters correctly', function () {
                expect(helpers.concat([{
                    query: '$1^, $2^, $3^',
                    values: ['a', 'b'],
                    options: {
                        partial: true
                    }
                }])).toBe('a, b, $3^');
            });
        });
        describe('with empty queries', function () {
            it('must skip them', function () {
                expect(helpers.concat(['', '', ''])).toBe('');

                expect(helpers.concat([';\t\t;;;', {
                    query: '; $1^ ; $2^ ;;;\t', values: ['  ', '\t\t\t']
                }])).toBe('');
            });
        });
    });
});
