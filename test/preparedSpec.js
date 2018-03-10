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

const PreparedStatementError = pgp.errors.PreparedStatementError;

describe('PreparedStatement', () => {

    describe('non-class initialization', () => {
        it('must return a new object', () => {
            // eslint-disable-next-line
            const ps = pgp.PreparedStatement('test-name', 'test-query');
            expect(ps instanceof pgp.PreparedStatement).toBe(true);
        });
    });

    describe('parameter-object initialization', () => {
        it('must initialize correctly', () => {
            const ps = new pgp.PreparedStatement({name: 'test-name', text: 'test-query', values: [123]});
            expect(ps.parse()).toEqual({name: 'test-name', text: 'test-query', values: [123]});
        });
    });

    describe('property values', () => {
        const values = [1, 2, 3];
        it('must get correctly', () => {
            const ps = new pgp.PreparedStatement({
                name: 'original-name',
                text: 'original-sql',
                values,
                binary: true,
                rowMode: 'array',
                rows: 1
            });
            expect(ps.name).toBe('original-name');
            expect(ps.text).toBe('original-sql');
            expect(ps.values).toBe(values);
            expect(ps.binary).toBe(true);
            expect(ps.rowMode).toBe('array');
            expect(ps.rows).toBe(1);
            expect(tools.inspect(ps)).toBe(ps.toString());
        });
        it('must keep original object when set to the same value', () => {
            const ps = new pgp.PreparedStatement({
                name: 'original-name',
                text: 'original-sql',
                values,
                binary: true,
                rowMode: 'array',
                rows: 1
            });
            const obj1 = ps.parse();
            ps.name = 'original-name';
            ps.text = 'original-sql';
            ps.values = values;
            ps.binary = true;
            ps.rowMode = 'array';
            ps.rows = 1;
            const obj2 = ps.parse();
            expect(obj1 === obj2).toBe(true);
            expect(tools.inspect(ps)).toBe(ps.toString());
        });
        it('must create a new object when changed', () => {
            const ps = new pgp.PreparedStatement({
                name: 'original-name',
                text: 'original-sql',
                values,
                binary: true,
                rowMode: 'array',
                rows: 1
            });
            const obj1 = ps.parse();
            ps.name = 'new value';
            const obj2 = ps.parse();
            ps.text = 'new text';
            const obj3 = ps.parse();
            ps.values = [1, 2, 3];
            const obj4 = ps.parse();
            ps.binary = false;
            const obj5 = ps.parse();
            ps.rowMode = 'new';
            const obj6 = ps.parse();
            ps.rows = 3;
            const obj7 = ps.parse();
            expect(obj1 !== obj2 !== obj3 !== obj4 != obj5 != obj6 != obj7).toBe(true);
            expect(tools.inspect(ps)).toBe(ps.toString());
        });
    });

    describe('parameters', () => {
        const ps = new pgp.PreparedStatement('test-name', 'test-query', [123]);
        it('must expose the values correctly', () => {
            expect(ps.name).toBe('test-name');
            expect(ps.text).toBe('test-query');
            expect(ps.values).toEqual([123]);
            // setting to the same values, for coverage:
            ps.name = ps.name;
            ps.text = ps.text;
        });
        it('must set the values correctly', () => {
            ps.name = 'new-name';
            ps.text = 'new-query';
            ps.values = [456];
            expect(ps.name).toBe('new-name');
            expect(ps.text).toBe('new-query');
            expect(ps.values).toEqual([456]);
        });
    });

    describe('valid, without parameters', () => {
        let result;
        const ps = new pgp.PreparedStatement('test-1', 'select 1 as value');
        beforeEach(done => {
            db.one(ps)
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
        const ps = new pgp.PreparedStatement('test-2', 'select count(*) from users where login = $1', ['non-existing']);
        beforeEach(done => {
            db.one(ps)
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

    describe('object inspection', () => {
        const ps1 = new pgp.PreparedStatement('test-name', 'test-query $1');
        const ps2 = new pgp.PreparedStatement('test-name', 'test-query $1', [123]);
        it('must stringify all values', () => {
            expect(tools.inspect(ps1)).toBe(ps1.toString());
            expect(tools.inspect(ps2)).toBe(ps2.toString());
        });
    });

    describe('with QueryFile', () => {

        describe('successful', () => {
            const f = path.join(__dirname, './sql/simple.sql');
            const qf = new pgp.QueryFile(f, {compress: true, noWarnings: true});
            const ps = new pgp.PreparedStatement('test-name', qf);
            let result = ps.parse();
            expect(result && typeof result === 'object').toBeTruthy();
            expect(result.name).toBe('test-name');
            expect(result.text).toBe('select 1;');
            expect(ps.toString()).toBe(tools.inspect(ps));
        });

        describe('with error', () => {
            const qf = new pgp.QueryFile('./invalid.sql', {noWarnings: true});
            const ps = new pgp.PreparedStatement('test-name', qf);
            const result = ps.parse();
            expect(result instanceof pgp.errors.PreparedStatementError).toBe(true);
            expect(result.error instanceof pgp.errors.QueryFileError).toBe(true);
            expect(ps.toString()).toBe(tools.inspect(ps));
        });
    });

});

describe('Direct Prepared Statements', () => {

    describe('valid, without parameters', () => {
        let result;
        beforeEach(done => {
            db.many({
                name: 'get all users',
                text: 'select * from users',
                values: []
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
                name: 'find one user',
                text: 'select * from users where id=$1',
                values: [1]
            })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return one user', () => {
            expect(result && typeof(result) === 'object').toBeTruthy();
        });
    });

    describe('valid, with parameters override', () => {
        let result;
        beforeEach(done => {
            db.one({
                name: 'find one user',
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

    describe('with invalid query', () => {
        let result;
        beforeEach(done => {
            db.many({
                name: 'break it',
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

    describe('with an empty \'name\'', () => {
        let result;
        const ps = new pgp.PreparedStatement({name: '', text: 'non-empty'});
        beforeEach(done => {
            db.query(ps)
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must return an error', () => {
            expect(result instanceof PreparedStatementError).toBe(true);
            expect(ps.toString(1) != tools.inspect(ps)).toBe(true);
            expect(result.toString()).toBe(tools.inspect(result));
        });
    });

    describe('with an empty \'text\'', () => {
        let result;
        beforeEach(done => {
            db.query({
                name: 'non-empty',
                text: null
            })
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must return an error', () => {
            expect(result instanceof PreparedStatementError).toBe(true);
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
