/// <reference path="../pg-promise.d.ts" />

import * as lib from "pg-promise";

var pgp = lib();

var db = pgp('connection');

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