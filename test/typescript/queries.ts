/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp:pgPromise.IMain = pgPromise();

var db:pgPromise.IDatabase<any> = pgp('connection');

var qrm = pgPromise.queryResult;

db.query('', [], qrm.one | qrm.none)
    .then(data=> {
        var d1 = data.value;
        var d2 = data[0].value;
    });

db.none('')
    .then(data=> {
    });

db.one('', [], value=>{}, 'this')
    .then(data=> {
        var value = data.value;
    });

db.oneOrNone('')
    .then(data=> {
        var value = data.value;
    });

db.many('')
    .then(data=> {
        var value = data[0].ops;
    });

db.result('', [], ()=>{}, 123)
    .then(data=> {
        var value = data.rows[0].name;
    });

db.map('', null, row=>{
    return row.value;
}).then();

db.each('', null, row=>{
    var v = row.value;
}).then();

db.task(t=> {
        return t.batch([
            t.one('')
        ]);
    })
    .then(data=> {
        var d = data.value;
        var d = data[0].value;
    });
