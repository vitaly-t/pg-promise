import * as pgPromise from '../../typescript/pg-promise';

interface IExtensions {
    findUser(userId: number): Promise<any>;
}

const pgp: pgPromise.IMain = pgPromise({
    extend(obj: any, dc: any) {
        obj['findUser'] = (userId: number) => {
            return obj.one('', userId);
        }
    }
});

const db = pgp('connection');

const pgpExt = pgPromise({
    extend(obj: pgPromise.IDatabase<IExtensions> & IExtensions) {
        obj.findUser = (userId: number) => {
            return obj.one('', userId);
        }
    }
});

const dbExt1 = pgp<IExtensions>('connection');
const dbExt2 = pgpExt<IExtensions>('connection');
const dbExt3 = pgpExt<IExtensions>('connection');

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
