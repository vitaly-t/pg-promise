import * as pgPromise from '../../typescript/pg-promise';
import {IConnectionParameters} from "../../typescript/pg-subset";

const pgp: pgPromise.IMain = pgPromise({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});

let c: pgPromise.IConfig;
c.binary = true;

const spex = pgp.spex;

const b = spex.batch([1, 2, 3]);

interface Test {
    hello: string;
}

const db = <pgPromise.IDatabase<Test> & Test>pgp('connection');

const connection1: string = <string>db.$cn;
const connection2: IConnectionParameters = <IConnectionParameters>db.$cn;

const context: any = db.$dc;
const pool: any = db.$pool;

db.one('');

db.one(new pgPromise.QueryFile(''));

const txMode: any = new pgPromise.txMode.TransactionMode();

function myTransaction(t: any) {
}

const txFunc: any = myTransaction;
txFunc['txMode'] = txMode;
txFunc.txMode = txMode;

db.tx(function (t) {
    const w = t.one('');
    const q = t.hello;
});
