/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp:pgPromise.IMain = pgPromise();
var db:pgPromise.IDatabase<any> = pgp('connection');

db.task(t=> {
    var d:Date = t.ctx.start;

    return t.batch([]);
});

db.task('with a name', t=> {
    var d:Date = t.ctx.start;
    t.sequence(()=> {
    });
});

db.tx(t=> {
    var d:Date = t.ctx.start;
    t.page(()=> {
    });
});

db.tx('with a name', t=> {
    var d:Date = t.ctx.start;
});
