import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

const ps1 = new pgp.PreparedStatement({name: '', text: ''});
const ps2 = new pgp.PreparedStatement(ps1);

const qf = new pgPromise.QueryFile('file');

ps1.text = 'some text';
ps1.text = qf;

const ps11 = new pgp.PreparedStatement();
const ps22 = new pgp.PreparedStatement({});
const ps3 = new pgp.PreparedStatement({name: '', text: qf, values: [], rowMode: null, rows: 123});
const ps4 = new pgp.PreparedStatement({name: '', text: qf, values: [], rowMode: 'array', rows: 0});

db.one(ps1);

db.one({
    name: '',
    text: ''
});

db.one({
    name: '',
    text: qf
});

const test1 = <pgPromise.errors.PreparedStatementError>ps1.parse();
const file = test1.error.file;
