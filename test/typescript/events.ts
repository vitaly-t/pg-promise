/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp = pgPromise({
    receive: (data, result, e)=> {
        var dc = e.dc;
        var d = data[0].prop;
        var r = result.fields[0].name;
        var query = e.query;
    },
    query: (e)=> {
        var dc = e.dc;
        var query = e.query;
    },
    error: (err, e)=> {
        var dc = e.dc;
        var query = e.query;
    },
    extend: (obj, dc)=> {
        obj['method'] = (val)=> {
            return obj.one(null, val);
        }
    }
});

var db = pgp('connection');

db.task(t=> {
        var dc = t.ctx.dc;
        return t.batch([
            t.one('query'),
            t.none('query')
        ]);
    })
    .then(data=> {
    })
    .catch(error=> {

    });
