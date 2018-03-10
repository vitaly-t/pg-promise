'use strict';

const header = require('./db/header');
const promise = header.defPromise;

const options = {
    noWarnings: true,
    promiseLib: promise
};

const dbHeader = header(options);
const db = dbHeader.db;
const pgp = dbHeader.pgp;

describe('Generators - Positive', () => {

    let result, tag, query;

    const mode = new pgp.txMode.TransactionMode({
        tiLevel: pgp.txMode.isolationLevel.serializable
    });

    beforeEach(done => {
        options.transact = e => {
            tag = e.ctx.tag;
        };
        options.query = e => {
            if (!query) {
                query = e.query;
            }
        };
        db.tx({tag: 'Custom', mode}, function* (t) {
            return yield t.one('select 123 as value');
        })
            .then(data => {
                result = data;
                done();
            });
    });

    it('must resolve with the right value', () => {
        expect(result && typeof result === 'object').toBeTruthy();
        expect(result.value).toBe(123);
        expect(tag).toBe('Custom');
        expect(query).toBe('begin isolation level serializable');
    });

    afterEach(() => {
        delete options.task;
        delete options.query;
    });

});

describe('Generators - Negative', () => {

    describe('normal reject', () => {
        let result;
        const err = new Error('ops!');

        const myTask = function* () {
            return yield promise.reject(err);
        };

        beforeEach(done => {
            db.task(myTask)
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });

        it('must reject with the right value', () => {
            expect(result).toBe(err);
        });
    });

    describe('error thrown', () => {

        let result, tag;

        // eslint-disable-next-line
        function* myTask() {
            throw 123;
        }

        beforeEach(done => {
            options.task = e => {
                tag = e.ctx.tag;
            };
            db.task('myTag', myTask)
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });

        it('must reject with the right value', () => {
            expect(result).toBe(123);
            expect(tag).toBe('myTag');
        });

        afterEach(() => {
            delete options.task;
        });

    });
});
