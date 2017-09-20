'use strict';

const QueryStream = require('pg-query-stream');
const JSONStream = require('JSONStream');
const header = require('./db/header');
const promise = header.defPromise;

const options = {
    promiseLib: promise,
    noWarnings: true
};

const dbHeader = header(options);
const pgp = dbHeader.pgp;
const db = dbHeader.db;

if (options.pgNative) {
    return;
}

const $text = require('../lib/text');

function dummy() {
    // dummy/empty function;
}

describe('Method stream', function () {
    describe('with invalid stream object', function () {
        let result;
        beforeEach(function (done) {
            promise.any([
                db.stream(),
                db.stream(null),
                db.stream('test'),
                db.stream({})
            ])
                .then(dummy, function (reason) {
                    result = reason;
                    done();
                });
        });
        it('must throw an error', function () {
            expect(result.length).toBe(4);
            for (let i = 0; i < result.length; i++) {
                expect(result[i] instanceof TypeError).toBe(true);
                expect(result[i].message).toBe($text.invalidStream);
            }
        });
    });
    describe('with invalid stream state', function () {
        let result;
        beforeEach(function (done) {
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
                    done();
                });
        });
        it('must throw an error', function () {
            expect(result.length).toBe(2);
            for (let i = 0; i < result.length; i++) {
                expect(result[i] instanceof Error).toBe(true);
                expect(result[i].message).toBe($text.invalidStreamState);
            }
        });
        describe('with invalid initialization callback', () => {
            let result;
            beforeEach(done => {
                const stream = new QueryStream('select 1');
                promise.any([
                    db.stream(stream),
                    db.stream(stream, null),
                    db.stream(stream, 123),
                    db.stream(stream, {})
                ])
                    .catch(reason => {
                        result = reason;
                        done();
                    });
            });
            it('must throw an error', () => {
                expect(result.length).toBe(4);
                for (let i = 0; i < result.length; i++) {
                    expect(result[i] instanceof TypeError).toBe(true);
                    expect(result[i].message).toBe($text.invalidStreamCB);
                }
            });
        });
        describe('with initialization callback throwing error', function () {
            let result;
            beforeEach(done => {
                db.stream(new QueryStream('select 1'), () => {
                    throw new Error('initialization error');
                })
                    .catch(reason => {
                        result = reason;
                        done();
                    });
            });
            it('must throw an error', () => {
                expect(result instanceof Error);
                expect(result.message).toBe('initialization error');
            });
        });

        describe('throwing error during query notification', () => {
            let result;
            beforeEach(done => {
                options.query = () => {
                    throw 'query notification error';
                };
                db.stream(new QueryStream(), dummy)
                    .catch(error => {
                        result = error;
                        done();
                    });
            });
            it('must reject with the same error', () => {
                expect(result instanceof Error).toBe(false);
                expect(result).toBe('query notification error');
            });
            afterEach(() => {
                options.query = null;
            });
        });

        describe('with a valid request', function () {
            let result, count = 0, context, initCtx;
            const qs = new QueryStream('select * from users where id=$1', [1]);
            beforeEach(function (done) {
                options.query = function (e) {
                    context = e;
                    count++;
                };
                db.stream.call(qs, qs, function (stream) {
                    initCtx = this;
                    stream.pipe(JSONStream.stringify());
                })
                    .then(function (data) {
                        result = data;
                    }, dummy)
                    .finally(function () {
                        done();
                    });
            });
            it('must return the correct data and provide notification', function () {
                expect(typeof(result)).toBe('object');
                expect(result.processed).toBe(1);
                expect(result.duration >= 0).toBe(true);
                expect(count).toBe(1);
                expect(context.query).toBe('select * from users where id=$1');
                expect(JSON.stringify(context.params)).toBe('["1"]');
                expect(initCtx).toBe(qs);
            });
            afterEach(function () {
                options.query = null;
            });
        });

        describe('with invalid request', function () {
            let result, err, context, count = 0;
            beforeEach(function (done) {
                options.error = function (error, e) {
                    err = error;
                    context = e;
                    count++;
                };
                const qs = new QueryStream('select * from unknown where id=$1', [1]);
                db.stream(qs, function (stream) {
                    stream.pipe(JSONStream.stringify());
                })
                    .then(dummy, function (reason) {
                        result = reason;
                    })
                    .finally(function () {
                        done();
                    });
            });
            it('must return the correct data and provide notification', function () {
                expect(result instanceof Error).toBe(true);
                expect(result.message).toBe('relation "unknown" does not exist');
                expect(count).toBe(1);
                expect(context.query).toBe('select * from unknown where id=$1');
                expect(JSON.stringify(context.params)).toBe('["1"]');
                expect(err instanceof Error).toBe(true);
                expect(err.message).toBe('relation "unknown" does not exist');
            });
            afterEach(function () {
                options.error = null;
            });
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
