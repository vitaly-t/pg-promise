import * as pgPromise from '../../typescript/pg-promise';
import * as pgSubset from '../../typescript/pg-subset';
import {TypeId} from '../../typescript/pg-subset';

const pgp: pgPromise.IMain = pgPromise();
const db = pgp('connection');

const pg = pgp.pg;

pg.types.setTypeParser(TypeId.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);

db.connect()
    .then(t => {
        t.client.on('notification', (message) => {
            const s = message.anything;
        });
        t.client.removeAllListeners();
    });

const query = new pg.Query();

const database = pg.defaults.database;

let col: pgSubset.IColumn;
let res: pgSubset.IResult;
