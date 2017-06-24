import * as pgPromise from '../../typescript/pg-promise';

function create(cb: any) {
    return {};
}

const adapter = new pgPromise.PromiseAdapter(create, (data) => {
}, (error) => {
});

const pgp = pgPromise({
    promiseLib: adapter
});
