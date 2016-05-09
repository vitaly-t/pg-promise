/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp = pgPromise({
    capSQL: true
});

var col1 = new pgp.helpers.Column({
    name: 'third-col',
    prop: 'third',
    def: 888,
    cast: '',
    cnd: true,
    init: ()=> {
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
