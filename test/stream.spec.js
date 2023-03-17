const QueryStream = require('pg-query-stream');
const JSONStream = require('JSONStream');
const header = require('./db/header');
const promise = header.defPromise;

const options = {
    promiseLib: promise,
    noWarnings: true
};

const dbHeader = header(options);
// const pgp = dbHeader.pgp;
const db = dbHeader.db;

if (options.pgNative) {
    return;
}

const $text = require('../lib/text');

const dummy = () => {
    // dummy/empty function;
};

describe('Method stream', () => {
    describe('with invalid stream object', () => {
        let result;
        beforeEach(done => {
            promise.any([
                db.stream(),
                db.stream(null),
                db.stream('test'),
                db.stream({})
            ])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result.length).toBe(4);
            for (let i = 0; i < result.length; i++) {
                expect(result[i] instanceof TypeError).toBe(true);
                expect(result[i].message).toBe($text.invalidStream);
            }
        });
    });
    describe('with invalid stream state', () => {
        let result;
        beforeEach(done => {
            const stream1 = new QueryStream('select 1');
            stream1._reading = true;
            const stream2 = new QueryStream('select 2');
            stream2._closed = true;
            promise.any([
                db.stream(stream1),
                db.stream(stream2)
            ])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result.length).toBe(2);
            for (let i = 0; i < result.length; i++) {
                expect(result[i] instanceof Error).toBe(true);
                expect(result[i].message).toBe($text.invalidStreamState);
            }
        });
        describe('with invalid initialization callback', () => {
            let res;
            beforeEach(done => {
                const stream = new QueryStream('select 1');
                promise.any([
                    db.stream(stream),
                    db.stream(stream, null),
                    db.stream(stream, 123),
                    db.stream(stream, {})
                ])
                    .catch(reason => {
                        res = reason;
                    })
                    .finally(done);
            });
            it('must throw an error', () => {
                expect(res.length).toBe(4);
                for (let i = 0; i < res.length; i++) {
                    expect(res[i] instanceof TypeError).toBe(true);
                    expect(res[i].message).toBe($text.invalidStreamCB);
                }
            });
        });
        describe('with initialization callback throwing error', () => {
            let res;
            beforeEach(done => {
                db.stream(new QueryStream('select 1'), () => {
                    throw new Error('initialization error');
                })
                    .catch(reason => {
                        res = reason;
                    })
                    .finally(done);
            });
            it('must throw an error', () => {
                expect(res instanceof Error);
                expect(res.message).toBe('initialization error');
            });
        });

        describe('throwing error during query notification', () => {
            let res;
            beforeEach(done => {
                options.query = () => {
                    throw 'query notification error';
                };
                db.stream(new QueryStream(), dummy)
                    .catch(error => {
                        res = error;
                    })
                    .finally(done);
            });
            it('must reject with the same error', () => {
                expect(res instanceof Error).toBe(false);
                expect(res).toBe('query notification error');
            });
            afterEach(() => {
                options.query = null;
            });
        });

        describe('with a valid request', () => {
            let res, count = 0, context, initCtx;
            const qs = new QueryStream('select * from users where id = $1', [1]);
            beforeEach(async done => {
                options.query = e => {
                    context = e;
                    count++;
                };
                res = await db.stream.call(qs, qs, function (stream) {
                    initCtx = this;
                    stream.pipe(JSONStream.stringify());
                }).finally(done);
            });
            it('must return the correct data and provide notification', () => {
                expect(typeof res).toBe('object');
                expect(res.processed).toBe(1);
                expect(res.duration >= 0).toBe(true);
                expect(count).toBe(1);
                expect(context.query).toBe('select * from users where id = $1');
                expect(JSON.stringify(context.params)).toBe('["1"]');
                expect(initCtx).toBe(qs);
            });
            afterEach(() => {
                options.query = null;
            });
        });

        describe('with invalid request', () => {
            let res, err, context, count = 0;
            beforeEach(async done => {
                options.error = (error, e) => {
                    err = error;
                    context = e;
                    count++;
                };
                try {
                    const qs = new QueryStream('select * from unknown where id = $1', [1]);
                    await db.stream(qs, stream => {
                        stream.pipe(JSONStream.stringify());
                    });
                } catch (e) {
                    res = e;
                } finally {
                    done();
                }
            });
            it('must return the correct data and provide notification', () => {
                expect(res instanceof Error).toBe(true);
                expect(res.message).toBe('relation "unknown" does not exist');
                expect(count).toBe(1);
                expect(context.query).toBe('select * from unknown where id = $1');
                expect(JSON.stringify(context.params)).toBe('["1"]');
                expect(err instanceof Error).toBe(true);
                expect(err.message).toBe('relation "unknown" does not exist');
            });
            afterEach(() => {
                options.error = null;
            });
        });

    });
});
