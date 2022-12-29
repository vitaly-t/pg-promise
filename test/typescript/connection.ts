import * as pgPromise from '../../typescript/pg-promise';
import {IConnectionParameters} from '../../typescript/pg-subset';
import {ILostContext} from "../../typescript/pg-promise";

const pgp: pgPromise.IMain = pgPromise({
    schema: ['public', 'mine'],
    capSQL: true,
    pgNative: true,
    pgFormatting: true,
    noWarnings: true
});

const pgp2: pgPromise.IMain = pgPromise({
    schema() {
    }
});

const pgp3: pgPromise.IMain = pgPromise({
    schema(dc: any) {
        return ['one', 'two'];
    }
});

const db = pgp('connection');

type t = IConnectionParameters;
let r: t = {};
r.application_name = 'hello';
r.ssl = {
    ca: ''
};

r.password = () => 'pass123';

r.keepAlive = true;

const db2 = pgp({
    binary: true
});

db.connect()
    .then(ctx => {
        ctx.batch([1, 2, 3]);
        ctx.sequence(index => {
        });
        ctx.page(a => {
        });
        const cn = ctx.client.connectionParameters;
        ctx.done();
    });

db.connect({});

db.connect({
    direct: true,
    onLost(err: any, e: ILostContext) {
        e.client.removeListener('notification', () => {
        })
    }
});
