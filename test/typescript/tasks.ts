import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

db.task(t => {
    const d: Date = t.ctx.start;
    const duration: number = t.ctx.duration;

    return t.batch([]);
});

db.task('with a name', t => {
    const d: Date = t.ctx.start;
    t.sequence(() => {
    });
});

db.tx(t => {
    const d: Date = t.ctx.start;
    t.page(() => {
    });
});

db.tx('with a name', t => {
    const d: Date = t.ctx.start;
});
