import * as pgPromise from '../../typescript/pg-promise';
import {Column, ColumnSet, TableName, IMain} from '../../typescript/pg-promise';

const pgp: IMain = pgPromise({
    capSQL: true
});

const col1: Column = new pgp.helpers.Column({
    name: 'third-col',
    prop: 'third',
    def: 888,
    cast: '',
    cnd: true,
    init: (col) => {
        const e = col.exists;
        return this.test;
    },
    skip: (col) => {
        const e = col.exists;
        return false;
    }
});

const col2: Column = new pgp.helpers.Column('col');

const data = [
    {
        first: 1,
        second: 'two'
    }, {
        first: 111,
        second: 'hello'
    }
];

const table1: TableName = new pgp.helpers.TableName('');
const table2: TableName = new pgp.helpers.TableName({table: ''});
const table3: TableName = new pgp.helpers.TableName({table: '', schema: ''});

const cs: ColumnSet = new pgp.helpers.ColumnSet([
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

var r = cs.columns;

const insert: string = pgp.helpers.insert(data, cs, 'my-table');
const update: string = pgp.helpers.update(data, cs, table1, {tableAlias: 'W'});

const values1: string = pgp.helpers.values({});
const values2: string = pgp.helpers.values({}, []);
const values3: string = pgp.helpers.values([{}], []);
const values4: string = pgp.helpers.values([], cs);

const names: string = cs.names;
const variables: string = cs.variables;

let obj = cs.prepare(null); // this one should fail
obj = cs.prepare({});

const sets1: string = pgp.helpers.sets({});
const sets2: string = pgp.helpers.sets([]);
const sets3: string = pgp.helpers.sets({}, cs);

const cs1: ColumnSet = cs.extend(['']);
const cs2: ColumnSet = cs1.merge(cs);

const c1: string = pgp.helpers.concat(['first', {query: 'second'}]);
const c2: string = pgp.helpers.concat(['first', new pgp.QueryFile(''), {
    query: '',
    values: 123,
    options: {partial: true}
}]);

cs1.assignColumns();
cs1.assignColumns({});
cs1.assignColumns({from: 'source'});
cs1.assignColumns({to: 'target', skip: 'one'});
cs1.assignColumns({skip: ['one', 'two']});
