/// <reference path="../pg-promise.d.ts" />

import * as lib from "pg-promise";

var pgp = lib({
    receive: (data, result, e)=>{
        var d = data[0].prop;
        var r = result.fields[0].name;
        var query = e.query;
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
