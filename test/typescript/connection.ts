/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp:pgPromise.IMain = pgPromise();
var db = pgp('connection');

type t = pgPromise.IConfig;
var r:t;
r.application_name = 'hello';
r.ssl = {
    ca: ''
};

var db2 = pgp({
    binary: true
});

db.connect()
    .then(ctx=> {
        var cn = ctx.client.connectionParameters;
        ctx.done();
    });

db.connect({});

db.connect({direct: true});

