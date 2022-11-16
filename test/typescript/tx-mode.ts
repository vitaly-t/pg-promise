import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise();
const db: pgPromise.IDatabase<any> = pgp('connection');

const {TransactionMode} = pgPromise.txMode;

const mode = new TransactionMode({
    deferrable: true,
    readOnly: true,
    tiLevel: pgPromise.txMode.isolationLevel.readCommitted
});

db.tx<number>({mode: null}, t => {
    return 123;
});

db.tx<number>({mode}, t => {
    return 123;
});

db.txIf<boolean>({cnd: true, tag: 123, mode: null, reusable: true}, t => {
    return true;
});

db.txIf<boolean>({cnd: true, tag: 123, mode, reusable: true}, t => {
    return true;
});
