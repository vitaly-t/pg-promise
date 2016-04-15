/// <reference path="../../typescript/pg-promise" />

import * as pgPromise from "pg-promise";

var pgp = pgPromise();

var db = pgp('connection');

var qrm = pgPromise.queryResult;

db.query('', [], qrm.one | qrm.none)
    .then(data=> {
        var d1 = data.value;
        var d2 = data[0].value;
    });

db.none('')
    .then(data=> {
    });

db.one('')
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

db.result('')
    .then(data=> {
        var value = data.rows[0].name;
    });

db.task(t=> {
        return t.batch([
            t.one('')
        ]);
    })
    .then(data=> {
        var d = data.value;
        var d = data[0].value;
    });
