import * as pgPromise from '../../typescript/pg-promise';
import {TConnectionParameters} from "../../typescript/pg-subset";

const pgp: pgPromise.IMain = pgPromise({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});

let c: pgPromise.TConfig;
c.binary = true;

const spex = pgp.spex;

const b = spex.batch([1, 2, 3]);

interface Test {
    hello: string;
}

const db = <pgPromise.IDatabase<Test> & Test>pgp({
    isDomainSocket: true,
    poolSize: 20,
    min: 0,
    max: 20,
    application_name: 'my-app'
});

const connection1: string = <string>db.$cn;
const connection2: TConnectionParameters = <TConnectionParameters>db.$cn;

const context: any = db.$dc;
const pool: any = db.$pool;

db.one('');

db.one(new pgPromise.QueryFile(''));

db.tx({tag: 123}, function (t) {
    const w = t.one('');
    const q = t.hello;
});
