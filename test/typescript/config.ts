import * as pgPromise from '../../typescript/pg-promise';
import {IGenericPromise} from "../../typescript/pg-promise";

const pgp: pgPromise.IMain = pgPromise();
const db = pgp('connection');

const cfg = db.$config;
const p: IGenericPromise = cfg.promise;

p((resolve, reject) => {
    resolve(123);
    reject(new Error('ops!'));
})
    .then(data => {

    });

cfg.options.capSQL = true;

cfg.pgp.as.format('');

const version: string = cfg.version;
