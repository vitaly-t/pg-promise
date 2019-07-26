const header = require('./db/header');
const promise = header.defPromise;

const options = {
    noWarnings: true,
    promiseLib: promise
};

const dbHeader = header(options);
const db = dbHeader.db;

describe('ES6 Generators', () => {

    // v9.0 dropped all generators support, and now it throws an error,
    // if someone still tries to use them.

    const errMsg = 'ES6 generator functions are no longer supported!';

    describe('for tasks', () => {
        let error;
        beforeEach(done => {
            db.task(function* () {
            })
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must reject', () => {
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe(errMsg);
        });
    });

    describe('for transactions', () => {
        let error;
        beforeEach(done => {
            db.tx(function* () {
            })
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must reject', () => {
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe(errMsg);
        });
    });

});
