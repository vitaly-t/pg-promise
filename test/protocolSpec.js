'use strict';

const PG = require('pg');
const header = require('./db/header');
const tools = require('./tools');

const promise = header.defPromise;
const options = {
    promiseLib: promise,
    noLocking: true,
    noWarnings: true
};
const testDC = 'test_DC_123';
const dbHeader = header(options, testDC);
const pgpLib = dbHeader.pgpLib;
const pgp = dbHeader.pgp;
const db = dbHeader.db;

function dummy() {

}

describe('Library instance', () => {

    it('must NOT have property \'pg\'', () => {
        expect(pgpLib.pg).toBeUndefined();
    });

    it('must NOT have function \'end\'', () => {
        expect(pgpLib.end).toBeUndefined();
    });

    it('must have valid property \'as\'', () => {
        expect(pgpLib.as && typeof pgpLib.as === 'object').toBeTruthy();
        expect(pgpLib.as.text instanceof Function).toBe(true);
        expect(pgpLib.as.bool instanceof Function).toBe(true);
        expect(pgpLib.as.date instanceof Function).toBe(true);
        expect(pgpLib.as.array instanceof Function).toBe(true);
        expect(pgpLib.as.json instanceof Function).toBe(true);
        expect(pgpLib.as.csv instanceof Function).toBe(true);
        expect(pgpLib.as.number instanceof Function).toBe(true);
        expect(pgpLib.as.format instanceof Function).toBe(true);
        expect(pgpLib.as.func instanceof Function).toBe(true);
        expect(pgpLib.as.name instanceof Function).toBe(true);
        expect(pgpLib.as.alias instanceof Function).toBe(true);
        expect(pgpLib.as.value instanceof Function).toBe(true);
        expect(pgpLib.as.buffer instanceof Function).toBe(true);
    });

    it('must have all error types', () => {
        expect(pgp.errors && pgp.errors instanceof Object).toBeTruthy();
        expect(pgpLib.errors.QueryResultError instanceof Function).toBe(true);
        expect(pgpLib.errors.queryResultErrorCode instanceof Object).toBe(true);
        expect(pgpLib.errors.PreparedStatementError instanceof Function).toBe(true);
        expect(pgpLib.errors.ParameterizedQueryError instanceof Function).toBe(true);
    });

    it('must have function \'PromiseAdapter\'', () => {
        expect(pgpLib.PromiseAdapter instanceof Function).toBe(true);
    });

    it('must have function \'PreparedStatement\'', () => {
        expect(pgpLib.PreparedStatement instanceof Function).toBe(true);
    });

    it('must have function \'ParameterizedQuery\'', () => {
        expect(pgpLib.ParameterizedQuery instanceof Function).toBe(true);
    });

    it('must have function \'minify\'', () => {
        expect(pgpLib.minify instanceof Function).toBe(true);
    });

    it('must have valid property \'queryResult\'', () => {
        expect(pgpLib.queryResult && typeof pgpLib.queryResult === 'object').toBeTruthy();
        expect(pgpLib.queryResult.one).toBe(1);
        expect(pgpLib.queryResult.many).toBe(2);
        expect(pgpLib.queryResult.none).toBe(4);
        expect(pgpLib.queryResult.any).toBe(6);
    });

});

describe('Initialized instance', () => {

    it('must have valid property \'pg\'', () => {
        if (options.pgNative) {
            expect(typeof pgp.pg).toBe('object');
        } else {
            expect(pgp.pg).toBe(PG);
        }
    });

    it('must have function \'end\'', () => {
        expect(pgp.end instanceof Function).toBe(true);
    });

    it('must have valid property \'as\'', () => {
        expect(pgp.as && typeof pgp.as === 'object').toBeTruthy();
        expect(pgp.as).toBe(pgpLib.as);
    });

    it('must have all error types', () => {
        expect(pgp.errors && pgp.errors instanceof Object).toBeTruthy();
        expect(pgp.errors.QueryResultError instanceof Function).toBe(true);
        expect(pgp.errors.queryResultErrorCode instanceof Object).toBe(true);
        expect(pgp.errors.PreparedStatementError instanceof Function).toBe(true);
        expect(pgp.errors.ParameterizedQueryError instanceof Function).toBe(true);
    });

    it('must have function \'PromiseAdapter\'', () => {
        expect(pgp.PromiseAdapter instanceof Function).toBe(true);
    });

    it('must have function \'PreparedStatement\'', () => {
        expect(pgp.PreparedStatement instanceof Function).toBe(true);
    });

    it('must have function \'ParameterizedQuery\'', () => {
        expect(pgp.ParameterizedQuery instanceof Function).toBe(true);
    });

    it('must have function \'minify\'', () => {
        expect(pgp.minify instanceof Function).toBe(true);
    });

    it('must have valid property \'queryResult\'', () => {
        expect(pgp.queryResult && typeof pgp.queryResult === 'object').toBeTruthy();
        expect(pgp.queryResult).toBe(pgpLib.queryResult);
    });

});

describe('Database Protocol', () => {

    it('must have all the root-level methods', () => {
        expect(typeof db.connect).toBe('function');
        expect(typeof db.task).toBe('function');
        expect(typeof db.taskIf).toBe('function');
        expect(typeof db.query).toBe('function');
        expect(typeof db.result).toBe('function');
        expect(typeof db.tx).toBe('function');
        expect(typeof db.txIf).toBe('function');
        expect(typeof db.one).toBe('function');
        expect(typeof db.many).toBe('function');
        expect(typeof db.any).toBe('function');
        expect(typeof db.none).toBe('function');
        expect(typeof db.oneOrNone).toBe('function');
        expect(typeof db.manyOrNone).toBe('function');
        expect(typeof db.stream).toBe('function');
        expect(typeof db.func).toBe('function');
        expect(typeof db.proc).toBe('function');
        expect(typeof db.map).toBe('function');
        expect(typeof db.each).toBe('function');
        expect(typeof db.multi).toBe('function');
        expect(typeof db.multiResult).toBe('function');

        // must not have task-level methods:
        expect(db.batch).toBeUndefined();
        expect(db.page).toBeUndefined();
        expect(db.sequence).toBeUndefined();

        // must not have connection-level methods:
        expect(db.done).toBeUndefined();
        expect(db.client).toBeUndefined();

        // must have a hidden configurator;
        expect(db.$config && typeof db.$config === 'object').toBeTruthy();
        expect(typeof db.$config.promise).toBe('function');
        expect(typeof db.$config.promise.resolve).toBe('function');
        expect(typeof db.$config.promise.reject).toBe('function');
        expect(typeof db.$config.promise.all).toBe('function');
        expect(db.$config.promiseLib).toBeTruthy();
        expect(typeof db.$config.options).toBe('object');
        expect(typeof db.$config.pgp).toBe('function');
        expect(typeof db.$config.version).toBe('string');
        expect(typeof db.$config.$npm).toBe('object');
        expect(db.$cn).toBe(dbHeader.cn);
        expect('$dc' in db).toBe(true);
        expect(db.$pool && db.$pool.constructor && db.$pool.constructor.name).toBe('Pool');
    });

    describe('on connection level', () => {

        let connection;
        beforeEach(done => {
            db.connect(t => {
                return promise.resolve(t);
            })
                .then(obj => {
                    connection = obj;
                })
                .finally(() => {
                    connection.done();
                    done();
                });
        });

        it('must have all the required methods', () => {
            expect(connection && typeof(connection) === 'object').toBe(true);
            expect(connection.connect).toBeUndefined();
            expect(typeof connection.query).toBe('function');
            expect(typeof connection.result).toBe('function');
            expect(typeof connection.task).toBe('function');
            expect(typeof connection.taskIf).toBe('function');
            expect(typeof connection.tx).toBe('function');
            expect(typeof connection.txIf).toBe('function');
            expect(typeof connection.one).toBe('function');
            expect(typeof connection.many).toBe('function');
            expect(typeof connection.any).toBe('function');
            expect(typeof connection.none).toBe('function');
            expect(typeof connection.oneOrNone).toBe('function');
            expect(typeof connection.manyOrNone).toBe('function');
            expect(typeof connection.stream).toBe('function');
            expect(typeof connection.func).toBe('function');
            expect(typeof connection.proc).toBe('function');
            expect(typeof connection.map).toBe('function');
            expect(typeof connection.each).toBe('function');
            expect(typeof connection.done).toBe('function');
            expect(typeof connection.batch).toBe('function');
            expect(typeof connection.page).toBe('function');
            expect(typeof connection.sequence).toBe('function');
            expect(typeof connection.client).toBe('object');
            expect(typeof connection.multi).toBe('function');
            expect(typeof connection.multiResult).toBe('function');

            expect('$config' in connection).toBe(false);
            expect('$cn' in connection).toBe(false);
            expect('$dc' in connection).toBe(false);
            expect('$pool' in connection).toBe(false);
        });
    });

    describe('on transaction level', () => {

        let protocol;
        beforeEach(done => {
            db.tx(t => {
                return promise.resolve(t);
            })
                .then(data => {
                    protocol = data;
                })
                .finally(done);
        });

        it('must have all the required methods', () => {
            expect(protocol && typeof(protocol) === 'object').toBe(true);
            expect(protocol.connect).toBeUndefined();
            expect(protocol.client).toBeUndefined();
            expect(protocol.$config).toBeUndefined();
            expect(typeof protocol.query).toBe('function');
            expect(typeof protocol.result).toBe('function');
            expect(typeof protocol.task).toBe('function');
            expect(typeof protocol.taskIf).toBe('function');
            expect(typeof protocol.tx).toBe('function');
            expect(typeof protocol.txIf).toBe('function');
            expect(typeof protocol.one).toBe('function');
            expect(typeof protocol.many).toBe('function');
            expect(typeof protocol.any).toBe('function');
            expect(typeof protocol.none).toBe('function');
            expect(typeof protocol.oneOrNone).toBe('function');
            expect(typeof protocol.manyOrNone).toBe('function');
            expect(typeof protocol.stream).toBe('function');
            expect(typeof protocol.func).toBe('function');
            expect(typeof protocol.proc).toBe('function');
            expect(typeof protocol.batch).toBe('function');
            expect(typeof protocol.page).toBe('function');
            expect(typeof protocol.sequence).toBe('function');
            expect(typeof protocol.map).toBe('function');
            expect(typeof protocol.each).toBe('function');
            expect(typeof protocol.multi).toBe('function');
            expect(typeof protocol.multiResult).toBe('function');
        });
    });

    describe('on task level', () => {

        let protocol;
        beforeEach(done => {
            db.task(t => {
                return promise.resolve(t);
            })
                .then(data => {
                    protocol = data;
                })
                .finally(done);
        });

        it('must have all the required methods', () => {
            expect(protocol && typeof(protocol) === 'object').toBe(true);
            expect(protocol.connect).toBeUndefined();
            expect(protocol.client).toBeUndefined();
            expect(protocol.$config).toBeUndefined();
            expect(typeof(protocol.query)).toBe('function');
            expect(typeof(protocol.result)).toBe('function');
            expect(typeof(protocol.task)).toBe('function');
            expect(typeof(protocol.taskIf)).toBe('function');
            expect(typeof(protocol.tx)).toBe('function');
            expect(typeof(protocol.txIf)).toBe('function');
            expect(typeof(protocol.one)).toBe('function');
            expect(typeof(protocol.many)).toBe('function');
            expect(typeof(protocol.any)).toBe('function');
            expect(typeof(protocol.none)).toBe('function');
            expect(typeof(protocol.oneOrNone)).toBe('function');
            expect(typeof(protocol.manyOrNone)).toBe('function');
            expect(typeof(protocol.stream)).toBe('function');
            expect(typeof(protocol.func)).toBe('function');
            expect(typeof(protocol.proc)).toBe('function');
            expect(typeof(protocol.batch)).toBe('function');
            expect(typeof(protocol.page)).toBe('function');
            expect(typeof(protocol.sequence)).toBe('function');
            expect(typeof(protocol.map)).toBe('function');
            expect(typeof(protocol.each)).toBe('function');
            expect(typeof(protocol.multi)).toBe('function');
            expect(typeof(protocol.multiResult)).toBe('function');
        });
    });

});

describe('Protocol Extension', () => {

    describe('on database level', () => {
        let result, dcParam, THIS, ctx, counter = 0;
        const pgpTest = header({
            promiseLib: header.defPromise,
            noWarnings: true,
            extend: function (obj, dc) {
                dcParam = dc;
                ctx = obj;
                THIS = this;
                counter++;
                this.getOne = function (query, values) {
                    return this.one(query, values);
                };
                throw new Error('### Testing error output in \'extend\'. Please ignore. ###');
            }
        }, testDC);
        beforeEach(done => {
            pgpTest.db.getOne('select \'hello\' as msg')
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must allow custom properties', () => {
            expect(THIS && ctx && THIS === ctx).toBeTruthy();
            expect(counter).toBe(1);
            expect(result.msg).toBe('hello');
            expect(dcParam).toBe(testDC);
        });
    });

    describe('on transaction level', () => {
        let result, THIS, ctx, counter = 0;
        const pgpTest = header({
            promiseLib: header.defPromise,
            noWarnings: true,
            extend: function (obj) {
                counter++;
                if (counter === 2) {
                    // we skip one for the database object,
                    // and into the `extend` for the transaction;
                    THIS = this;
                    ctx = obj;
                    obj.getOne = (query, values) => {
                        return obj.one(query, values);
                    };
                }
            }
        });

        beforeEach(done => {
            pgpTest.db.tx(t => {
                return t.getOne('select \'hello\' as msg');
            })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });

        it('must allow custom properties', () => {
            expect(THIS && ctx && THIS === ctx).toBeTruthy();
            expect(counter).toBe(2);
            expect(result && typeof(result) === 'object').toBe(true);
            expect(result.msg).toBe('hello');
        });

    });
});

// SPEX tests are just for coverage, because the actual methods
// are properly tested within the spex library itself.
describe('spex', () => {

    describe('batch', () => {
        describe('in tasks', () => {
            let result;
            beforeEach(done => {
                db.task(t => {
                    return t.batch([1, 2]);
                })
                    .then(data => {
                        result = data;
                    })
                    .finally(done);
            });
            it('must work in general', () => {
                expect(result).toEqual([1, 2]);
            });
        });
        describe('after connection', () => {
            let result, sco;
            beforeEach(done => {
                db.connect()
                    .then(obj => {
                        sco = obj;
                        return obj.batch([1, 2]);
                    })
                    .then(data => {
                        result = data;
                        sco.done();
                    })
                    .finally(done);
            });
            it('must work in general', () => {
                expect(result).toEqual([1, 2]);
            });
        });
    });

    describe('page', () => {
        describe('in tasks', () => {
            let result;
            beforeEach(done => {
                db.task(t => {
                    return t.page(dummy);
                })
                    .then(data => {
                        result = data;
                    })
                    .finally(done);
            });
            it('must work in general', () => {
                expect(result && typeof result === 'object').toBe(true);
                expect(result.pages).toBe(0);
                expect(result.total).toBe(0);
            });
        });
        describe('after connection', () => {
            let result, sco;
            beforeEach(done => {
                db.connect()
                    .then(obj => {
                        sco = obj;
                        return obj.page(dummy);
                    })
                    .then(data => {
                        sco.done();
                        result = data;
                    })
                    .finally(done);
            });
            it('must work in general', () => {
                expect(result && typeof result === 'object').toBe(true);
                expect(result.pages).toBe(0);
                expect(result.total).toBe(0);
            });
        });
    });

    describe('sequence', () => {
        describe('in tasks', () => {
            let result;
            beforeEach(done => {
                db.task(t => {
                    return t.sequence(dummy);
                })
                    .then(data => {
                        result = data;
                    })
                    .finally(done);
            });
            it('must work in general', () => {
                expect(result && typeof result === 'object').toBe(true);
                expect(result.total).toBe(0);
            });
        });
        describe('after connection', () => {
            let result, sco;
            beforeEach(done => {
                db.connect()
                    .then(obj => {
                        sco = obj;
                        return obj.sequence(dummy);
                    })
                    .then(data => {
                        sco.done();
                        result = data;
                    })
                    .finally(done);
            });
            it('must work in general', () => {
                expect(result && typeof result === 'object').toBe(true);
                expect(result.total).toBe(0);
            });
        });
    });
});

// This one is just for coverage;
describe('Error protocol', () => {

    const result = {
        rows: []
    };
    it('must return correctly formatted error body', () => {
        const error1 = new pgp.errors.QueryResultError(0, result, '');
        const error2 = new pgp.errors.QueryResultError(0, result, {name: 'name', text: 'text'}, []);
        expect(tools.inspect(error1)).toBe(error1.toString());
        expect(tools.inspect(error2)).toBe(error2.toString());
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
