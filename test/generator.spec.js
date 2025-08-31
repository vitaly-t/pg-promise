const header = require('./db/header');

const options = {
    noWarnings: true
};

const dbHeader = header(options);
const db = dbHeader.db;

describe('ES6 Generators', () => {

    const errMsg = 'ES6 generator functions are not supported!';

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
