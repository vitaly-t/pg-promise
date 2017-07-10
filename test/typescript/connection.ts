import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db = pgp('connection');

type t = pgPromise.TConfig;
let r: t;
r.application_name = 'hello';
r.ssl = {
    ca: ''
};

const db2 = pgp({
    binary: true
});

db.connect()
    .then(ctx => {
        const cn = ctx.client.connectionParameters;
        ctx.done();
    });

db.connect({});

db.connect({
    direct: true,
    onLost: (err, e) => {
        e.client.removeListener('notification', () => {
        })
    }
});
