/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var pgp:pgPromise.IMain = pgPromise({
    connect: (bla1:any, dc:any, fresh:boolean)=> {
    },
    receive: (data:any, result:any, e:any)=> {
        var dc = e.dc;
        var d = data[0].prop;
        var r = result.fields[0].name;
        var query = e.query;
    },
    query: (e:any)=> {
        var dc = e.dc;
        var query = e.query;
    },
    error: (err:any, e:any)=> {
        var dc = e.dc;
        var query = e.query;
    },
    extend: (obj:any, dc:any)=> {
        obj['method'] = (val:any)=> {
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
