import * as pgPromise from '../../typescript/pg-promise';

var pgp:pgPromise.IMain = pgPromise();
var db = pgp('connection');

var cfg = db.$config;
var p = cfg.promise;

p((resolve, reject)=> {
    resolve(123);
    reject();
})
    .then(data=> {

    });

cfg.options.capSQL = true;

cfg.pgp.as.format('');

var version:string = cfg.version;
