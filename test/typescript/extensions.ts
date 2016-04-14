/// <reference path="../../typescript/pg-promise.d.ts" />

import * as lib from "pg-promise";

interface Extensions {
    findUser(userId:number):Promise<any>;
}

var pgp = lib({
    extend: function (obj) {
        obj['findUser'] = (userId)=> {
            return obj.one('', userId);
        }
    }
});

var db = pgp('connection');

var pgpExt = lib<Extensions>({
    extend: function (obj) {
        obj.findUser = (userId)=> {
            return obj.one('', userId);
        }
    }
});

var dbExt1 = pgp<Extensions>('connection');
var dbExt2 = pgpExt<Extensions>('connection');

dbExt1.findUser(123).then();
dbExt2.findUser(123).then();

dbExt1.task(function (t) {
    return t.findUser(123);
});

dbExt2.tx(t=> {
    return t.findUser(123);
});
