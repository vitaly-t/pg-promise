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

describe('INSERT', () => {

    describe('single:', () => {
        describe('direct data', () => {
            it('must return all data properties as columns', () => {
                expect(helpers.insert(dataSingle, null, 'table')).toBe('insert into "table"("val","msg") values(123,\'test\')');
            });
        });
    });

    describe('multi:', () => {
        describe('direct data', () => {
            it('must return all data columns', () => {
                expect(helpers.insert(dataMulti, ['val', 'msg'], 'table')).toBe('insert into "table"("val","msg") values(123,\'hello\'),(456,\'world\')');
            });
        });
    });

    describe('setting table name', () => {
        const cs = new helpers.ColumnSet(dataSingle, {table: 'external'});
        it('must use its own table when specified', () => {
            expect(helpers.insert(dataSingle, cs, 'internal')).toBe('insert into "internal"("val","msg") values(123,\'test\')');
        });
        it('must use ColumnSet table when not locally specified', () => {
            expect(helpers.insert(dataSingle, cs)).toBe('insert into "external"("val","msg") values(123,\'test\')');
        });
    });

    describe('generating sql in upper case', () => {
        beforeEach(() => {
            options.capSQL = true;
        });
        it('must return a capitalized query', () => {
            expect(helpers.insert(dataSingle, null, 'table')).toBe('INSERT INTO "table"("val","msg") VALUES(123,\'test\')');
        });
        afterEach(() => {
            options.capSQL = false;
        });
    });

    describe('negative', () => {
        it('must throw on invalid data', () => {
            const error = 'Invalid parameter \'data\' specified.';
            expect(() => {
                helpers.insert();
            }).toThrow(error);
            expect(() => {
                helpers.insert(123);
            }).toThrow(error);
        });
        it('must throw on an empty array', () => {
            const error = 'Cannot generate an INSERT from an empty array.';
            expect(() => {
                helpers.insert([]);
            }).toThrow(error);
        });
        it('must throw for an array without columns specified', () => {
            const error = 'Parameter \'columns\' is required when inserting multiple records.';
            expect(() => {
                helpers.insert([{}]);
            }).toThrow(error);
        });
        it('must throw for an empty column set', () => {
            const error = 'Cannot generate an INSERT without any columns.';
            expect(() => {
                helpers.insert({}, []);
            }).toThrow(error);
        });
        it('must throw when table is not specified', () => {
            const error = 'Table name is unknown.';
            expect(() => {
                helpers.insert({}, ['test']);
            }).toThrow(error);
        });
        it('must throw on invalid array data', () => {
            const error = 'Invalid insert object at index 0.';
            expect(() => {
                helpers.insert([null], ['test'], 'table');
            }).toThrow(error);
        });
    });
});

describe('UPDATE', () => {

    describe('single:', () => {
        describe('direct data', () => {
            it('must return all properties correctly', () => {
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

    describe('multi:', () => {
        describe('direct data', () => {
            it('must return all data columns', () => {
                expect(helpers.update(dataMulti, ['?id', 'val', {
                    name: 'msg',
                    cast: 'text'
                }], 'table')).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'::text),(2,456,\'world\'::text)) as v("id","val","msg")');
            });
        });
    });

    describe('setting table name', () => {
        const cs = new helpers.ColumnSet(dataSingle, {table: 'external'});
        it('must use its own table when specified', () => {
            expect(helpers.update(dataSingle, cs, 'internal')).toBe('update "internal" set "val"=123,"msg"=\'test\'');
        });
        it('must use ColumnSet table when not locally specified', () => {
            expect(helpers.update(dataSingle, cs)).toBe('update "external" set "val"=123,"msg"=\'test\'');
        });
    });

    describe('generating sql in upper case', () => {
        const cs = new helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'table'});
        beforeEach(() => {
            options.capSQL = true;
        });
        it('must return a capitalized query for a single data', () => {
            expect(helpers.update(dataSingle, cs)).toBe('UPDATE "table" SET "val"=123,"msg"=\'test\'');
        });
        it('must return a capitalized query for multi-row data', () => {
            expect(helpers.update(dataMulti, cs)).toBe('UPDATE "table" AS t SET "val"=v."val","msg"=v."msg" FROM (VALUES(1,123,\'hello\'),(2,456,\'world\')) AS v("id","val","msg")');
        });
        afterEach(() => {
            options.capSQL = false;
        });
    });

    describe('options', () => {
        const cs = new helpers.ColumnSet(['?id', 'val', 'msg'], {table: 'table'});
        const opt = {tableAlias: 'X', valueAlias: 'Y'};
        it('must use the options', () => {
            expect(helpers.update(dataMulti, cs, null, opt)).toBe('update "table" as X set "val"=Y."val","msg"=Y."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as Y("id","val","msg")');
        });
        it('must ignore empty options', () => {
            expect(helpers.update(dataMulti, cs, null, {})).toBe('update "table" as t set "val"=v."val","msg"=v."msg" from (values(1,123,\'hello\'),(2,456,\'world\')) as v("id","val","msg")');
        });
    });

    describe('emptyUpdate', () => {
        const cs = new helpers.ColumnSet(['?id', '?val', '?msg'], {table: 'table'});
        it('must return the option value', () => {
            expect(helpers.update(dataSingle, cs, null, {emptyUpdate: 123})).toBe(123);
            expect(helpers.update(dataMulti, cs, null, {emptyUpdate: 123})).toBe(123);
        });
    });

    describe('negative', () => {
        it('must throw on invalid data', () => {
            const error = 'Invalid parameter \'data\' specified.';
            expect(() => {
                helpers.update();
            }).toThrow(error);
            expect(() => {
                helpers.update(123);
            }).toThrow(error);
        });
        it('must throw on an empty array', () => {
            const error = 'Cannot generate an UPDATE from an empty array.';
            expect(() => {
                helpers.update([]);
            }).toThrow(error);
        });
        it('must throw for an array without columns specified', () => {
            const error = 'Parameter \'columns\' is required when updating multiple records.';
            expect(() => {
                helpers.update([{}]);
            }).toThrow(error);
        });
        it('must throw for an empty column set', () => {
            const error = 'Cannot generate an UPDATE without any columns.';
            expect(() => {
                helpers.update({}, []);
            }).toThrow(error);
        });
        it('must throw when table is not specified for an array', () => {
            const error = 'Table name is unknown.';
            expect(() => {
                helpers.update({}, ['test']);
                helpers.update([{}], ['test']);
            }).toThrow(error);
        });
        it('must throw on invalid array data', () => {
            const error = 'Invalid update object at index 0.';
            expect(() => {
                helpers.update([null], ['test'], 'table');
            }).toThrow(error);
        });
    });

});

describe('TableName', () => {

    describe('Function call', () => {
        it('must return a new object', () => {
            // eslint-disable-next-line
            const obj = helpers.TableName('table');
            expect(obj instanceof helpers.TableName).toBe(true);
        });
    });

    describe('Negative', () => {

        describe('invalid \'table\' parameter', () => {
            const error = 'Table name must be a non-empty text string.';
            it('must throw an error', () => {
                expect(() => {
                    new helpers.TableName();
                }).toThrow(error);
                expect(() => {
                    new helpers.TableName(123);
                }).toThrow(error);
                expect(() => {
                    new helpers.TableName('');
                }).toThrow(error);
                expect(() => {
                    new helpers.TableName('   ');
                }).toThrow(error);
            });
        });

        describe('invalid \'schema\' parameter', () => {
            const error = 'Invalid schema name.';
            it('must throw an error', () => {
                expect(() => {
                    new helpers.TableName('table', 123);
                }).toThrow(error);
            });
        });
    });

    describe('options', () => {
        it('must find the options correctly', () => {
            const t = new helpers.TableName({table: 'table', schema: 'schema'});
            expect(t.table).toBe('table');
            expect(t.schema).toBe('schema');
        });
        it('must skip an empty schema', () => {
            const t = new helpers.TableName({table: 'table', schema: ''});
            expect('schema' in t).toBe(false);
        });
    });

    describe('console output', () => {
        it('must be formatted', () => {
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

describe('Column', () => {

    describe('Function call', () => {
        it('must return a new object', () => {
            // eslint-disable-next-line
            const obj = helpers.Column('col');
            expect(obj instanceof helpers.Column).toBe(true);
        });
    });

    describe('set all', () => {
        it('must set all values', () => {
            const col = new helpers.Column({
                name: '_colName',
                prop: '$propName01',
                def: 123,
                cnd: true,
                cast: 'int',
                mod: '^',
                init: () => {
                },
                skip: () => {
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

    describe('set defaults', () => {
        it('must set all values', () => {
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

    describe('cast', () => {
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
        it('must strip the cast', () => {
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
            })).toThrow('Invalid \'prop\' syntax: "-test".');
        });
    });

    describe('mod', () => {
        it('must strip the mod', () => {
            const col = new helpers.Column('name^');
            expect(col.name).toBe('name');
            expect(col.mod).toBe('^');
        });
        it('must set the mod', () => {
            const col = new helpers.Column({
                name: 'name',
                mod: '^'
            });
            expect(col.mod).toBe('^');
        });
    });

    describe('Negative', () => {
        it('must throw on invalid construction', () => {
            const error = 'Invalid column details.';
            expect(() => {
                new helpers.Column();
            }).toThrow(error);
            expect(() => {
                new helpers.Column(123);
            }).toThrow(error);
        });
        it('must throw on invalid input name', () => {
            expect(() => {
                new helpers.Column('');
            }).toThrow('Invalid column syntax: "".');
            expect(() => {
                new helpers.Column('  ');
            }).toThrow('Invalid column syntax: "  ".');
            expect(() => {
                new helpers.Column('name.bla');
            }).toThrow('Invalid column syntax: "name.bla".');
        });
        it('must throw on invalid property \'name\'', () => {
            expect(() => {
                new helpers.Column({name: ''});
            }).toThrow('Invalid \'name\' value: "". A non-empty string was expected.');
            expect(() => {
                new helpers.Column({name: '  '});
            }).toThrow('Invalid \'name\' value: "  ". A non-empty string was expected.');
            expect(() => {
                new helpers.Column({name: 123});
            }).toThrow('Invalid \'name\' value: 123. A non-empty string was expected.');
            expect(() => {
                new helpers.Column({name: 'name.first'});
            }).toThrow('Invalid \'name\' syntax: "name.first".');
        });
        it('must throw on invalid property \'prop\'', () => {
            expect(() => {
                new helpers.Column({name: 'name', prop: 123});
            }).toThrow('Invalid \'prop\' value: 123. A non-empty string was expected.');
            expect(() => {
                new helpers.Column({name: 'name', prop: ''});
            }).toThrow('Invalid \'prop\' value: "". A non-empty string was expected.');
            expect(() => {
                new helpers.Column({name: 'name', prop: '  '});
            }).toThrow('Invalid \'prop\' value: "  ". A non-empty string was expected.');
            expect(() => {
                new helpers.Column({name: 'name', prop: 'one.two'});
            }).toThrow('Invalid \'prop\' syntax: "one.two".');
        });
        it('must throw on invalid property \'cast\'', () => {
            expect(() => {
                new helpers.Column({name: 'name', cast: 123});
            }).toThrow('Invalid \'cast\' value: 123.');
            expect(() => {
                new helpers.Column({name: 'name', cast: ''});
            }).toThrow('Invalid \'cast\' value: "".');
            expect(() => {
                new helpers.Column({name: 'name', cast: '  '});
            }).toThrow('Invalid \'cast\' value: "  ".');
        });
        it('must throw on invalid property \'mod\'', () => {
            expect(() => {
                new helpers.Column({name: 'name', mod: 123});
            }).toThrow('Invalid \'mod\' value: 123.');
            expect(() => {
                new helpers.Column({name: 'name', mod: ''});
            }).toThrow('Invalid \'mod\' value: "".');
            expect(() => {
                new helpers.Column({name: 'name', mod: '  '});
            }).toThrow('Invalid \'mod\' value: "  ".');
        });
    });

});

describe('ColumnSet', () => {

    describe('Function call', () => {
        it('must return a new object', () => {
            // eslint-disable-next-line
            const obj = helpers.ColumnSet(['colName']);
            expect(obj instanceof helpers.ColumnSet).toBe(true);
        });
    });

    describe('options', () => {
        it('must ignore empty options', () => {
            const cs = new helpers.ColumnSet(['nameName'], {});
            expect('table' in cs).toBe(false);
        });
        it('must set table correctly', () => {
            const t = new helpers.TableName('table');
            const cs = new helpers.ColumnSet(['name'], {table: t});
            expect(cs.table.toString()).toBe('"table"');
        });
        it('must support inherited properties', () => {
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

    describe('initialization', () => {
        it('must accept a Column directly', () => {
            const col = new helpers.Column('colName');
            const cs = new helpers.ColumnSet(col);
            expect(cs.columns.length).toBe(1);
            expect(cs.columns[0]).toBe(col);
        });
        it('must accept a Column from array directly', () => {
            const col = new helpers.Column('colName');
            const cs = new helpers.ColumnSet([col]);
            expect(cs.columns.length).toBe(1);
            expect(cs.columns[0]).toBe(col);
        });
        it('must enumerate an object properties', () => {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(cs.columns.length).toBe(2);
            expect(cs.columns[0].name).toBe('val');
            expect(cs.columns[1].name).toBe('msg');
        });
    });

    describe('property \'names\'', () => {
        const cs = new helpers.ColumnSet(['name1', 'name2']);
        const csEmpty = new helpers.ColumnSet([]);
        it('must return the right string', () => {
            expect(cs.names).toBe('"name1","name2"');
            expect(csEmpty.names).toBe('');
        });
        it('must reuse the data', () => {
            expect(cs.names).toBe('"name1","name2"');
        });
    });

    describe('property \'variables\'', () => {
        const cs = new helpers.ColumnSet(['id^', {name: 'cells', cast: 'int[]'}, 'doc:json']);
        const csEmpty = new helpers.ColumnSet([]);
        it('must return the right string', () => {
            expect(cs.variables).toBe('${id^},${cells}::int[],${doc:json}');
            expect(csEmpty.variables).toBe('');
        });
        it('must reuse the data', () => {
            expect(cs.variables).toBe('${id^},${cells}::int[],${doc:json}');
        });
    });

    describe('method \'assign\'', () => {
        const cs = new helpers.ColumnSet(dataSingle);
        const csEmpty = new helpers.ColumnSet([]);
        it('must return the right update string', () => {
            expect(cs.assign({source: dataSingle})).toBe('"val"=${val},"msg"=${msg}');
            expect(csEmpty.assign({source: dataSingle})).toBe('');
        });
        it('must return the right string without source', () => {
            const specialCS = new helpers.ColumnSet([{name: 'val', skip: () => false}, 'msg']);
            expect(specialCS.assign()).toBe('"val"=${val},"msg"=${msg}');
            expect(specialCS.assign(null)).toBe('"val"=${val},"msg"=${msg}');
            expect(specialCS.assign(123)).toBe('"val"=${val},"msg"=${msg}');
        });
        it('must reuse the data', () => {
            expect(cs.assign({source: dataSingle})).toBe('"val"=${val},"msg"=${msg}');
        });
        it('must handle cnd and skip', () => {
            const cs1 = new helpers.ColumnSet(['?val', 'msg']);
            const cs2 = new helpers.ColumnSet(['val', {
                name: 'msg', skip: () => {
                }
            }]);
            const cs3 = new helpers.ColumnSet(['val', {
                name: 'msg', skip: () => {
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

    describe('method \'prepare\'', () => {
        it('must replicate full objects', () => {
            const cs = new helpers.ColumnSet(dataSingle);
            const obj = cs.prepare(dataSingle);
            expect(obj).toEqual(dataSingle);
        });
        it('must set defaults for missing properties', () => {
            const cs = new helpers.ColumnSet(['val',
                {
                    name: 'msg',
                    init: col => {
                        return col.value + '-init';
                    }
                },
                {
                    name: 'one',
                    def: 'def-test'
                },
                {
                    name: 'first',
                    init: () => {
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

    describe('method \'extend\'', () => {
        it('must extend columns', () => {
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
        it('must throw on duplicate columns names', () => {
            const cs = new helpers.ColumnSet(['one', 'two']);
            expect(() => {
                cs.extend(['two']);
            }).toThrow('Duplicate column name "two".');
        });
    });

    describe('method \'merge\'', () => {
        it('must merge all columns', () => {
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

    describe('Negative', () => {
        it('must throw on invalid columns', () => {
            const error = 'Invalid parameter \'columns\' specified.';
            expect(() => {
                new helpers.ColumnSet();
            }).toThrow(error);
            expect(() => {
                new helpers.ColumnSet(123);
            }).toThrow(error);
        });
        it('must throw on duplicate columns', () => {
            expect(() => {
                new helpers.ColumnSet(['one', 'one']);
            }).toThrow('Duplicate column name "one".');
        });

        it('must throw on invalid options', () => {
            const error = 'Invalid parameter \'options\' specified.';
            expect(() => {
                new helpers.ColumnSet({}, 123);
            }).toThrow(error);
        });
    });

    describe('console coverage', () => {
        const cs1 = new helpers.ColumnSet(['name']);
        const cs2 = new helpers.ColumnSet(['name'], {table: 'table'});
        const cs3 = new helpers.ColumnSet([]);
        const gap = utils.messageGap(1);
        it('must cover all lines', () => {
            expect(cs1.toString()).toContain('columns: [');
            expect(cs2.toString()).toContain('table: "table"');
            expect(cs3.toString()).toBe('ColumnSet {' + os.EOL + gap + 'columns: []' + os.EOL + '}');
            expect(cs1.toString(1) !== tools.inspect(cs1)).toBe(true);
        });
    });

});

describe('method \'sets\'', () => {

    describe('with a ColumnSet', () => {
        it('must reuse the ColumnSet', () => {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(helpers.sets(dataSingle, cs)).toBe('"val"=123,"msg"=\'test\'');
        });
        it('must skip conditional columns', () => {
            const cs = new helpers.ColumnSet(['?val', 'msg']);
            expect(helpers.sets(dataSingle, cs)).toBe('"msg"=\'test\'');
        });
        it('must skip dynamic columns correctly', () => {
            const cs = new helpers.ColumnSet(['val', {name: 'msg', skip: () => true}]);
            expect(helpers.sets(dataSingle, cs)).toBe('"val"=123');
        });
        it('must apply sql casting correctly', () => {
            const cs = new helpers.ColumnSet([{name: 'msg', cast: 'text'}]);
            expect(helpers.sets(dataSingle, cs)).toBe('"msg"=\'test\'::text');
        });
    });

    describe('without a ColumnSet', () => {
        it('must create local ColumnSet', () => {
            expect(helpers.sets(dataSingle)).toBe('"val"=123,"msg"=\'test\'');
        });
    });

    describe('without columns', () => {
        it('must return an empty string', () => {
            const cs = new helpers.ColumnSet(['?val', '?msg']);
            expect(helpers.sets(dataSingle, cs)).toBe('');
            expect(helpers.sets(dataSingle, [])).toBe('');
        });
    });

    describe('Negative', () => {
        const error = 'Invalid parameter \'data\' specified.';
        it('must throw when \'data\' is not an object', () => {
            expect(() => {
                helpers.sets();
            }).toThrow(error);
            expect(() => {
                helpers.sets(null);
            }).toThrow(error);
            expect(() => {
                helpers.sets(123);
            }).toThrow(error);
            expect(() => {
                helpers.sets([]);
            }).toThrow(error);
        });
    });
});

describe('method \'values\'', () => {

    describe('with a ColumnSet', () => {
        it('must reuse the ColumnSet', () => {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(helpers.values(dataSingle, cs)).toBe('(123,\'test\')');
        });
        it('must apply sql casting', () => {
            const cs = new helpers.ColumnSet(['val', {name: 'msg', cast: 'text'}]);
            expect(helpers.values(dataSingle, cs)).toBe('(123,\'test\'::text)');
        });
    });

    describe('without a ColumnSet', () => {
        it('must create local ColumnSet', () => {
            expect(helpers.values(dataSingle)).toBe('(123,\'test\')');
        });
    });

    describe('with an array of data', () => {
        it('must return query for a single object', () => {
            expect(helpers.values(dataSingle)).toBe('(123,\'test\')');
        });
        it('must return query for multiple objects', () => {
            expect(helpers.values(dataMulti, ['val', 'msg'])).toBe('(123,\'hello\'),(456,\'world\')');
        });
        it('must apply casting correctly', () => {
            expect(helpers.values(dataMulti, ['val', {
                name: 'msg',
                cast: 'text'
            }])).toBe('(123,\'hello\'::text),(456,\'world\'::text)');
        });
    });

    describe('with an empty data array', () => {
        it('must return an empty string', () => {
            const cs = new helpers.ColumnSet(dataSingle);
            expect(helpers.values([], cs)).toBe('');
        });
    });

    describe('Negative', () => {
        it('must throw when \'data\' is not valid', () => {
            const error = 'Invalid parameter \'data\' specified.';
            expect(() => {
                helpers.values();
            }).toThrow(error);
            expect(() => {
                helpers.values(null);
            }).toThrow(error);
            expect(() => {
                helpers.values(123);
            }).toThrow(error);
        });
        it('must throw when there are no columns', () => {
            const error = 'Cannot generate values without any columns.';
            expect(() => {
                helpers.values(dataSingle, []);
            }).toThrow(error);
        });
        it('must throw when no columns for an array', () => {
            const error = 'Parameter \'columns\' is required when generating multi-row values.';
            expect(() => {
                helpers.values([{}]);
            }).toThrow(error);
        });
        it('must throw on invalid data object', () => {
            const error = 'Invalid object at index 0.';
            expect(() => {
                helpers.values([null], ['val']);
            }).toThrow(error);
            expect(() => {
                helpers.values([123], ['val']);
            }).toThrow(error);
        });
    });
});

describe('method \'concat\'', () => {
    describe('Negative', () => {
        it('must throw on a non-array input', () => {
            const error = 'Parameter \'queries\' must be an array.';
            expect(() => {
                helpers.concat();
            }).toThrow(error);
            expect(() => {
                helpers.concat(123);
            }).toThrow(error);
        });
        it('must throw on invalid elements inside array', () => {
            const error = new Error('Invalid query element at index 0.');
            expect(() => {
                helpers.concat([1]);
            }).toThrow(error);
            expect(() => {
                helpers.concat([{}]);
            }).toThrow(error);
        });
    });

    describe('Positive', () => {
        describe('with simple strings', () => {
            it('must allow an empty array', () => {
                expect(helpers.concat([])).toBe('');
            });
            it('must remove symbols correctly', () => {
                expect(helpers.concat(['one', 'two'])).toBe('one;two'); // normal
                expect(helpers.concat(['\t;;one;\t;', '  two ;;\t\t'])).toBe('one;two');
                expect(helpers.concat(['\t;;one;\t;here ', '  two ;;\t\t'])).toBe('one;\t;here;two');
            });
        });
        describe('with QueryFile', () => {
            it('must support mixed types correctly', () => {
                const qf = new QueryFile(path.join(__dirname, './sql/allUsers.sql'), {minify: true, noWarnings: true});
                expect(helpers.concat(['one', {query: 'two'}, qf])).toBe('one;two;select * from users');
            });
        });
        describe('with formatting options', () => {
            it('must format parameters correctly', () => {
                expect(helpers.concat([{
                    query: '$1^, $2^, $3^',
                    values: ['a', 'b'],
                    options: {
                        partial: true
                    }
                }])).toBe('a, b, $3^');
            });
        });
        describe('with empty queries', () => {
            it('must skip them', () => {
                expect(helpers.concat(['', '', ''])).toBe('');

                expect(helpers.concat([';\t\t;;;', {
                    query: '; $1^ ; $2^ ;;;\t', values: ['  ', '\t\t\t']
                }])).toBe('');
            });
        });
    });
});
