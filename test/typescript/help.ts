import * as pgPromise from '../../typescript/pg-promise';
import {Column, ColumnSet, TableName, IMain} from '../../typescript/pg-promise';

var pgp: IMain = pgPromise({
    capSQL: true
});

var col1: Column = new pgp.helpers.Column({
    name: 'third-col',
    prop: 'third',
    def: 888,
    cast: '',
    cnd: true,
    init: (col) => {
        var e = col.exists;
        return this.test;
    },
    skip: (col) => {
        var e = col.exists;
        return false;
    }
});

var col2: Column = new pgp.helpers.Column('col');

var data = [
    {
        first: 1,
        second: 'two'
    }, {
        first: 111,
        second: 'hello'
    }
];

var table1: TableName = new pgp.helpers.TableName('');
var table2: TableName = new pgp.helpers.TableName({table: ''});
var table3: TableName = new pgp.helpers.TableName({table: '', schema: ''});

var cs: ColumnSet = new pgp.helpers.ColumnSet([
    'first', 'second', {
        name: 'third-col',
        prop: 'third',
        def: 888,
        cast: '',
        cnd: true,
        init: () => {
        },
        skip: () => {
        }
    }
], {table: 'my-table', inherit: true});

var insert: string = pgp.helpers.insert(data, cs, 'my-table');
var update: string = pgp.helpers.update(data, cs, table1, {tableAlias: 'W'});

var values1: string = pgp.helpers.values({});
var values2: string = pgp.helpers.values({}, []);
var values3: string = pgp.helpers.values([{}], []);
var values4: string = pgp.helpers.values([], cs);

var names: string = cs.names;
var variables: string = cs.variables;

var sets1: string = pgp.helpers.sets({});
var sets2: string = pgp.helpers.sets([]);
var sets3: string = pgp.helpers.sets({}, cs);

var cs1: ColumnSet = cs.extend(['']);
var cs2: ColumnSet = cs1.merge(cs);

var c1: string = pgp.helpers.concat(['first', {query: 'second'}]);
var c2: string = pgp.helpers.concat(['first', new pgp.QueryFile(''), {
    query: '',
    values: 123,
    options: {partial: true}
}]);
