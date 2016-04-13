/// <reference path="../pg-promise.d.ts" />
"use strict";
const lib = require("pg-promise");
var pgp = lib({
    receive: (data, result, e) => {
        var d = data[0].prop;
        var r = result.fields[0].name;
        var query = e.query;
    },
    query: (e) => {
        var query = e.query;
    },
    error: (err, e) => {
        var query = e.query;
    }
});
var db = pgp('connection');
db.task(t => {
    return t.batch([
        t.one('query'),
        t.none('query')
    ]);
})
    .then(data => {
})
    .catch(error => {
});
