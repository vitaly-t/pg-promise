import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

db.task(t => {
    const d: Date = t.ctx.start;
    const duration: number = t.ctx.duration;
    const parentTag = t.ctx.parent.tag;
    const connected: boolean = t.ctx.connected;
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

db.task<number>(t => {
    return 123;
})
    .then(data => {
    });

db.task<number>(t => {
    return Promise.resolve(123);
})
    .then(data => {
    });

db.taskIf<boolean>({cnd: true, tag: 123}, t => {
    return true;
});

db.txIf<boolean>({cnd: true, tag: 123, mode: null, reusable: true}, t => {
    return true;
});
