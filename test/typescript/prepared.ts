/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp = pgPromise();
var db = pgp('connection');

var ps1 = new pgp.PreparedStatement('', '', []);
var ps2 = new pgp.PreparedStatement({name: '', text: ''});
var ps3 = new pgp.PreparedStatement(ps1);

var qf = new pgPromise.QueryFile('file');
var ps4 = new pgp.PreparedStatement({name: '', text: qf});

db.one(ps1.get());
db.one(ps1);

db.one(ps1.create(undefined));
db.one(ps1.create(null));
db.one(ps1.create([]));
db.one(ps1.create([123]));

db.one({
    name: '',
    text: ''
});
