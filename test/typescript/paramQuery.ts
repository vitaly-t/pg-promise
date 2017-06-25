import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

const pq1 = new pgp.ParameterizedQuery('', []);
const pq2 = new pgp.ParameterizedQuery({text: ''});
const pq3 = new pgp.ParameterizedQuery(pq1);

const qf = new pgPromise.QueryFile('file');
const pq4 = new pgp.ParameterizedQuery({text: qf, values: [123], rowMode: 'array'});

pq4.text = 'test';
pq4.text = qf;

db.one(pq1);

db.one({
    name: '',
    text: ''
});

db.one({
    name: '',
    text: qf
});

const test1 = <pgPromise.errors.ParameterizedQueryError>pq1.parse();
const file = test1.error.file;
