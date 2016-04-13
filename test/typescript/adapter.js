/// <reference path="../pg-promise.d.ts" />
"use strict";
const lib = require("pg-promise");
function create(cb) {
    return {};
}
var adapter = new lib.PromiseAdapter(create, (data) => {
}, (error) => {
});
var pgp = lib({
    promiseLib: adapter
});
