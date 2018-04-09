import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

const TransactionMode = pgPromise.TransactionMode;

const mode = new TransactionMode({deferrable: true, readOnly: true, tiLevel: pgPromise.isolationLevel.readCommitted});
const mode2 = new TransactionMode(pgPromise.isolationLevel.readCommitted, true, false);

db.tx<number>({mode: null}, t => {
    return 123;
});

db.tx<number>({mode}, t => {
    return 123;
});

db.tx<number>({mode: mode2}, t => {
    return 123;
});

db.txIf<boolean>({cnd: true, tag: 123, mode: null, reusable: true}, t => {
    return true;
});

db.txIf<boolean>({cnd: true, tag: 123, mode, reusable: true}, t => {
    return true;
});

db.txIf<boolean>({cnd: true, tag: 123, mode: mode2, reusable: true}, t => {
    return true;
});
