import * as pgPromise from '../../typescript/pg-promise';

const adapter = new pgPromise.PromiseAdapter({
    create: cb => new Promise(cb),
    resolve: () => {
    },
    reject: () => {
    },
    all: () => Promise.resolve()
});

const pgp = pgPromise({
    promiseLib: adapter
});
