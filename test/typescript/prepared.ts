import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

const ps1 = new pgp.PreparedStatement('', '', []);
const ps2 = new pgp.PreparedStatement({name: '', text: ''});
const ps3 = new pgp.PreparedStatement(ps1);

const qf = new pgPromise.QueryFile('file');

ps3.text = 'some text';
ps3.text = qf;

const ps4 = new pgp.PreparedStatement({name: '', text: qf, values: [], rowMode: 'hello', rows: 123});

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
