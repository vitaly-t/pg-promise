import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise({
    schema: ['public', 'mine'],
    capSQL: true,
    noLocking: true,
    pgNative: true,
    pgFormatting: true,
    noWarnings: true
});

const pgp2: pgPromise.IMain = pgPromise({
    schema: () => {
    }
});

const pgp3: pgPromise.IMain = pgPromise({
    schema: (dc: any) => {
        return ['one', 'two'];
    }
});

const db = pgp('connection');

type t = pgPromise.TConfig;
let r: t;
r.application_name = 'hello';
r.ssl = {
    ca: ''
};

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
    onLost: (err, e) => {
        e.client.removeListener('notification', () => {
        })
    }
});
