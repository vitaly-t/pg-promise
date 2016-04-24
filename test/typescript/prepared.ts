/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';
import PreparedStatementError = require("pg-promise");

var pgp = pgPromise();
var db = pgp('connection');

var ps1 = new pgp.PreparedStatement('', '', []);
var ps2 = new pgp.PreparedStatement({name: '', text: ''});
var ps3 = new pgp.PreparedStatement(ps1);

var qf = new pgPromise.QueryFile('file');
var ps4 = new pgp.PreparedStatement({name: '', text: qf});

db.one(ps1);

db.one({
    name: '',
    text: ''
});

db.one({
    name: '',
    text: qf
});

var w = pgPromise.errors.PreparedStatementError;

// TODO: need to figure out how to export the type namespace;
//var test1 = <pgPromise.errors.PreparedStatementError>ps1.parse();
