/// <reference path="../../typescript/pg-promise.d.ts" />

import * as lib from "pg-promise";

var pgp = lib({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});

var db = pgp('connection');

var txMode = new lib.txMode.TransactionMode();

function myTransaction() {

}

myTransaction['txMode'] = txMode;

db.tx(myTransaction);
