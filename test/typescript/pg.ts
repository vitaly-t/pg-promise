import * as pgPromise from '../../typescript/pg-promise';
import {IColumn, IResult} from '../../typescript/pg-subset';
import {TypeId} from '../../typescript/pg-subset';

const pgp: pgPromise.IMain = pgPromise();

class MyClient extends pgp.pg.Client {

    version?: string;

    constructor(config: any) {
        super(config);
        this.connection.on('parameterStatus', msg => {
            // See the following question:
            // https://stackoverflow.com/questions/58725659/get-the-postgresql-server-version-from-connection
            if (msg.parameterName === 'server_version') {
                this.version = msg.parameterValue;
            }
        });
        this.connection.stream.on('something', () => {

        });

        // any event handlers are allowed:
        this.on('whatever', (whatever1: any, whatever2: any) => {

        });

        this.query('test', [1, 2]).then();
    }
}

const db = pgp({
    Client: MyClient
});

const pg = pgp.pg;

pg.types.setTypeParser(TypeId.INT8, parseInt);
pg.types.setTypeParser(pg.types.builtins.INT8, parseInt);

db.connect()
    .then(t => {
        const v = t.client.version;
        t.client.on('notification', (message: any) => {
            const s = message.anything;
        });
        t.client.removeAllListeners();
    });

const database = pg.defaults.database;

let col: IColumn;
let res: IResult;
