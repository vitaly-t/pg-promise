import * as pgPromise from '../../typescript/pg-promise';
import {IColumn, IResult, Client} from '../../typescript/pg-subset';
import {TypeId} from '../../typescript/pg-subset';

const pgp: pgPromise.IMain = pgPromise();
const db = pgp('connection');

const pg = pgp.pg;

pg.types.setTypeParser(TypeId.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);

db.connect()
    .then(t => {
        t.client.on('notification', (message: any) => {
            const s = message.anything;
        });
        t.client.removeAllListeners();
    });

const query = new pg.Query();

const database = pg.defaults.database;

let col: IColumn;
let res: IResult;

const c = new Client('');

// any event handlers are allowed:
c.on('whatever', (whatever1: any, whatever2: any) => {

});

c.query('test', [1, 2]).then();

// Derivation must be possible:

class MyClient extends Client {
    constructor(config: any) {
        super(config);
        this.connection.on('parameterStatus', msg => {
            if (msg.parameterName === 'server_version') {
                // this.version = msg.parameterValue;
            }
        });
        this.connection.stream.on('something', () => {

        });
    }
}
