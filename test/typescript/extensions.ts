import * as pgPromise from '../../typescript/pg-promise';

interface Extensions {
    findUser(userId: number): Promise<any>;
}

const pgp: pgPromise.IMain = pgPromise({
    extend: function (obj: any, dc: any) {
        obj['findUser'] = (userId: number) => {
            return obj.one('', userId);
        }
    }
});

const db = pgp('connection');

const pgpExt = pgPromise<Extensions>({
    extend: function (obj: pgPromise.IDatabase<Extensions> & Extensions) {
        obj.findUser = (userId: number) => {
            return obj.one('', userId);
        }
    }
});

const dbExt1 = <pgPromise.IDatabase<Extensions> & Extensions>pgp('connection');
const dbExt2 = <pgPromise.IDatabase<Extensions> & Extensions>pgpExt('connection');
const dbExt3 = pgpExt<Extensions>('connection');

dbExt1.findUser(123).then();
dbExt2.findUser(123).then();
dbExt3.findUser(123).then();

dbExt1.task(function (t) {
    return t.findUser(123);
});

dbExt2.task(function (t) {
    return t.findUser(123);
});

dbExt3.task(function (t) {
    return t.findUser(123);
});

dbExt3.task(t => {
    return [1, 2, 3];
})
    .then(data => {
        const a: number = data[0];
    });

dbExt3.tx<number>(t => {
    return Promise.resolve(123);
})
    .then(data => {
        const a: number = data;
    });

dbExt1.tx(t => {
    return t.findUser(123);
});

dbExt2.tx(t => {
    return t.findUser(123);
});

dbExt3.tx(t => {
    return t.findUser(123);
});
