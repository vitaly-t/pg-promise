/// <reference path="../pg-promise.d.ts" />
//
// To run: tsc basic.ts --target es6 --module commonjs

import * as lib from "pg-promise";

var pgp = lib({
    capSQL: true
});

var db = pgp('connection');

db.task(t=> {
        return t.batch([
            t.one('query'),
            t.none('query')
        ]);
    })
    .then(data=> {
    })
    .catch(error=> {

    });
