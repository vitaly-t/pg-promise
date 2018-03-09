'use strict';

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

describe('Transaction Mode', () => {

    describe('without parameters, capitalized', () => {
        const queries = [];
        let result, ctx;
        const context = {};
        beforeEach(done => {

            options.capSQL = true;
            options.query = function (e) {
                queries.push(e.query);
            };

            function txNoParams() {
                ctx = this.ctx.context;
                return promise.resolve('success');
            }

            txNoParams.txMode = new pgp.txMode.TransactionMode();

            db.tx.call(context, txNoParams)
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute default transaction opening', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('BEGIN');
            expect(ctx).toBe(context);
        });
        afterEach(() => {
            delete options.query;
            delete options.capSQL;
        });
    });

    describe('initialized without new', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            function txNoParams() {
                return promise.resolve('success');
            }

            // eslint-disable-next-line
            txNoParams.txMode = pgp.txMode.TransactionMode();

            db.tx(txNoParams)
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute default transaction opening', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('with isolation level', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const mode = new pgp.txMode.TransactionMode(pgp.txMode.isolationLevel.serializable);

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('with access mode = read only', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const mode = new pgp.txMode.TransactionMode({readOnly: true});

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin read only');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('with access mode = read/write', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const mode = new pgp.txMode.TransactionMode({readOnly: false});

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin read write');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('with serializable and read-only', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const level = pgp.txMode.isolationLevel;

            const mode = new pgp.txMode.TransactionMode({
                tiLevel: level.serializable,
                readOnly: true
            });

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable read only');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('with deferrable', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const level = pgp.txMode.isolationLevel;

            const mode = new pgp.txMode.TransactionMode({
                tiLevel: level.serializable,
                readOnly: true,
                deferrable: true
            });

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable read only deferrable');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('with not deferrable', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const level = pgp.txMode.isolationLevel;

            const mode = new pgp.txMode.TransactionMode({
                tiLevel: level.serializable,
                readOnly: true,
                deferrable: false
            });

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level serializable read only not deferrable');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('when deferrable is irrelevant', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const level = pgp.txMode.isolationLevel;
            const mode = new pgp.txMode.TransactionMode(level.repeatableRead, true, false);

            db.tx({mode}, () => {
                return promise.resolve('success');
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must execute correct command', () => {
            expect(result).toBe('success');
            expect(queries.length).toBe(2);
            expect(queries[0]).toBe('begin isolation level repeatable read read only');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('inspection', () => {
        const mode = new pgp.txMode.TransactionMode();
        it('must return the same as method begin()', () => {
            expect(mode.begin(true)).toBe(tools.inspect(mode));
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
