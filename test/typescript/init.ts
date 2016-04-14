/// <reference path="../../typescript/pg-promise.d.ts" />

import * as lib from "pg-promise";

var pgp = lib({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});

interface Test {
    hello:string;
}

var db = pgp<Test>('connection');

var txMode = new lib.txMode.TransactionMode();

function myTransaction(t) {
}

myTransaction['txMode'] = txMode;

db.tx(function (t) {
    var w = t.one('');
    var q = t.hello;
});
