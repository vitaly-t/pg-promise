import * as pgPromise from '../../typescript/pg-promise';

const adapter = new pgPromise.PromiseAdapter({
    create(cb) {
        return new Promise(cb);
    },
    resolve() {
    },
    reject() {
    },
    all() {
        return Promise.resolve();
    }
});

const pgp = pgPromise({
    promiseLib: adapter
});
