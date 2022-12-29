import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain<{}, MyClient> = pgPromise({
    connect(e) {
        const v = e.client.version;
    },
    receive(e: any) {
        const dc = e.ctx.dc;
        const d = e.data[0].prop;
        const r = e.result.fields[0].name;
        const query = e.query;
    },
    query(e: any) {
        const dc = e.dc;
        const query = e.query;
    },
    error(err: any, e: any) {
        const dc = e.dc;
        const query = e.query;
    },
    extend(obj: any, dc: any) {
        obj['method'] = (val: any) => {
            return obj.one(null, val);
        }
    }
});

class MyClient extends pgp.pg.Client {
    version?: string;
}

const db = pgp({
    Client: MyClient
});

db.task(t => {
    const dc = t.ctx.dc;
    const useCount = t.ctx.useCount;
    return t.batch([
        t.one('query'),
        t.none('query')
    ]);
})
    .then(data => {
    })
    .catch(error => {

    });
