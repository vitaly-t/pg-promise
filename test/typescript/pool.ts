import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise({});

const db = pgp('connection');

(async function () {
    const res: undefined = await db.$pool.end();

    const res2: void = await db.$pool.end((err: Error) => {
        console.log(err.stack);
    });

    const {totalCount, idleCount, waitingCount} = db.$pool;

    db.$pool.on('error', err => {
        // handle errors
    })

    const database = db.$pool.options.database;
})();
