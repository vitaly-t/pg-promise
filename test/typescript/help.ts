/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp: pgPromise.IMain = pgPromise({
    capSQL: true
});

var col1 = new pgp.helpers.Column({
    name: 'third-col',
    prop: 'third',
    def: 888,
    cast: '',
    cnd: true,
    init: (value)=> {
        return this.test;
    },
    skip: ()=> {
        return false;
    }
});

var col2 = new pgp.helpers.Column('col');

var data = [
    {
        first: 1,
        second: 'two'
    }, {
        first: 111,
        second: 'hello'
    }
];

var table1 = new pgp.helpers.TableName('');
var table2 = new pgp.helpers.TableName({table: ''});
var table3 = new pgp.helpers.TableName({table: '', schema: ''});

var cs = new pgp.helpers.ColumnSet([
    'first', 'second', {
        name: 'third-col',
        prop: 'third',
        def: 888,
        cast: '',
        cnd: true,
        init: ()=> {
        },
        skip: ()=> {
        }
    }
], {table: 'my-table', inherit: true});

var insert = pgp.helpers.insert(data, cs, 'my-table');
var update = pgp.helpers.update(data, cs, table1, {tableAlias: 'W'});

var values1 = pgp.helpers.values({});
var values2 = pgp.helpers.values({}, []);
var values3 = pgp.helpers.values([{}], []);
var values4 = pgp.helpers.values([], cs);

var sets1 = pgp.helpers.sets({});
var sets2 = pgp.helpers.sets([]);
var sets3 = pgp.helpers.sets({}, cs);

var test: boolean = cs.canUpdate(data);

var cs1 = cs.extend(['']);
var cs2 = cs1.merge(cs);

pgp.helpers.concat(['first', {query: 'second'}]);
pgp.helpers.concat(['first', new pgp.QueryFile(''), {query: '', values: 123, options: {partial: true}}]);
