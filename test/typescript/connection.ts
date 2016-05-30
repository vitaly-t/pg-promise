/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp = pgPromise();
var db = pgp('connection');

db.connect()
    .then(ctx=> {
        var cn = ctx.client.connectionParameters;
        ctx.done();
    });

db.connect({});

db.connect({direct: true});

