'use strict';

const path = require('path');
const header = require('./db/header');
const tools = require('./tools');

const promise = header.defPromise;
const options = {
    promiseLib: promise,
    noWarnings: true
};
const dbHeader = header(options);
const pgp = dbHeader.pgp;
const db = dbHeader.db;

const ParameterizedQueryError = pgp.errors.ParameterizedQueryError;

describe('ParameterizedQuery', () => {

    describe('non-class initialization', () => {
        it('must return a new object', () => {
            /* eslint new-cap: 0 */
            const pq = pgp.ParameterizedQuery('test-query');
            expect(pq instanceof pgp.ParameterizedQuery).toBe(true);
        });
    });

    describe('parameter-object initialization', () => {
        it('must initialize correctly', () => {
            const pq = new pgp.ParameterizedQuery({text: 'test-query', values: [123]});
            expect(pq.parse()).toEqual({text: 'test-query', values: [123]});
        });
    });

    describe('property values', () => {
        const values = [1, 2, 3];
        it('must get correctly', () => {
            const pq = new pgp.ParameterizedQuery({
                text: 'original-sql',
                values,
                binary: true,
                rowMode: 'array'
            });
            expect(pq.text).toBe('original-sql');
            expect(pq.values).toBe(values);
            expect(pq.binary).toBe(true);
            expect(pq.rowMode).toBe('array');
            expect(tools.inspect(pq)).toBe(pq.toString());
        });
        it('must keep original object when set to the same value', () => {
            const pq = new pgp.ParameterizedQuery({
                text: 'original-sql',
                values,
                binary: true,
                rowMode: 'array'
            });
            const obj1 = pq.parse();
            pq.text = 'original-sql';
            pq.values = values;
            pq.binary = true;
            pq.rowMode = 'array';
            const obj2 = pq.parse();
            expect(obj1 === obj2).toBe(true);
            expect(tools.inspect(pq)).toBe(pq.toString());
        });
        it('must create a new object when changed', () => {
            const pq = new pgp.ParameterizedQuery({
                text: 'original-sql',
                values,
                binary: true,
                rowMode: 'array'
            });
            const obj1 = pq.parse();
            pq.text = 'new text';
            const obj2 = pq.parse();
            pq.values = [1, 2, 3];
            const obj3 = pq.parse();
            pq.binary = false;
            const obj4 = pq.parse();
            pq.rowMode = 'new';
            const obj5 = pq.parse();
            expect(obj1 !== obj2 !== obj3 !== obj4 != obj5).toBe(true);
            expect(tools.inspect(pq)).toBe(pq.toString());
        });
    });

    describe('parameters', () => {
        const pq = new pgp.ParameterizedQuery({text: 'test-query', values: [123], binary: true, rowMode: 'array'});
        it('must expose the values correctly', () => {
            expect(pq.text).toBe('test-query');
            expect(pq.values).toEqual([123]);
            expect(pq.binary).toBe(true);
            expect(pq.rowMode).toBe('array');
        });
    });

    describe('valid, without parameters', () => {
        let result;
        const pq = new pgp.ParameterizedQuery('select 1 as value');
        beforeEach(done => {
            db.one(pq)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return the right value', () => {
            expect(result && result.value === 1).toBeTruthy();
        });
    });

    describe('valid, with parameters', () => {
        let result;
        const pq = new pgp.ParameterizedQuery('select count(*) from users where login = $1', ['non-existing']);
        beforeEach(done => {
            db.one(pq)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return the right value', () => {
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.count).toBe('0');
        });
    });

    describe('valid, with parameters override', () => {
        let result;
        beforeEach(done => {
            db.one({
                text: 'select * from users where id=$1'
            }, 1)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return one user', () => {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe('object inspection', () => {
        const pq1 = new pgp.ParameterizedQuery('test-query $1');
        const pq2 = new pgp.ParameterizedQuery('test-query $1', []);
        it('must stringify all values', () => {
            expect(tools.inspect(pq1)).toBe(pq1.toString());
            expect(tools.inspect(pq2)).toBe(pq2.toString());
        });
    });

    describe('with QueryFile', () => {

        describe('successful', () => {
            const f = path.join(__dirname, './sql/simple.sql');
            const qf = new pgp.QueryFile(f, {compress: true, noWarnings: true});
            const pq = new pgp.ParameterizedQuery(qf);
            let result = pq.parse();
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.text).toBe('select 1;');
            expect(pq.toString()).toBe(tools.inspect(pq));
        });

        describe('with an error', () => {
            const qf = new pgp.QueryFile('./invalid.sql');
            const pq = new pgp.ParameterizedQuery(qf);
            const result = pq.parse();
            expect(result instanceof ParameterizedQueryError).toBe(true);
            expect(result.error instanceof pgp.errors.QueryFileError).toBe(true);
            expect(pq.toString()).toBe(tools.inspect(pq));
            expect(pq.toString(1) !== tools.inspect(pq)).toBe(true);
        });

    });

});

describe('Direct Parameterized Query', () => {

    describe('valid, without parameters', () => {
        let result;
        beforeEach(done => {
            db.many({
                text: 'select * from users'
            })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return all users', () => {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe('valid, with parameters', () => {
        let result;
        beforeEach(done => {
            db.one({
                text: 'select * from users where id=$1',
                values: [1]
            })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return all users', () => {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe('with invalid query', () => {
        let result;
        beforeEach(done => {
            db.many({
                text: 'select * from somewhere'
            })
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must return an error', () => {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toContain('relation "somewhere" does not exist');
        });
    });

    describe('with an empty \'text\'', () => {
        let result;
        beforeEach(done => {
            db.query({
                text: null
            })
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must return an error', () => {
            expect(result instanceof pgp.errors.ParameterizedQueryError).toBe(true);
            expect(result.toString()).toBe(tools.inspect(result));
        });
    });

});

if (jasmine.Runner) {
    const _finishCallback = jasmine.Runner.prototype.finishCallback;
    jasmine.Runner.prototype.finishCallback = function () {
        // Run the old finishCallback:
        _finishCallback.bind(this)();

        pgp.end(); // closing pg database application pool;
    };
}
