'use strict';

const capture = require('./db/capture');
const PromiseAdapter = require('../lib/index').PromiseAdapter;
const supportsPromise = typeof(Promise) !== 'undefined';

const header = require('./db/header');
const promise = header.defPromise;
const options = {
    promiseLib: promise,
    noWarnings: true
};
const dbHeader = header(options);
const pgp = dbHeader.pgp;
const db = dbHeader.db;

const BatchError = pgp.spex.errors.BatchError;

function dummy() {
}

describe('Library entry function', () => {

    describe('without any promise override', () => {
        it('must return a valid library object', () => {
            if (supportsPromise) {
                const lib = header({noWarnings: true});
                expect(typeof(lib.pgp)).toBe('function');
            } else {
                expect(() => {
                    header();
                }).toThrow('Promise library must be specified.');
            }
        });
    });

    describe('with PromiseAdapter override', () => {
        const P = header.defPromise;

        function create(func) {
            return new P(func);
        }

        function resolve(data) {
            return P.resolve(data);
        }

        function reject(reason) {
            return P.reject(reason);
        }

        function all(data) {
            return P.all(data);
        }

        const adapter = new PromiseAdapter({create, resolve, reject, all});
        it('must accept custom promise', () => {
            const lib = header({
                promiseLib: adapter,
                noWarnings: true
            });
            expect(lib.pgp instanceof Function).toBe(true);
        });

        describe('using PromiseAdapter', () => {
            let result;
            beforeEach(done => {
                const lib = header({
                    promiseLib: adapter,
                    noWarnings: true
                });
                lib.db.one('select 1 as value')
                    .then(data => {
                        result = data;
                    })
                    .finally(done);
            });
            it('must return successfully', () => {
                expect(result.value).toBe(1);
            });
        });
    });

    if (supportsPromise) {
        describe('without any options', () => {
            let result;
            beforeEach(done => {
                const db = header({noWarnings: true, promiseLib: promise}).db;
                db.query('select * from users')
                    .then(data => {
                        result = data;
                    })
                    .finally(done);
            });
            it('must be able to execute queries', () => {
                expect(result instanceof Array).toBe(true);
            });
        });
    }

    describe('with a valid promise library-object override', () => {
        it('must return a valid library object', () => {
            const lib = header(
                {
                    promiseLib: {
                        resolve: dummy,
                        reject: dummy,
                        all: dummy
                    },
                    noWarnings: true
                });
            expect(typeof(lib.pgp)).toBe('function');
        });
    });

    describe('with a valid promise library-function override', () => {
        it('must return a valid library object', () => {
            function fakePromiseLib() {
            }

            fakePromiseLib.resolve = dummy;
            fakePromiseLib.reject = dummy;
            fakePromiseLib.all = dummy;
            const lib = header({
                promiseLib: fakePromiseLib,
                noWarnings: true
            });
            expect(typeof(lib.pgp)).toBe('function');
        });
    });

    describe('with invalid promise override', () => {
        const error = 'Invalid promise library specified.';
        it('must throw the correct error', () => {
            expect(() => {
                header({
                    promiseLib: 'test'
                });
            })
                .toThrow(error);
            expect(() => {
                header({
                    promiseLib: dummy
                });
            })
                .toThrow(error);
        });
    });

    describe('with invalid options parameter', () => {
        const errBody = 'Invalid initialization options: ';
        it('must throw an error', () => {
            expect(() => {
                header(123);
            }).toThrow(errBody + '123');
            expect(() => {
                header('hello');
            }).toThrow(errBody + '"hello"');
        });
    });

    describe('with invalid options', () => {
        let txt;
        beforeEach(() => {
            const c = capture();
            header({test: 123});
            txt = c();
        });

        it('must throw an error', () => {
            expect(txt).toContain('WARNING: Invalid property \'test\' in initialization options.');
        });
    });

    describe('multi-init', () => {

        const PromiseOne = {
            create: cb => new promise.Promise(cb),
            resolve: data => promise.resolve(data),
            reject: () => promise.reject('reject-one'),
            all: data => promise.all(data)
        };

        const PromiseTwo = {
            create: cb => new promise.Promise(cb),
            resolve: data => promise.resolve(data),
            reject: () => promise.reject('reject-two'),
            all: data => promise.all(data)
        };

        const one = new PromiseAdapter(PromiseOne);
        const two = new PromiseAdapter(PromiseTwo);
        let result;

        beforeEach(done => {
            const pg1 = header({promiseLib: one, noWarnings: true}), db1 = pg1.db;
            const pg2 = header({promiseLib: two, noWarnings: true}), db2 = pg2.db;
            db.task(t => {
                return t.batch([
                    db1.query('select $1', []), db2.query('select $1', [])
                ]);
            })
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });

        it('must be supported', () => {
            expect(result instanceof BatchError).toBe(true);
            expect(result.data).toEqual([
                {
                    success: false,
                    result: 'reject-one'
                },
                {
                    success: false,
                    result: 'reject-two'
                }
            ]);
        });
    });

    describe('Taking no initialization options', () => {
        it('must be supported', () => {
            expect(typeof dbHeader.pgpLib()).toBe('function');
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
