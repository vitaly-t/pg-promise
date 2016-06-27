/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp:pgPromise.IMain = pgPromise();
var db:pgPromise.IDatabase<any> = pgp('connection');

var ps1 = new pgp.PreparedStatement('', '', []);
var ps2 = new pgp.PreparedStatement({name: '', text: ''});
var ps3 = new pgp.PreparedStatement(ps1);

var qf = new pgPromise.QueryFile('file');

ps3.text = 'some text';
ps3.text = qf;

var ps4 = new pgp.PreparedStatement({name: '', text: qf, values: [], rowMode: 'hello', rows: 123});

db.one(ps1);

db.one({
    name: '',
    text: ''
});

db.one({
    name: '',
    text: qf
});

var test1 = <typeof pgPromise.errors.PreparedStatementError>ps1.parse();
var file = test1.error.file;
