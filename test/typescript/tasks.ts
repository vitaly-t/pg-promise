/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp = pgPromise();
var db = pgp('connection');

db.task(t=> {
    var d:Date = t.ctx.start;
});

db.task('with a name', t=> {
    var d:Date = t.ctx.start;
});

db.tx(t=> {
    var d:Date = t.ctx.start;
});

db.tx('with a name', t=> {
    var d:Date = t.ctx.start;
});
