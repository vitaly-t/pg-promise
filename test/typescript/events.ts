/// <reference path="../../typescript/pg-promise.d.ts" />

import * as lib from "pg-promise";

var pgp = lib({
    receive: (data, result, e)=> {
        var d = data[0].prop;
        var r = result.fields[0].name;
        var query = e.query;
    },
    query: (e)=> {
        var query = e.query;
    },
    error: (err, e)=> {
        var query = e.query;
    },
    extend: (obj)=> {
        obj['method'] = (val)=> {
            return obj.one(null, val);
        }
    }
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
