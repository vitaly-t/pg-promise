/// <reference path="../pg-promise.d.ts" />

import * as lib from "pg-promise";

function create(cb) {
    return {};
}

var adapter = new lib.PromiseAdapter(create, (data)=> {
}, (error)=> {
});

var pgp = lib({
    promiseLib: adapter
});
