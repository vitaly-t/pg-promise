const header = require('./db/header');
const tools = require('./db/tools');

const promise = header.defPromise;
const options = {
    promiseLib: promise,
    noWarnings: true
};
const dbHeader = header(options);
const pgp = dbHeader.pgp;
const db = dbHeader.db;

const {TransactionMode, isolationLevel} = pgp.txMode;

describe('TransactionMode', () => {

    describe('Negative', () => {
        it('must throw throw on invalid options', () => {
            expect(() => {
                new TransactionMode(0);
            }).toThrow('Invalid "options" parameter: 0');
            expect(() => {
                new TransactionMode({value: 123});
            }).toThrow('Option "value" is not recognized.');
        });
    });

    describe('without parameters, capitalized', () => {
        const queries = [];
        let result, ctx;
        const context = {};
        beforeEach(done => {

            options.capSQL = true;
            options.query = function (e) {
                queries.push(e.query);
            };

            async function txNoParams() {
                ctx = this.ctx.context;
                return 'success';
            }

            txNoParams.txMode = new TransactionMode();

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

    describe('with isolation level', () => {
        const queries = [];
        let result;
        beforeEach(done => {

            options.query = e => {
                queries.push(e.query);
            };

            const mode = new TransactionMode({tiLevel: isolationLevel.serializable});

            db.tx({mode}, async () => 'success')
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

            const mode = new TransactionMode({readOnly: true});

            db.tx({mode}, async () => 'success')
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

            const mode = new TransactionMode({readOnly: false});

            db.tx({mode}, async () => 'success')
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

            const mode = new TransactionMode({
                tiLevel: isolationLevel.serializable,
                readOnly: true
            });

            db.tx({mode}, async () => 'success')
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

            const mode = new TransactionMode({
                tiLevel: isolationLevel.serializable,
                readOnly: true,
                deferrable: true
            });

            db.tx({mode}, async () => 'success')
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

            const mode = new TransactionMode({
                tiLevel: isolationLevel.serializable,
                readOnly: true,
                deferrable: false
            });

            db.tx({mode}, async () => 'success')
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

            const mode = new TransactionMode({
                tiLevel: isolationLevel.repeatableRead,
                readOnly: true,
                deferrable: false
            });

            db.tx({mode}, async () => 'success')
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
        const mode = new TransactionMode();
        it('must return the same as method begin()', () => {
            expect(mode.begin(true)).toBe(tools.inspect(mode));
        });
    });
});
