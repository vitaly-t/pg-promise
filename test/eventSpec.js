'use strict';

const QueryStream = require('pg-query-stream');
const JSONStream = require('JSONStream');

const pgResult = require('pg/lib/result');
const pgClient = require('pg/lib/client');

const header = require('./db/header');

const promise = header.defPromise;
const options = {
    promiseLib: promise, // use Bluebird for testing;
    noWarnings: true
};

const testDC = 'test_DC_123';

const dbHeader = header(options, testDC);
const pgp = dbHeader.pgp;
const db = dbHeader.db;

const $text = require('../lib/text');

function isResult(value) {
    if (options.pgNative) {
        // Impossible to test, because pg-native fails to export the Result type;
        // See this issue: https://github.com/brianc/node-pg-native/issues/63
        // So we are forced to skip the test for now:
        return true;
    }
    return value instanceof pgResult;
}

// empty function;
const dummy = () => {
};

describe('Connect/Disconnect events', () => {

    describe('during a query', () => {
        let ctx1 = {}, ctx2 = {}, connect = 0, disconnect = 0;
        beforeEach(done => {
            options.connect = (client, dc, useCount) => {
                ctx1.dc = dc;
                ctx1.client = client;
                ctx1.useCount = useCount;
                connect++;
                throw new Error('### Testing error output in \'connect\'. Please ignore. ###');
            };
            options.disconnect = (client, dc) => {
                ctx2.dc = dc;
                ctx2.client = client;
                disconnect++;
                throw new Error('### Testing error output in \'disconnect\'. Please ignore. ###');
            };
            db.query('select \'test\'')
                .then(dummy, dummy)
                .finally(done);
        });
        afterEach(() => {
            options.connect = null;
            options.disconnect = null;
        });
        it('must be sent correctly', () => {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            if (!options.pgNative) {
                expect(ctx1.client instanceof pgClient).toBe(true);
                expect(ctx2.client instanceof pgClient).toBe(true);
            }
            expect(ctx1.dc).toBe(testDC);
            expect(typeof ctx1.useCount).toBe('number');
            expect(ctx1.useCount >= 0).toBe(true);
            expect(ctx2.dc).toBe(testDC);
        });
    });

    describe('during a transaction', () => {
        let obj1 = {}, obj2 = {}, ctx, connect = 0, disconnect = 0;
        beforeEach(done => {
            options.connect = (client, dc, useCount) => {
                obj1.dc = dc;
                obj1.client = client;
                obj1.useCount = useCount;
                connect++;
            };
            options.disconnect = (client, dc) => {
                obj2.client = client;
                obj2.dc = dc;
                disconnect++;
            };
            db.tx(function (t) {
                ctx = t.ctx;
                return this.batch([
                    t.query('select \'one\''),
                    t.query('select \'two\''),
                    t.query('select \'three\'')
                ]);
            })
                .then(dummy, dummy)
                .finally(done);
        });
        afterEach(() => {
            options.connect = null;
            options.disconnect = null;
        });
        it('must be sent correctly', () => {
            expect(connect).toBe(1);
            expect(disconnect).toBe(1);
            if (!options.pgNative) {
                expect(obj1.client instanceof pgClient).toBe(true);
                expect(obj2.client instanceof pgClient).toBe(true);
            }
            expect(obj1.dc).toBe(testDC);
            expect(obj2.dc).toBe(testDC);
            expect(ctx.dc).toBe(testDC);
        });
    });
});

describe('Query event', () => {

    describe('positive', () => {
        let param, counter = 0;
        beforeEach(done => {
            options.query = e => {
                counter++;
                param = e;
            };
            db.query('select $1', [123])
                .finally(done);
        });
        it('must pass query and parameters correctly', () => {
            expect(counter).toBe(1);
            expect(param.query).toBe('select 123');
            expect(param.params).toBeUndefined();
            expect(param.dc).toBe(testDC);
        });
    });

    describe('negative, with an error object', () => {
        let result;
        const errMsg = 'Throwing a new Error during \'query\' notification.';
        beforeEach(done => {
            options.query = () => {
                throw new Error(errMsg);
            };
            db.query('select $1', [123])
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });
        it('must reject with the right error', () => {
            expect(result).toEqual(new Error(errMsg));
        });
    });

    describe('negative, with undefined', () => {
        let result, handled;
        beforeEach(done => {
            options.query = () => {
                throw undefined;
            };
            db.query('select $1', [123])
                .catch(error => {
                    handled = true;
                    result = error;
                })
                .finally(done);
        });
        it('must reject with undefined', () => {
            expect(handled).toBe(true);
            expect(result).toBeUndefined();
        });
    });

    afterEach(() => {
        delete options.query;
    });

});

describe('Start/Finish transaction events', () => {
    let result, tag, ctx, e1, e2, start = 0, finish = 0;
    beforeEach(done => {
        options.transact = e => {
            if (e.ctx.finish) {
                finish++;
                ctx = e.ctx;
                e1 = e;
            } else {
                start++;
                tag = e.ctx.tag;
                e2 = e;
            }
            throw '### Testing error output in \'transact\'. Please ignore. ###';
        };
        db.tx('myTransaction', () => {
            return promise.resolve('SUCCESS');
        })
            .then(data => {
                result = data;
            })
            .finally(done);
    });
    afterEach(() => {
        options.transact = null;
    });

    it('must execute correctly', () => {
        expect(result).toBe('SUCCESS');
        expect(start).toBe(1);
        expect(finish).toBe(1);
        expect(tag).toBe('myTransaction');
        expect(ctx.success).toBe(true);
        expect(ctx.isTX).toBe(true);
        expect(ctx.dc).toBe(testDC);
        expect(e1.dc).toBe(testDC);
        expect(e2.dc).toBe(testDC);
    });
});

describe('Error event', () => {

    describe('from transaction callbacks', () => {
        let r, error, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                error = err;
                context = e;
                throw new Error('### Testing error output in \'error\'. Please ignore. ###');
            };
            db.tx('Error Transaction', () => {
                throw new Error('Test Error');
            })
                .catch(reason => {
                    r = reason;
                })
                .finally(done);
        });
        it('must report errors', () => {
            expect(r instanceof Error).toBe(true);
            expect(r.message).toBe('Test Error');
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Test Error');
            expect(counter).toBe(1);
            expect(context.ctx.tag).toBe('Error Transaction');
            expect(context.dc).toBe(testDC);
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
        });
    });

    describe('for null-queries', () => {
        let error, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                error = err;
                context = e;
            };
            db.query(null)
                .then(dummy, dummy)
                .finally(done);
        });
        it('must fail correctly', () => {
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe($text.invalidQuery);
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe('for incorrect QRM', () => {
        let error, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                error = err;
                context = e;
            };
            db.query('Bla-Bla', undefined, 42)
                .then(dummy, dummy)
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe('Invalid Query Result Mask specified.');
            expect(context.query).toBe('Bla-Bla');
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe('for single-row requests', () => {
        let errTxt, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                errTxt = err;
                context = e;
            };
            db.one('select * from users')
                .then(dummy, dummy)
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(errTxt instanceof pgp.errors.QueryResultError).toBe(true);
            expect(errTxt.message).toBe('Multiple rows were not expected.');
            expect(context.query).toBe('select * from users');
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe('for no-row requests', () => {
        let errTxt, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                errTxt = err;
                context = e;
            };
            db.none('select * from users')
                .then(dummy, dummy)
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(errTxt instanceof pgp.errors.QueryResultError).toBe(true);
            expect(errTxt.message).toBe($text.notEmpty);
            expect(context.query).toBe('select * from users');
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe('for empty requests', () => {
        let errTxt, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                errTxt = err;
                context = e;
            };
            db.many('select * from users where id > $1', 1000)
                .then(dummy, dummy)
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(errTxt instanceof pgp.errors.QueryResultError).toBe(true);
            expect(errTxt.message).toBe('No data returned from the query.');
            expect(context.query).toBe('select * from users where id > 1000');
            expect(context.params).toBeUndefined();
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    describe('for loose query requests', () => {
        let error, r, context, counter = 0;
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                error = err;
                context = e;
            };
            let query, sco;
            db.connect()
                .then(obj => {
                    sco = obj;
                    query = sco.query('select * from users where($1)', false);
                    return null;
                })
                .finally(() => {
                    sco.done();
                    query
                        .catch(reason => {
                            r = reason;
                        })
                        .finally(done);
                });
        });
        it('must notify with correct error', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe($text.looseQuery);
            expect(r instanceof Error).toBe(true);
            expect(r.message).toBe($text.looseQuery);
            expect(context.query).toBe('select * from users where(false)');
            expect(context.client).toBeUndefined();
            expect(context.params).toBeUndefined();
            expect(counter).toBe(1);
        });
    });

    if (!options.pgNative) {
        describe('for loose stream requests', () => {
            let r, sco;
            beforeEach(done => {
                const qs = new QueryStream('select * from users');
                db.connect()
                    .then(obj => {
                        sco = obj;
                        return sco.stream(qs, s => {
                            s.pipe(JSONStream.stringify());
                            obj.done();
                            throw new Error('Something went wrong here');
                        });
                    })
                    .catch(reason => {
                        r = reason;
                    })
                    .finally(done);
            });
            it('must notify with correct error', () => {
                expect(r instanceof Error).toBe(true);
                expect(r.message).toBe($text.looseQuery);
            });
        });
    }

    describe('for invalid parameters', () => {
        let error, context, counter = 0;
        const params = {};
        beforeEach(done => {
            options.error = (err, e) => {
                counter++;
                error = err;
                context = e;
            };
            db.query('${test}', params)
                .then(dummy, dummy)
                .finally(done);
        });
        it('must report the parameters correctly', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Property \'test\' doesn\'t exist.');
            expect(context.query).toBe('${test}');
            expect(context.params).toBe(params);
            if (!options.pgNative) {
                expect(context.client instanceof pgClient).toBe(true);
            }
            expect(counter).toBe(1);
        });
    });

    afterEach(() => {
        delete options.error;
    });

});

describe('Receive event', () => {

    describe('query positive', () => {
        let ctx, data, res, counter = 0;
        beforeEach(done => {
            options.receive = (d, r, e) => {
                counter++;
                data = d;
                res = r;
                ctx = e;
            };
            db.one('select $1 as value', [123])
                .finally(done);
        });
        it('must pass in correct data and context', () => {
            expect(counter).toBe(1);
            expect(ctx.query).toBe('select 123 as value');
            expect(ctx.params).toBeUndefined();
            expect(ctx.dc).toBe(testDC);
            expect(data).toEqual([{
                value: 123
            }]);
            expect(isResult(res)).toBe(true);
            expect(typeof res.duration).toBe('number');
        });
    });

    describe('for empty queries', () => {
        let ctx, data, res, counter = 0;
        beforeEach(done => {
            options.receive = function (d, r, e) {
                counter++;
                data = d;
                res = r;
                ctx = e;
            };
            db.none('delete from users where id = $1', 1234567890)
                .finally(done);
        });
        it('must pass in correct empty data and context', () => {
            expect(counter).toBe(1);
            expect(ctx.query).toBe('delete from users where id = 1234567890');
            expect(ctx.params).toBeUndefined();
            expect(ctx.dc).toBe(testDC);
            expect(data).toEqual([]);
            expect(isResult(res)).toBe(true);
            expect(typeof res.duration).toBe('number');
        });
    });

    describe('positive for multi-queries', () => {
        const data = [];
        beforeEach(done => {
            options.receive = (d, r, e) => {
                data.push({d, r, e});
            };
            db.multiResult('select 1 as one;select 2 as two')
                .then(() => {
                    done();
                });
        });
        it('must send the event for each result', () => {
            expect(data.length).toBe(2);
            expect(data[0].d).toEqual([{one: 1}]);
            expect(data[1].d).toEqual([{two: 2}]);
        });
    });

    describe('negative for multi-queries', () => {
        let result;
        beforeEach(done => {
            options.receive = () => {
                throw new Error('Ops!');
            };
            db.multiResult('select 1 as one;select 2 as two')
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });
        it('must reject with the error', () => {
            expect(result instanceof Error).toBe(true);
        });
    });

    describe('query negative', () => {
        let result;
        const error = 'ops!';
        beforeEach(done => {
            options.receive = () => {
                throw error;
            };
            db.one('select $1 as value', [123])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must reject with the right error', () => {
            expect(result).toBe(error);
        });
    });

    describe('query negative, undefined', () => {
        let result, handled;
        beforeEach(done => {
            options.receive = () => {
                throw undefined;
            };
            db.one('select $1 as value', [123])
                .catch(error => {
                    handled = true;
                    result = error;
                })
                .finally(done);
        });
        it('must reject with undefined', () => {
            expect(handled).toBe(true);
            expect(result).toBeUndefined();
        });
    });

    if (!options.pgNative) {
        // Cannot test streams against native bindings;

        describe('stream positive', () => {
            let ctx, data, res, counter = 0;
            beforeEach(done => {
                options.receive = (d, r, e) => {
                    counter++;
                    data = d;
                    res = r;
                    ctx = e;
                };
                const qs = new QueryStream('select $1::int as value', [123]);
                db.stream(qs, s => {
                    s.pipe(JSONStream.stringify());
                })
                    .then(() => {
                        done();
                    });
            });
            it('must pass in correct data and context', () => {
                expect(counter).toBe(1);
                expect(ctx.query).toBe('select $1::int as value');
                expect(ctx.params).toEqual(['123']);
                expect(data).toEqual([{
                    value: 123
                }]);
                expect(res).toBeUndefined();
            });
        });

        describe('for paged streaming', () => {
            let result, counter = 0;
            beforeEach(done => {
                options.receive = data => {
                    counter += data.length;
                };
                const qs = new QueryStream('select * from users', [], {batchSize: 2});
                db.stream(qs, s => {
                    s.pipe(JSONStream.stringify());
                })
                    .then(data => {
                        result = data;
                        done();
                    });
            });
            it('must get all the rows', () => {
                expect(counter).toBe(result.processed);
            });
        });

        describe('stream negative', () => {
            let result;
            const err = new Error('Ops!');
            beforeEach(done => {
                options.receive = () => {
                    throw err;
                };
                const qs = new QueryStream('select $1::int as value', [123]);
                db.stream(qs, s => {
                    s.pipe(JSONStream.stringify());
                })
                    .catch(error => {
                        result = error;
                    })
                    .finally(done);
            });
            it('must reject with the right error', () => {
                expect(result).toBe(err);
            });
        });
    }

    afterEach(() => {
        delete options.receive;
    });

});

describe('pgFormatting', () => {
    let result;
    beforeEach(() => {
        result = undefined;
        options.pgFormatting = true;
    });
    afterEach(() => {
        options.pgFormatting = false;
    });
    describe('query event', () => {
        const ctx = [];
        beforeEach(done => {
            options.query = e => {
                ctx.push(e);
            };
            promise.all([
                db.func('findUser', [1]),
                db.one('select * from users where id=$1', [1])
            ])
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        afterEach(() => {
            options.query = null;
        });
        it('must affect formatting accordingly', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(ctx.length).toBe(2);
            // params will be passed back only because the formatting
            // is done by PG, and not by pg-promise:
            //
            expect(ctx[0].params).toBeUndefined();
            expect(ctx[1].params).toEqual([1]);
        });
    });

    describe('empty / null query', () => {
        let err;
        beforeEach(done => {
            promise.any([
                db.query(),
                db.query(''),
                db.query(null),
                db.query(0)
            ])
                .catch(reason => {
                    err = reason;
                })
                .finally(done);
        });
        it('must provide the original pg response', () => {
            if (!options.pgNative) {
                expect(err.length).toBe(4);
                for (let i = 0; i < 4; i++) {
                    expect(err[i] instanceof TypeError).toBe(true);
                    expect(err[i].message).toBe($text.invalidQuery);
                }
            }
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
