/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';
import * as pgSubset from 'pg-subset';

var pgp:pgPromise.IMain = pgPromise();
var db = pgp('connection');

var pg = pgp.pg;

var client = new pg.Client({
    ssl: {
        rejectUnauthorized:true
    }
});

db.connect()
    .then(t=> {
        t.client.on('notification', (message)=> {
            var s = message.anything;
        });
        t.client.removeAllListeners();
    });

var query = new pg.Query();
var connection = new pg.Connection();

var database = pg.defaults.database;

var col:pgSubset.IColumn;
var res:pgSubset.IResult;
