import * as pgPromise from '../../typescript/pg-promise';
import {IConnectionParameters} from "../../typescript/pg-subset";

var pgp: pgPromise.IMain = pgPromise({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});

var c: pgPromise.IConfig;
c.binary = true;

var spex = pgp.spex;

var b = spex.batch([1, 2, 3]);

interface Test {
    hello: string;
}

var db = <pgPromise.IDatabase<Test> & Test>pgp('connection');

var connection1: string = <string>db.$cn;
var connection2: IConnectionParameters = <IConnectionParameters>db.$cn;

var context: any = db.$dc;

db.one('');

db.one(new pgPromise.QueryFile(''));

var txMode: any = new pgPromise.txMode.TransactionMode();

function myTransaction(t: any) {
}

var txFunc: any = myTransaction;
txFunc['txMode'] = txMode;
txFunc.txMode = txMode;

db.tx(function (t) {
    var w = t.one('');
    var q = t.hello;
});
