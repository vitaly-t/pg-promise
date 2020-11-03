import * as pgPromise from '../../typescript/pg-promise';

const pgp: pgPromise.IMain = pgPromise({});

const db = pgp('connection');

(async function () {
    await db.$pool.end();

    await db.$pool.end(err => {
        console.log(err.stack);
    });

    const {totalCount, idleCount, waitingCount} = db.$pool;

    db.$pool.on('error', err => {
        // handle errors
    })
})();
