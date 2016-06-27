/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp:pgPromise.IMain = pgPromise();
var db:pgPromise.IDatabase<any> = pgp('connection');

var pq1 = new pgp.ParameterizedQuery('', []);
var pq2 = new pgp.ParameterizedQuery({text: ''});
var pq3 = new pgp.ParameterizedQuery(pq1);

var qf = new pgPromise.QueryFile('file');
var pq4 = new pgp.ParameterizedQuery({text: qf, values: [123], rowMode: 'array'});

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

var test1 = <typeof pgPromise.errors.ParameterizedQueryError>pq1.parse();
var file = test1.error.file;
