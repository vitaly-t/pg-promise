/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

interface Extensions {
    findUser(userId:number):Promise<any>;
}

var pgp:pgPromise.IMain = pgPromise({
    extend: function (obj:any, dc:any) {
        obj['findUser'] = (userId:number)=> {
            return obj.one('', userId);
        }
    }
});

var db = pgp('connection');

var pgpExt = pgPromise<Extensions>({
    extend: function (obj:pgPromise.IDatabase<Extensions>&Extensions) {
        obj.findUser = (userId:number)=> {
            return obj.one('', userId);
        }
    }
});

var dbExt1 = <pgPromise.IDatabase<Extensions>&Extensions>pgp('connection');
var dbExt2 = <pgPromise.IDatabase<Extensions>&Extensions>pgpExt('connection');
var dbExt3 = pgpExt<Extensions>('connection');

dbExt1.findUser(123).then();
dbExt2.findUser(123).then();
dbExt3.findUser(123).then();

dbExt1.task(function (t) {
    return t.findUser(123);
});

dbExt2.task(function (t) {
    return t.findUser(123);
});

dbExt3.task(function (t) {
    return t.findUser(123);
});

dbExt1.tx(t=> {
    return t.findUser(123);
});

dbExt2.tx(t=> {
    return t.findUser(123);
});

dbExt3.tx(t=> {
    return t.findUser(123);
});
