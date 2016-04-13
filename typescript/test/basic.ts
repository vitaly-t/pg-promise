/// <reference path="../pg-promise.d.ts" />
//
// To run: tsc basic.ts --target es6 --module commonjs

import * as lib from "pg-promise";

var pgp = lib({
    capSQL: true
});

pgp.as.array(()=> {
    return [];
});


pgp.pg.defaults.poolSize = 20;

var sql = pgp.minify('test--query');

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
