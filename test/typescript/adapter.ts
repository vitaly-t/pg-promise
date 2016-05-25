/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

function create(cb:any) {
    return {};
}

var adapter = new pgPromise.PromiseAdapter(create, (data)=> {
}, (error)=> {
});

var pgp = pgPromise({
    promiseLib: adapter
});
