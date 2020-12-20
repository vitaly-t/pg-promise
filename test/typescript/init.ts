import * as pgPromise from '../../typescript/pg-promise';
import {IConnectionParameters} from '../../typescript/pg-subset';

const pgp: pgPromise.IMain = pgPromise({
    capSQL: true,
    pgFormatting: true,
    pgNative: true
});

let c: IConnectionParameters = {};
c.binary = true;

const spex = pgp.spex;

async function test() {
    const [first, second] = await spex.batch<number, string>([1, 'hello']);

    const res = await spex.batch<number, string>([1, 'hello']);
    const d = res.duration;
}

interface Test {
    hello: string;
}

const db = <pgPromise.IDatabase<Test> & Test>pgp({
    isDomainSocket: true,
    max: 20,
    application_name: 'my-app'
});

const connection1: string = <string>db.$cn;
const connection2: IConnectionParameters = <IConnectionParameters>db.$cn;

const context: any = db.$dc;
const pool: any = db.$pool;

db.one('');

db.one(new pgPromise.QueryFile(''));

db.tx({tag: 123}, function (t) {
    const w = t.one('');
    const q = t.hello;
});
