'use strict';

const path = require('path');
const fs = require('fs');
const header = require('./db/header');
const utils = require('../lib/utils');
const tools = require('./tools');

const promise = header.defPromise;
const options = {
    promiseLib: promise,
    noWarnings: true
};
const dbHeader = header(options);
const pgp = dbHeader.pgp;
const db = dbHeader.db;

const QueryFileError = pgp.errors.QueryFileError;
const QueryFile = pgp.QueryFile;

const getPath = file => {
    return path.join(__dirname, file);
};

const sqlSimple = getPath('./sql/simple.sql');
const sqlUsers = getPath('./sql/allUsers.sql');
const sqlUnknown = getPath('./sql/unknown.sql');
const sqlInvalid = getPath('./sql/invalid.sql');
const sqlParams = getPath('./sql/params.sql');
const sqlTemp = getPath('./sql/temp.sql');

describe('QueryFile / Positive:', () => {

    describe('function-style call', () => {
        it('must return an object', () => {
            // eslint-disable-next-line
            expect(QueryFile(sqlSimple, {noWarnings: true}) instanceof QueryFile).toBe(true);
        });
    });

    describe('without options', () => {
        const qf = new QueryFile(sqlSimple, {noWarnings: true});
        it('must not minify', () => {
            expect(qf[QueryFile.$query]).toBe('select 1; --comment');
        });
    });

    describe('with minify=true && debug=true', () => {
        const qf = new QueryFile(sqlUsers, {debug: true, minify: true, noWarnings: true});
        it('must return minified query', () => {
            expect(qf[QueryFile.$query]).toBe('select * from users');
        });
    });

    describe('default with params', () => {
        const params = {
            schema: 'public',
            table: 'users'
        };
        const qf = new QueryFile(sqlParams, {minify: true, params, noWarnings: true});
        it('must return pre-formatted query', () => {
            expect(qf[QueryFile.$query]).toBe('SELECT ${column~} FROM "public"."users"');
        });
    });

    describe('compression with params', () => {
        const params = {
            schema: 'public',
            table: 'users',
            column: 'col'
        };
        const qf1 = new QueryFile(sqlParams, {minify: true, compress: true, params, noWarnings: true});
        it('must return uncompressed replacements by default', () => {
            expect(qf1[QueryFile.$query]).toBe('SELECT "col" FROM "public"."users"');
        });
        const qf2 = new QueryFile(sqlParams, {minify: 'after', compress: true, params, noWarnings: true});
        it('must return compressed replacements for \'after\'', () => {
            expect(qf2[QueryFile.$query]).toBe('SELECT"col"FROM"public"."users"');
        });
    });

    describe('non-minified query', () => {
        let result;
        beforeEach(done => {
            db.query(new QueryFile(sqlUsers, {noWarnings: true}))
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must resolve with data', () => {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe('minified query', () => {
        let result;
        beforeEach(done => {
            db.query(new QueryFile(sqlUsers, {minify: true, noWarnings: true}))
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must resolve with data', () => {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe('compressed query', () => {
        let result, sql;
        beforeEach(done => {
            sql = new QueryFile(sqlUsers, {compress: true, noWarnings: true});
            db.query(sql)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must resolve with data', () => {
            expect(sql[QueryFile.$query]).toBe('select*from users');
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe('property options', () => {
        const options1 = {
                debug: utils.isDev(),
                minify: false,
                compress: false,
                noWarnings: true
            },
            options2 = {
                debug: false,
                compress: true,
                noWarnings: true
            },
            options3 = {
                debug: false,
                minify: true,
                compress: true,
                noWarnings: true
            };
        Object.freeze(options1);
        Object.freeze(options3);
        it('must be consistent with the settings', () => {
            expect(new QueryFile(sqlSimple, {noWarnings: true}).options).toEqual(options1);
            expect(new QueryFile(sqlSimple, options2).options).toEqual(options3);
        });
    });

    describe('inspect', () => {
        const qf = new QueryFile(sqlSimple, {noWarnings: true});
        it('must return the query', () => {
            expect(tools.inspect(qf)).toBe(qf.toString());
        });
    });

    describe('custom-type formatting', () => {
        const qf = new QueryFile(sqlSimple, {noWarnings: true});
        const toPostgres = pgp.as.ctf.toPostgres;
        it('must return the full name', () => {
            expect(qf[toPostgres](qf)).toBe(qf[QueryFile.$query]);
            expect(qf[toPostgres].call(null, qf)).toBe(qf[QueryFile.$query]);
            expect(qf[toPostgres]()).toBe(qf[QueryFile.$query]);
        });
    });

    describe('modified file', () => {
        const q1 = 'select 1';
        const q2 = 'select 2';
        it('must be read again', () => {
            fs.writeFileSync(sqlTemp, q1);
            const qf = new QueryFile(sqlTemp, {debug: true});
            expect(qf[QueryFile.$query]).toBe(q1);
            expect(qf.error).toBeUndefined();

            fs.writeFileSync(sqlTemp, q2);
            const t = new Date();
            t.setTime(t.getTime() + 60 * 60 * 1000);
            fs.utimesSync(sqlTemp, t, t);
            qf.prepare();
            expect(qf[QueryFile.$query]).toBe(q2);
            expect(qf.error).toBeUndefined();
        });
    });

    describe('repeated read', () => {
        // this is just for code coverage;
        it('must not read again', () => {
            const qf = new QueryFile(sqlSimple, {debug: false, minify: true, noWarnings: true});
            qf.prepare();
            qf.prepare();
            expect(qf[QueryFile.$query]).toBe('select 1;');
        });
    });
});

describe('QueryFile / Negative:', () => {

    describe('non-minified query', () => {
        let error;
        beforeEach(done => {
            db.query(new QueryFile(sqlUnknown))
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must reject with an error', () => {
            expect(error instanceof Error).toBe(true);
        });
    });

    describe('inspect', () => {
        const qf = new QueryFile(sqlInvalid, {minify: true, noWarnings: true});
        it('must return the error', () => {
            expect(tools.inspect(qf) != qf.toString(1)).toBe(true);
            expect(qf.error instanceof QueryFileError).toBe(true);
            expect(tools.inspect(qf.error)).toBe(qf.error.toString());
        });
    });

    describe('accessing a temporary file', () => {
        let error;
        const query = 'select 123 as value';
        it('must result in error once deleted', () => {
            fs.writeFileSync(sqlTemp, query);
            const qf = new QueryFile(sqlTemp, {debug: true, noWarnings: true});
            expect(qf[QueryFile.$query]).toBe(query);
            expect(qf.error).toBeUndefined();
            fs.unlinkSync(sqlTemp);
            qf.prepare();
            expect(qf.$query).toBeUndefined();
            expect(qf.error instanceof Error).toBe(true);
        });

        it('must throw when preparing', () => {
            fs.writeFileSync(sqlTemp, query);
            const qf = new QueryFile(sqlTemp, {debug: true, noWarnings: true});
            expect(qf[QueryFile.$query]).toBe(query);
            expect(qf.error).toBeUndefined();
            fs.unlinkSync(sqlTemp);
            try {
                qf.prepare(true);
            } catch (e) {
                error = e;
            }
            expect(qf.$query).toBeUndefined();
            expect(error instanceof Error).toBe(true);
        });

    });

    describe('invalid sql', () => {
        it('must throw an error', () => {
            const qf = new QueryFile(sqlInvalid, {minify: true, noWarnings: true});
            expect(qf.error instanceof QueryFileError).toBe(true);
            expect(qf.error.file).toBe(sqlInvalid);
        });
    });

});
