'use strict';

const npm = {
    util: require('util')
};

const capture = require('./db/capture');
const pgResult = require('pg/lib/result');
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

const dummy = () => {
    // dummy/empty function;
};

function isResult(value) {
    if (options.pgNative) {
        // Impossible to test, because pg-native fails to export the Result type;
        // See this issue: https://github.com/brianc/node-pg-native/issues/63
        // So we are forced to skip the test for now:
        return true;
    }
    return value instanceof pgResult;
}

const $text = require('../lib/text');

describe('Database Instantiation', () => {
    it('must throw an invalid connection passed', () => {
        const errBody = 'Invalid connection details: ';
        expect(pgp).toThrow(errBody + 'undefined');

        expect(() => {
            pgp(null);
        }).toThrow(errBody + 'null');
        expect(() => {
            pgp('');
        }).toThrow(errBody + '""');
        expect(() => {
            pgp('   ');
        }).toThrow(errBody + '"   "');
        expect(() => {
            pgp(123);
        }).toThrow(errBody + '123');
    });
});

describe('Connection', () => {

    describe('with default parameters', () => {
        let status = 'connecting', error;
        beforeEach(done => {
            db.connect()
                .then(obj => {
                    status = 'success';
                    obj.done(); // release connection;
                }, reason => {
                    error = reason;
                    status = 'failed';//reason.error;
                })
                .catch(err => {
                    error = err;
                    status = 'exception';
                })
                .finally(done);
        });
        it('must be successful', () => {
            expect(status).toBe('success');
            expect(error).toBeUndefined();
        });
    });

    describe('for regular queries', () => {
        let result, sco;
        beforeEach(done => {
            db.connect()
                .then(obj => {
                    sco = obj;
                    return sco.one('select count(*) from users');
                })
                .catch(reason => {
                    result = null;
                    return promise.reject(reason);
                })
                .then(data => {
                    result = data;
                })
                .catch(() => {
                    result = null;
                })
                .finally(() => {
                    if (sco) {
                        sco.done();
                    }
                    done();
                });
        });
        it('must provide functioning context', () => {
            expect(result).toBeDefined();
            expect(result.count > 0).toBe(true);
            expect(typeof(sco.tx)).toBe('function'); // just a protocol check;
        });
    });

    describe('for raw queries', () => {
        let result, sco;
        beforeEach(done => {
            db.connect()
                .then(obj => {
                    sco = obj;
                    return sco.result('select * from users');
                })
                .catch(reason => {
                    result = null;
                    return promise.reject(reason);
                })
                .then(data => {
                    result = data;
                })
                .catch(() => {
                    result = null;
                })
                .finally(() => {
                    if (sco) {
                        sco.done();
                    }
                    done();
                });
        });
        it('must provide functioning context', () => {
            expect(isResult(result)).toBe(true);
            expect(result.rows.length > 0).toBe(true);
            expect(typeof(result.rowCount)).toBe('number');
            expect(typeof(result.duration)).toBe('number');
            expect(result.rows.length === result.rowCount).toBe(true);
        });
    });

    describe('for invalid port', () => {
        let errCN, dbErr, result, log;
        beforeEach(() => {
            errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
            errCN.port = 9999;
            dbErr = pgp(errCN);
            options.error = function (err, e) {
                log = {err, e};
            };
        });
        describe('using connect()', () => {
            beforeEach(done => {
                dbErr.connect()
                    .catch(error => {
                        result = error;
                    })
                    .finally(done);
            });
            it('must report the right error', () => {
                expect(log.e.cn).toEqual(errCN);
                expect(result instanceof Error).toBe(true);

                if (options.pgNative) {
                    expect(result.message).toContain('could not connect to server');
                } else {
                    expect(result.message).toContain('connect ECONNREFUSED');
                }

            });
        });
        describe('with transaction connection', () => {
            beforeEach(done => {
                dbErr.tx(dummy)
                    .catch(error => {
                        result = error;
                    })
                    .finally(done);
            });
            it('must report the right error', () => {
                expect(result instanceof Error).toBe(true);
                if (options.pgNative) {
                    expect(result.message).toContain('could not connect to server');
                } else {
                    expect(result.message).toContain('connect ECONNREFUSED');
                }
            });
        });
        afterEach(() => {
            delete options.error;
        });
    });

    describe('for an invalid port', () => {
        const errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.port = '12345';
        const dbErr = pgp(errCN);
        let result;
        beforeEach(done => {
            dbErr.connect()
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });
        it('must report the right error', () => {
            expect(result instanceof Error).toBe(true);
            if (options.pgNative) {
                expect(result.message).toContain('could not connect to server');
            } else {
                expect(result.message).toContain('connect ECONNREFUSED');
            }
        });
    });

    describe('direct end() call', () => {
        let txt;
        beforeEach(done => {
            db.connect()
                .then(obj => {
                    const c = capture();
                    obj.client.end(true);
                    txt = c();
                    obj.done();
                })
                .finally(done);
        });
        it('must be reported into the console', () => {
            expect(txt).toContain($text.clientEnd);
        });
    });

    describe('for invalid connection', () => {
        const dbErr = pgp('bla-bla');
        let error;
        beforeEach(done => {
            dbErr.connect()
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must report the right error', () => {
            const oldStyleError = 'database "bla-bla" does not exist'; // Before PostgreSQL v.10
            const newStyleError = 'role ' + JSON.stringify(pgp.pg.defaults.user) + ' does not exist';
            expect(error instanceof Error).toBe(true);
            expect(error.message.indexOf(oldStyleError) >= 0 || error.message.indexOf(newStyleError) >= 0).toBe(true);
        });
    });

    describe('for invalid user name', () => {
        const errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.user = 'somebody';
        const dbErr = pgp(errCN);
        let error;
        beforeEach(done => {
            dbErr.connect()
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must report the right error', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toContain('role "somebody" does not exist');
        });
    });

    describe('on repeated disconnection', () => {
        let error;
        beforeEach(done => {
            db.connect()
                .then(obj => {
                    obj.done(); // disconnecting;
                    try {
                        obj.done(); // invalid disconnect;
                    } catch (err) {
                        error = err;
                    }
                })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must throw the right error', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe($text.looseQuery);
        });
    });

    describe('when executing a disconnected query', () => {
        let error;
        beforeEach(done => {
            db.connect()
                .then(obj => {
                    obj.done(); // disconnecting;
                    return obj.query(); // invalid disconnected query;
                })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must throw the right error', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe($text.queryDisconnected);
        });
    });

    describe('external closing of the connection pool', () => {
        const tmpDB = pgp('postgres://postgres:password@localhost:5432/invalidDB');
        let error;
        beforeEach(done => {
            tmpDB.$pool.end();
            tmpDB.connect()
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must be handled', () => {
            expect(error).toEqual(new Error($text.poolDestroyed));
        });
    });
});

describe('Direct Connection', () => {

    describe('successful connection', () => {
        let sco;
        beforeEach(done => {
            db.connect({direct: true})
                .then(obj => {
                    sco = obj;
                    sco.done();
                    done();
                });
        });
        it('must connect correctly', () => {
            expect(typeof sco).toBe('object');
        });
    });

    describe('direct end() call', () => {
        let txt;
        beforeEach(done => {
            db.connect({direct: true})
                .then(obj => {
                    const c = capture();
                    obj.client.end();
                    txt = c();
                    done();
                });
        });
        it('must be reported into the console', () => {
            expect(txt).toContain($text.clientEnd);
        });
    });

    describe('for an invalid port', () => {
        const errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
        errCN.port = '12345';
        const dbErr = pgp(errCN);
        let result;
        beforeEach(done => {
            dbErr.connect({direct: true})
                .then(() => {
                    result = null;
                })
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });
        it('must report the right error', () => {
            expect(result instanceof Error).toBe(true);
            if (options.pgNative) {
                expect(result.message).toContain('could not connect to server');
            } else {
                expect(result.message).toContain('connect ECONNREFUSED');
            }
        });
    });

});

describe('Masked Connection Log', () => {

    let cn;
    beforeEach(() => {
        options.error = (err, e) => {
            cn = e.cn;
        };
    });
    describe('as an object', () => {
        const connection = {
            host: 'localhost',
            port: 123,
            user: 'unknown',
            password: '123'
        };
        beforeEach(done => {
            const errDB = pgp(connection);
            errDB.connect()
                .catch(() => {
                    done();
                });
        });
        it('must report the password masked correctly', () => {
            expect(cn.password).toEqual('###');
        });
    });

    describe('as a string', () => {
        beforeEach(done => {
            const errDB = pgp('postgres://postgres:password@localhost:123/unknown');
            errDB.connect()
                .catch(() => {
                    done();
                });
        });
        it('must report the password masked correctly', () => {
            expect(cn).toBe('postgres://postgres:########@localhost:123/unknown');
        });
    });

    describe('as a config string', () => {
        beforeEach(done => {
            const errDB = pgp({connectionString: 'postgres://postgres:password@localhost:123/unknown'});
            errDB.connect()
                .catch(() => {
                    done();
                });
        });
        it('must report the password masked correctly', () => {
            expect(cn).toEqual({connectionString: 'postgres://postgres:########@localhost:123/unknown'});
        });
    });

    afterEach(() => {
        delete options.error;
        cn = undefined;
    });
});

describe('Method \'map\'', () => {

    describe('positive:', () => {
        let pValue, pIndex, pArr, pData;
        beforeEach(done => {
            db.map('SELECT 1 as value', null, (value, index, arr) => {
                pValue = value;
                pIndex = index;
                pArr = arr;
                return {newVal: 2};
            })
                .then(data => {
                    pData = data;
                    done();
                });
        });
        it('must resolve with the right value', () => {
            expect(pValue).toEqual({value: 1});
            expect(pIndex).toBe(0);
            expect(pArr).toEqual([{value: 1}]);
            expect(pData).toEqual([{newVal: 2}]);
        });
    });

    describe('negative:', () => {

        describe('with invalid parameters', () => {
            let err;
            beforeEach(done => {
                db.map('SELECT 1')
                    .catch(error => {
                        err = error;
                    })
                    .finally(done);
            });
            it('must reject with an error', () => {
                expect(err instanceof TypeError).toBe(true);
                expect(err.message).toContain('is not a function');
            });
        });

        describe('with error thrown inside the callback', () => {
            let err;
            beforeEach(done => {
                db.map('SELECT 1', null, () => {
                    throw new Error('Ops!');
                })
                    .catch(error => {
                        err = error;
                    })
                    .finally(done);
            });
            it('must reject with an error', () => {
                expect(err).toEqual(new Error('Ops!'));
            });
        });

    });
});

describe('Method \'each\'', () => {

    describe('positive:', () => {
        let pValue, pIndex, pArr, pData;
        beforeEach(done => {
            db.each('SELECT 1 as value', null, (value, index, arr) => {
                pValue = value;
                pIndex = index;
                pArr = arr;
                value.value = 2;
            })
                .then(data => {
                    pData = data;
                    done();
                });
        });
        it('must resolve with the right value', () => {
            expect(pValue).toEqual({value: 2});
            expect(pIndex).toBe(0);
            expect(pArr).toEqual([{value: 2}]);
            expect(pData).toEqual([{value: 2}]);
        });
    });

    describe('negative:', () => {

        describe('with invalid parameters', () => {
            let err;
            beforeEach(done => {
                db.each('SELECT 1')
                    .catch(error => {
                        err = error;
                    })
                    .finally(done);
            });
            it('must reject with an error', () => {
                expect(err instanceof TypeError).toBe(true);
                expect(err.message).toContain('is not a function');
            });
        });

        describe('with error thrown inside the callback', () => {
            let err;
            beforeEach(done => {
                db.each('SELECT 1', null, () => {
                    throw new Error('Ops!');
                })
                    .catch(error => {
                        err = error;
                    })
                    .finally(done);
            });
            it('must reject with an error', () => {
                expect(err).toEqual(new Error('Ops!'));
            });
        });

    });
});

describe('Method \'none\'', () => {

    it('must resolve with \'null\'', () => {
        let result, error, finished;
        db.none('select * from users where id = $1', 12345678)
            .then(data => {
                result = data;
            })
            .catch(reason => {
                error = reason;
            })
            .finally(() => {
                finished = true;
            });
        waitsFor(() => finished === true, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result).toBe(null);
        });
    });

    describe('when any data is returned', () => {

        it('must reject for a single query', () => {
            let result, error, finished;
            db.none('select * from users')
                .then(data => {
                    result = data;
                })
                .catch(reason => {
                    error = reason;
                })
                .finally(() => {
                    finished = true;
                });
            waitsFor(() => finished === true, 'Query timed out', 5000);
            runs(() => {
                expect(result).toBeUndefined();
                expect(error instanceof pgp.errors.QueryResultError).toBe(true);
                expect(error.toString(1) != tools.inspect(error)).toBe(true);
                expect(error.message).toBe($text.notEmpty);
                expect(error.result.rows.length).toBeGreaterThan(0);
            });
        });

        it('must reject for multi-queries', () => {
            let result, error, finished;
            db.none('select 1;select * from users')
                .then(data => {
                    result = data;
                })
                .catch(reason => {
                    error = reason;
                })
                .finally(() => {
                    finished = true;
                });
            waitsFor(() => finished === true, 'Query timed out', 5000);
            runs(() => {
                expect(result).toBeUndefined();
                expect(error instanceof pgp.errors.QueryResultError).toBe(true);
                expect(error.toString(1) != tools.inspect(error)).toBe(true);
                expect(error.message).toBe($text.notEmpty);
                expect(error.result.rows.length).toBeGreaterThan(0);
            });
        });

    });

});

describe('Method \'one\'', () => {

    it('must resolve with one object', () => {
        let result, error;
        db.one('select 123 as value')
            .then(data => {
                result = data;
            })
            .catch(reason => {
                error = reason;
                result = null;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(typeof(result)).toBe('object');
            expect(result.value).toBe(123);
        });
    });

    describe('value transformation', () => {
        let result, context;
        beforeEach(done => {
            db.one('select count(*) from users', null, function (value) {
                context = this;
                return parseInt(value.count);
            }, 123)
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with the new value', () => {
            expect(typeof result).toBe('number');
            expect(result > 0).toBe(true);
            expect(context).toBe(123);
        });
    });

    describe('when no data found', () => {

        it('must reject for a single query', () => {
            let result, error, finished;
            db.one('select * from users where id = $1', 12345678)
                .then(data => {
                    result = data;
                })
                .catch(reason => {
                    error = reason;
                })
                .finally(() => {
                    finished = true;
                });
            waitsFor(() => finished === true, 'Query timed out', 5000);
            runs(() => {
                expect(result).toBeUndefined();
                expect(error instanceof pgp.errors.QueryResultError).toBe(true);
                expect(error.message).toBe($text.noData);
                expect(error.result.rows).toEqual([]);
            });
        });

        it('must reject for a multi-query', () => {
            let result, error, finished;
            db.one('select 1;select * from users where id = $1', 12345678)
                .then(data => {
                    result = data;
                })
                .catch(reason => {
                    error = reason;
                })
                .finally(() => {
                    finished = true;
                });
            waitsFor(() => finished === true, 'Query timed out', 5000);
            runs(() => {
                expect(result).toBeUndefined();
                expect(error instanceof pgp.errors.QueryResultError).toBe(true);
                expect(error.message).toBe($text.noData);
                expect(error.result.rows).toEqual([]);
            });
        });

    });

    describe('When multiple rows are found', () => {
        it('must reject for a single query', () => {
            let result, error, finished;
            db.one('select * from users')
                .then(data => {
                    result = data;
                })
                .catch(reason => {
                    error = reason;
                })
                .finally(() => {
                    finished = true;
                });
            waitsFor(() => finished === true, 'Query timed out', 5000);
            runs(() => {
                expect(result).toBeUndefined();
                expect(error instanceof pgp.errors.QueryResultError).toBe(true);
                expect(error.message).toBe($text.multiple);
                expect(error.result.rows.length).toBeGreaterThan(0);
            });
        });
        it('must reject for a multi-query', () => {
            let result, error, finished;
            db.one('select 1;select * from users')
                .then(data => {
                    result = data;
                })
                .catch(reason => {
                    error = reason;
                })
                .finally(() => {
                    finished = true;
                });
            waitsFor(() => finished === true, 'Query timed out', 5000);
            runs(() => {
                expect(result).toBeUndefined();
                expect(error instanceof pgp.errors.QueryResultError).toBe(true);
                expect(error.message).toBe($text.multiple);
                expect(error.result.rows.length).toBeGreaterThan(0);
            });
        });

    });

});

describe('Method \'oneOrNone\'', () => {

    it('must resolve with one object when found', () => {
        let result, error;
        db.oneOrNone('select * from users where id=$1', 1)
            .then(data => {
                result = data;
            })
            .catch(reason => {
                error = reason;
                result = null;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(typeof(result)).toBe('object');
            expect(result.id).toBe(1);
        });
    });

    it('must resolve with null when no data found', () => {
        let result, error, finished;
        db.oneOrNone('select * from users where id=$1', 12345678)
            .then(data => {
                result = data;
                finished = true;
            }, reason => {
                error = reason;
                finished = true;
            });
        waitsFor(() => {
            return finished === true;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result).toBeNull();
        });
    });

    describe('value transformation', () => {
        let result, context;
        beforeEach(done => {
            db.oneOrNone('select count(*) from users', null, function (value) {
                context = this;
                return parseInt(value.count);
            }, 123)
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with the new value', () => {
            expect(typeof result).toBe('number');
            expect(result > 0).toBe(true);
            expect(context).toBe(123);
        });
    });

    it('must reject when multiple rows are found', () => {
        let result, error, finished;
        db.oneOrNone('select * from users')
            .then(data => {
                result = data;
                finished = true;
            }, reason => {
                error = reason;
                finished = true;
            });
        waitsFor(() => {
            return finished === true;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($text.multiple);
        });
    });

});

describe('Method \'many\'', () => {

    it('must resolve with array of objects', () => {
        let result, error;
        db.many('select * from users')
            .then(data => {
                result = data;
            }, reason => {
                error = reason;
                result = null;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    it('must reject when no data found', () => {
        let result, error, finished;
        db.many('select * from users where id=$1', 12345678)
            .then(data => {
                result = data;
                finished = true;
            }, reason => {
                error = reason;
                finished = true;
            });
        waitsFor(() => {
            return finished === true;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeUndefined();
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($text.noData);
        });
    });

});

describe('Method \'manyOrNone\'', () => {

    it('must resolve with array of objects', () => {
        let result, error;
        db.manyOrNone('select * from users')
            .then(data => {
                result = data;
            }, reason => {
                error = reason;
                result = null;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    it('must resolve with an empty array when no data found', () => {
        let result, error, finished;
        db.manyOrNone('select * from users where id=$1', 12345678)
            .then(data => {
                result = data;
                finished = true;
            }, reason => {
                error = reason;
                finished = true;
            });
        waitsFor(() => {
            return finished === true;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(0);
        });
    });

});

describe('Executing method query', () => {

    describe('with invalid query as parameter', () => {
        let result;
        beforeEach(done => {
            promise.any([
                db.query(),
                db.query(''),
                db.query('   '),
                db.query({}),
                db.query(1),
                db.query(null)])
                .catch(err => {
                    result = err;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result.length).toBe(6);
            expect(result[0].message).toBe($text.invalidQuery); // reject to an undefined query;
            expect(result[1].message).toBe($text.invalidQuery); // reject to an empty-string query;
            expect(result[2].message).toBe($text.invalidQuery); // reject to a white-space query string;
            expect(result[3].message).toBe($text.invalidQuery); // reject for an empty object;
            expect(result[4].message).toBe($text.invalidQuery); // reject to an invalid-type query;
            expect(result[5].message).toBe($text.invalidQuery); // reject to a null query;
        });
    });

    describe('with invalid qrm as parameter', () => {
        let result;
        beforeEach(done => {
            promise.any([
                db.query('something', undefined, ''),
                db.query('something', undefined, '2'),
                db.query('something', undefined, -1),
                db.query('something', undefined, 0),
                db.query('something', undefined, 100),
                db.query('something', undefined, NaN),
                db.query('something', undefined, 1 / 0),
                db.query('something', undefined, -1 / 0),
                db.query('something', undefined, 2.45)])
                .catch(err => {
                    result = err;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            const error = 'Invalid Query Result Mask specified.';
            expect(result.length).toBe(9);
            for (let i = 0; i < 9; i++) {
                expect(result[i] instanceof TypeError).toBe(true);
                expect(result[i].message).toBe(error);
            }
        });
    });

    describe('with query as function', () => {
        describe('for normal functions', () => {
            const context = [];
            const getQuery1 = () => 'select 123 as value';

            function getQuery2(values) {
                context.push(this);
                return pgp.as.format('select $1 as value', values);
            }

            const getQuery3 = () => getQuery2;

            let result;

            beforeEach(done => {
                promise.all([
                    db.query(getQuery1, [], pgp.queryResult.one),
                    db.query(getQuery2, 456, pgp.queryResult.one),
                    db.query(getQuery3, 789, pgp.queryResult.one)
                ])
                    .then(data => {
                        result = data;
                    })
                    .finally(done);
            });
            it('must return the right result', () => {
                expect(result[0]).toEqual({value: 123});
                expect(result[1]).toEqual({value: 456}); // test that values are passing in correctly;
                expect(result[2]).toEqual({value: 789});// must pass values through recursive functions
                expect(context).toEqual([456, 789]); // this context must be passed in correctly
            });
        });
        describe('for error-throwing functions', () => {
            function throwError() {
                throw new Error('Ops!');
            }

            let error, query, params;
            beforeEach(done => {
                options.error = (err, e) => {
                    query = e.query;
                    params = e.params;
                };
                db.query(throwError, 123)
                    .catch(err => {
                        error = err;
                    })
                    .finally(done);
            });
            it('must reject with the error', () => {
                expect(error.message).toBe('Ops!');
            });
            it('must notify with the right query and params', () => {
                expect(query).toBe(npm.util.inspect(throwError));
                expect(params).toBe(123);
            });
            afterEach(() => {
                delete options.error;
            });
        });
        describe('for async functions', () => {
            function* invalidFunc() {
            }

            let error, query, params;
            beforeEach(done => {
                options.error = (err, e) => {
                    query = e.query;
                    params = e.params;
                };
                db.query(invalidFunc, 123)
                    .catch(err => {
                        error = err;
                    })
                    .finally(done);
            });
            it('must reject with the right error', () => {
                expect(error.message).toBe('Cannot use asynchronous functions with query formatting.');
            });
            it('must notify with the right query and params', () => {
                expect(query).toBe(npm.util.inspect(invalidFunc));
                expect(params).toBe(123);
            });
            afterEach(() => {
                delete options.error;
            });
        });
    });
});

describe('Transactions', () => {

    // NOTE: The same test for 100,000 inserts works also the same.
    // Inserting just 10,000 records to avoid exceeding memory quota on the test server.
    // Also, the client shouldn't execute more than 10,000 queries within a single transaction,
    // huge transactions should  be throttled into smaller chunks.
    describe('A complex transaction with 10,000 inserts', () => {

        let result, error, context, THIS, tag;
        beforeEach(done => {
            db.tx('complex', function (t) {
                tag = t.ctx.tag;
                THIS = this;
                context = t;
                const queries = [
                    this.none('drop table if exists test'),
                    this.none('create table test(id serial, name text)')
                ];
                for (let i = 1; i <= 10000; i++) {
                    queries.push(this.none('insert into test(name) values($1)', 'name-' + i));
                }
                queries.push(this.one('select count(*) from test'));
                return this.batch(queries);
            })
                .then(data => {
                    result = data;
                    done();
                });
        });

        it('must not fail', () => {
            expect(THIS === context).toBe(true);
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(10003); // drop + create + insert x 10000 + select;
            const last = result[result.length - 1]; // result from the select;
            expect(typeof(last)).toBe('object');
            expect(last.count).toBe('10000'); // last one must be the counter (as text);
            expect(tag).toBe('complex');
        });
    });

    describe('When a nested transaction fails', () => {
        let error, THIS, context, ctx;
        beforeEach(done => {
            options.capSQL = true;
            db.tx(function (t) {
                THIS = this;
                context = t;
                return this.batch([
                    this.none('update users set login=$1 where id=$2', ['TestName', 1]),
                    this.tx(function () {
                        ctx = this.ctx;
                        throw new Error('Nested TX failure');
                    })
                ]);
            })
                .catch(reason => {
                    error = reason.data[1].result;
                })
                .finally(done);
        });
        it('must return error from the nested transaction', () => {
            expect(THIS === context).toBe(true);
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Nested TX failure');
            expect(ctx.level).toBe(1);
            expect(ctx.txLevel).toBe(1);
        });
        afterEach(() => {
            delete options.capSQL;
        });
    });

    describe('Detached Transaction', () => {
        let error;
        beforeEach(done => {
            db.tx(t => {
                return t;
            })
                .then(obj => {
                    // cannot use transaction context outside of transaction callback:
                    return obj.query('select 123');
                })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must reject when querying after the callback', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe($text.looseQuery);
        });
    });

    describe('bottom-level failure', () => {
        let result, nestError, THIS1, THIS2, context1, context2;
        beforeEach(done => {
            db.tx(function (t1) {
                THIS1 = this;
                context1 = t1;
                return this.batch([
                    this.none('update users set login=$1', 'External'),
                    this.tx(function (t2) {
                        THIS2 = this;
                        context2 = t2;
                        return this.batch([
                            this.none('update users set login=$1', 'Internal'),
                            this.one('select * from unknownTable') // emulating a bad query;
                        ]);
                    })
                ]);
            })
                .then(dummy, reason => {
                    nestError = reason.data[1].result.data[1].result;
                    return promise.all([
                        db.one('select count(*) from users where login=$1', 'External'), // 0 is expected;
                        db.one('select count(*) from users where login=$1', 'Internal') // 0 is expected;
                    ]);
                })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must rollback everything', () => {
            expect(THIS1 && THIS2 && context1 && context2).toBeTruthy();
            expect(THIS1 === context1).toBe(true);
            expect(THIS2 === context2).toBe(true);
            expect(THIS1 !== THIS2).toBe(true);
            expect(THIS1.ctx.inTransaction).toBe(true);
            expect(THIS2.ctx.inTransaction).toBe(true);
            expect(nestError instanceof Error).toBe(true);
            expect(nestError.message).toContain('relation "unknowntable" does not exist');
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });

    describe('top-level failure', () => {
        let result;
        beforeEach(done => {
            db.tx(function () {
                return this.batch([
                    this.none('update users set login=$1 where id=1', 'Test'),
                    this.tx(function () {
                        return this.none('update person set name=$1 where id=1', 'Test');
                    })
                ])
                    .then(() => {
                        return promise.reject(new Error('ops!'));
                    });
            })
                .then(dummy, () => {
                    return promise.all([
                        db.one('select count(*) from users where login=$1', 'Test'), // 0 is expected;
                        db.one('select count(*) from person where name=$1', 'Test') // 0 is expected;
                    ]);
                })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must rollback everything', () => {
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });

    describe('Calling without a callback', () => {
        describe('for a transaction', () => {
            let error;
            beforeEach(done => {
                db.tx()
                    .catch(reason => {
                        error = reason;
                    })
                    .finally(done);
            });
            it('must reject', () => {
                expect(error instanceof TypeError).toBe(true);
                expect(error.message).toBe('Callback function is required.');
            });
        });
        describe('for a task', () => {
            let error;
            beforeEach(done => {
                db.task()
                    .catch(reason => {
                        error = reason;
                    })
                    .finally(done);
            });
            it('must reject', () => {
                expect(error instanceof TypeError).toBe(true);
                expect(error.message).toBe('Callback function is required.');
            });
        });

    });

    describe('A nested transaction (10 levels)', () => {
        let result, THIS, context;
        const ctx = [];
        beforeEach(done => {
            options.capSQL = true;
            db.tx(0, function () {
                ctx.push(this.ctx);
                return this.tx(1, function () {
                    ctx.push(this.ctx);
                    return this.tx(2, function () {
                        ctx.push(this.ctx);
                        return this.tx(3, function () {
                            ctx.push(this.ctx);
                            return this.tx(4, function () {
                                ctx.push(this.ctx);
                                return this.tx(5, function () {
                                    ctx.push(this.ctx);
                                    return this.batch([
                                        this.one('select \'Hello\' as word'),
                                        this.tx(6, function () {
                                            ctx.push(this.ctx);
                                            return this.tx(7, function () {
                                                ctx.push(this.ctx);
                                                return this.tx(8, function () {
                                                    ctx.push(this.ctx);
                                                    return this.tx(9, function (t) {
                                                        ctx.push(this.ctx);
                                                        THIS = this;
                                                        context = t;
                                                        return this.one('select \'World!\' as word');
                                                    });
                                                });
                                            });
                                        })
                                    ]);
                                });
                            });
                        });
                    });
                });
            })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must work the same no matter how many levels', () => {
            expect(THIS && context && THIS === context).toBeTruthy();
            expect(result instanceof Array).toBe(true);
            expect(result).toEqual([{word: 'Hello'}, {word: 'World!'}]);
            for (let i = 0; i < 10; i++) {
                expect(ctx[i].tag).toBe(i);
                expect(ctx[i].inTransaction).toBe(true);
                if (i) {
                    expect(ctx[i].connected).toBe(false);
                    expect(ctx[i].parent).not.toBeNull();
                    expect(ctx[i].parent.tag).toBe(i - 1);
                } else {
                    expect(ctx[i].connected).toBe(true);
                    expect(ctx[i].parent).toBeNull();
                }
            }
            expect(THIS.ctx.level).toBe(9);
            expect(THIS.ctx.txLevel).toBe(9);
        });
        afterEach(() => {
            delete options.capSQL;
        });
    });

    describe('Closing after a regular issue', () => {
        let error, query;
        beforeEach(done => {
            options.query = e => {
                query = e.query;
            };
            db.tx(() => {
                throw {
                    code: 'something'
                };
            })
                .catch(e => {
                    error = e;
                    done();
                });
        });
        it('Must end with ROLLBACK', () => {
            expect(error).toEqual({code: 'something'});
            expect(query).toBe('rollback');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('Closing after a connectivity issue', () => {
        let error, query;
        beforeEach(done => {
            options.query = e => {
                query = e.query;
            };
            db.tx(() => {
                throw {
                    code: 'ECONNRESET'
                };
            })
                .catch(e => {
                    error = e;
                    done();
                });
        });
        it('Must not execute ROLLBACK', () => {
            expect(error).toEqual({code: 'ECONNRESET'});
            expect(query).toBe('begin');
        });
        afterEach(() => {
            delete options.query;
        });
    });
});

describe('Conditional Transaction', () => {
    describe('with default parameters', () => {
        let firstCtx, secondCtx;
        beforeEach(done => {
            db.txIf(t => {
                firstCtx = t.ctx;
                return t.txIf(t2 => {
                    secondCtx = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must execute a transaction on the top level', () => {
            expect(firstCtx.isTX).toBe(true);
        });
        it('must execute a task on lower levels', () => {
            expect(secondCtx.isTX).toBe(false);
        });
    });
    describe('with condition simple override', () => {
        let firstCtx, secondCtx;
        beforeEach(done => {
            db.txIf({cnd: false}, t => {
                firstCtx = t.ctx;
                return t.txIf(t2 => {
                    secondCtx = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must change the nested transaction logic', () => {
            expect(firstCtx.isTX).toBe(false);
            expect(secondCtx.isTX).toBe(true);
        });
    });
    describe('with successful condition-function override', () => {
        let firstCtx, secondCtx;
        beforeEach(done => {
            db.txIf({cnd: () => false}, t => {
                firstCtx = t.ctx;
                return t.txIf({cnd: a => !a.ctx.inTransaction}, t2 => {
                    secondCtx = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must change the nested transaction logic', () => {
            expect(firstCtx.isTX).toBe(false);
            expect(secondCtx.isTX).toBe(true);
        });
    });

    describe('with error condition-function override', () => {
        function errorCondition() {
            throw new Error('Ops!');
        }

        let error;
        beforeEach(done => {
            db.txIf({cnd: errorCondition}, () => {
            })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must reject with the right error', () => {
            expect(error.message).toBe('Ops!');
        });
    });
});

describe('Reusable Transaction', () => {
    describe('as value with default condition', () => {
        let ctx1, ctx2;
        beforeEach(done => {
            db.tx(t1 => {
                ctx1 = t1.ctx;
                return t1.txIf({reusable: true}, t2 => {
                    ctx2 = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must reuse context', () => {
            expect(ctx1).toBe(ctx2);
        });
    });
    describe('as value with true condition', () => {
        let ctx1, ctx2;
        beforeEach(done => {
            db.tx('first', t1 => {
                ctx1 = t1.ctx;
                return t1.txIf({tag: 'second', cnd: true, reusable: false}, t2 => {
                    ctx2 = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must create a new sub-transaction context', () => {
            expect(ctx1).not.toBe(ctx2);
            expect(ctx1.tag).toBe('first');
            expect(ctx2.tag).toBe('second');
        });
    });

    describe('as successful function', () => {
        function getReusable() {
            return true;
        }

        let ctx1, ctx2;
        beforeEach(done => {
            db.tx(t1 => {
                ctx1 = t1.ctx;
                return t1.txIf({reusable: getReusable}, t2 => {
                    ctx2 = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must reuse context', () => {
            expect(ctx1).toBe(ctx2);
        });
    });
    describe('as error function', () => {
        function getReusable() {
            throw new Error('Ops!');
        }

        let error;
        beforeEach(done => {
            db.tx(t => {
                return t.txIf({reusable: getReusable}, () => {
                });
            })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must reject with the right error', () => {
            expect(error.message).toBe('Ops!');
        });
    });
});

describe('Conditional Task', () => {
    describe('with default parameters', () => {
        let firstCtx, secondCtx;
        beforeEach(done => {
            db.taskIf(t => {
                firstCtx = t.ctx;
                return t.taskIf(t2 => {
                    secondCtx = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must reuse the task', () => {
            expect(secondCtx).toBe(firstCtx);
        });
    });
    describe('with successful condition-function override', () => {
        let firstCtx, secondCtx;
        beforeEach(done => {
            db.taskIf({cnd: true}, t1 => {
                firstCtx = t1.ctx;
                return t1.taskIf({cnd: () => false}, t2 => {
                    secondCtx = t2.ctx;
                });
            })
                .finally(done);
        });
        it('must create new task as required', () => {
            expect(firstCtx).toBe(secondCtx);
        });
    });

    describe('with error condition-function override', () => {
        function errorCondition() {
            throw new Error('Ops!');
        }

        let error;
        beforeEach(done => {
            db.taskIf({cnd: errorCondition}, () => {
            })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must reject with the right error', () => {
            expect(error.message).toBe('Ops!');
        });
    });
});

describe('Return data from a query must match the request type', () => {

    describe('when no data returned', () => {
        let error;
        beforeEach(done => {
            db.none('select * from person where name=$1', 'John')
                .catch(err => {
                    error = err;
                    done();
                });
        });
        it('method \'none\' must return an error', () => {
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($text.notEmpty);
        });
    });

    it('method \'one\' must throw an error when there was no data returned', () => {
        let result, error;
        db.one('select * from person where name=$1', 'Unknown')
            .then(data => {
                result = data;
            }, reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeNull();
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($text.noData);
        });
    });

    it('method \'one\' must throw an error when more than one row was returned', () => {
        let result, error;
        db.one('select * from person')
            .then(data => {
                result = data;
            }, reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeNull();
            expect(error instanceof pgp.errors.QueryResultError).toBe(true);
            expect(error.message).toBe($text.multiple);
        });
    });

    it('method \'oneOrNone\' must resolve into null when no data returned', () => {
        let result, error;
        db.oneOrNone('select * from person where name=$1', 'Unknown')
            .then(data => {
                result = data;
            }, reason => {
                result = 'whatever';
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result).toBeNull();
        });
    });

    it('method \'any\' must return an empty array when no records found', () => {
        let result, error;
        db.any('select * from person where name=\'Unknown\'')
            .then(data => {
                result = data;
            }, reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(error).toBeUndefined();
            expect(result instanceof Array).toBe(true);
            expect(result.length).toBe(0);
        });
    });

});

describe('Queries must not allow invalid QRM (Query Request Mask) combinations', () => {
    it('method \'query\' must throw an error when mask is one+many', () => {
        let result, error;
        db.query('select * from person', undefined, pgp.queryResult.one | pgp.queryResult.many)
            .then(data => {
                result = data;
            }, reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeNull();
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe('Invalid Query Result Mask specified.');
        });
    });
    it('method \'query\' must throw an error when QRM is > 6', () => {
        let result, error;
        db.query('select * from person', undefined, 7)
            .then(data => {
                result = data;
            }, reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeNull();
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe('Invalid Query Result Mask specified.');
        });
    });
    it('method \'query\' must throw an error when QRM is < 1', () => {
        let result, error;
        db.query('select * from person', undefined, 0)
            .then(data => {
                result = data;
            })
            .catch(reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeNull();
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe('Invalid Query Result Mask specified.');
        });
    });

    it('method \'query\' must throw an error when QRM is of the wrong type', () => {
        let result, error;
        db.query('select * from person', undefined, 'wrong qrm')
            .then(data => {
                result = data;
            })
            .catch(reason => {
                result = null;
                error = reason;
            });
        waitsFor(() => {
            return result !== undefined;
        }, 'Query timed out', 5000);
        runs(() => {
            expect(result).toBeNull();
            expect(error instanceof TypeError).toBe(true);
            expect(error.message).toBe('Invalid Query Result Mask specified.');
        });
    });

});

describe('Method \'result\'', () => {

    describe('for a single query', () => {
        let result;
        beforeEach(done => {
            db.result('select 1 as one')
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with a single Result object', () => {
            expect(isResult(result)).toBe(true);
            expect(result.rows).toEqual([{one: 1}]);
            expect(typeof result.duration).toBe('number');
        });
    });

    describe('for a multi-query', () => {
        let result;
        beforeEach(done => {
            db.result('select 1 as one;select 2 as two')
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with the last Result object', () => {
            expect(isResult(result)).toBe(true);
            expect(result.rows).toEqual([{two: 2}]);
            expect('duration' in result).toBe(false); // must be present in multi-query results
        });
    });

});

describe('Method \'multiResult\'', () => {

    describe('for a single query', () => {
        let result;
        beforeEach(done => {
            db.multiResult('select 1 as one')
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with one-element array of Result', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
            expect(result[0].rows).toEqual([{one: 1}]);
        });
    });

    describe('for a multi-query', () => {
        let result;
        beforeEach(done => {
            db.multiResult('select 1 as one;select 2 as two;select * from users where id =- 1;')
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with an array of Results', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(result[0].rows).toEqual([{one: 1}]);
            expect(result[1].rows).toEqual([{two: 2}]);
            expect(result[2].rows).toEqual([]);
        });
    });

});

describe('Method \'multi\'', () => {

    describe('for a single query', () => {
        let result;
        beforeEach(done => {
            db.multi('select 1 as one')
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with one-element array', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual([{one: 1}]);
        });
    });

    describe('for a multi-query', () => {
        let result;
        beforeEach(done => {
            db.multi('select 1 as one;select 2 as two;select * from users where id =- 1;')
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with an array of arrays', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(result[0]).toEqual([{one: 1}]);
            expect(result[1]).toEqual([{two: 2}]);
            expect(result[2]).toEqual([]);
        });
    });

});

describe('Querying a function', () => {

    describe('that expects multiple rows', () => {
        let result;
        beforeEach(done => {
            options.capSQL = true;
            db.func('getUsers')
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return correctly', () => {
            expect(result instanceof Array).toBe(true);
            expect(result.length >= 4).toBe(true);
        });
        afterEach(() => {
            delete options.capSQL;
        });
    });

    describe('that expects a single row', () => {
        let result;
        beforeEach(done => {
            db.proc('findUser', 1)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return correctly', () => {
            expect(typeof(result)).toBe('object');
            expect('id' in result && 'login' in result && 'active' in result).toBe(true);
        });
    });

    describe('value transformation', () => {
        let result, context;
        beforeEach(done => {
            db.proc('findUser', 1, function (value) {
                context = this;
                return value.id;
            }, 123)
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must resolve with the new value', () => {
            expect(typeof result).toBe('number');
            expect(result > 0).toBe(true);
            expect(context).toBe(123);
        });
    });

    describe('with function-parameter that throws an error', () => {
        let result, errCtx;
        beforeEach(done => {
            options.error = function (err, e) {
                errCtx = e;
            };
            db.proc('findUser', [() => {
                throw new Error('format failed');
            }])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe('format failed');
            expect(errCtx.query).toBe('select * from findUser(...)');
        });
        afterEach(() => {
            delete options.error;
        });
    });

    describe('with function-parameter that throws an error + capitalized', () => {
        let errCtx;
        beforeEach(done => {
            options.capSQL = true;
            options.error = function (err, e) {
                errCtx = e;
            };
            db.func('findUser', [() => {
                throw new Error('1');
            }])
                .catch(() => {
                    done();
                });
        });
        it('must throw an error', () => {
            expect(errCtx.query).toBe('SELECT * FROM findUser(...)');
        });
        afterEach(() => {
            delete options.error;
            delete options.capSQL;
        });
    });

    describe('with invalid parameters', () => {
        let result;
        beforeEach(done => {
            promise.any([
                db.func(), // undefined function name;
                db.func(''), // empty-string function name;
                db.func('   '), // white-space string for function name;
                db.func(1), // invalid-type function name;
                db.func(null), // null function name;
                // query function overrides:
                db.query({
                    funcName: null
                }),
                db.query({
                    funcName: ''
                }),
                db.query({
                    funcName: '   '
                })
            ])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must reject with the right error', () => {
            expect(result.length).toBe(8);
            for (let i = 0; i < result.length; i++) {
                expect(result[i] instanceof Error).toBe(true);
                expect(result[i].message).toBe($text.invalidFunction);
            }
        });
    });
});

describe('Task', () => {

    describe('with detached connection', () => {
        let error, tsk;
        beforeEach(done => {
            db.task(function () {
                tsk = this;
                return promise.resolve();
            })
                .then(() => {
                    // try use the task connection context outside of the task callback;
                    return tsk.query('select \'test\'');
                })
                .catch(err => {
                    error = err;
                })
                .finally(done);
        });
        it('must throw an error on any query request', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe($text.looseQuery);
            expect(tsk.ctx.level).toBe(0);
            expect(tsk.ctx.parent).toBeNull();
            expect(tsk.ctx.connected).toBe(true);
            expect(tsk.ctx.inTransaction).toBe(false);
        });
    });

    describe('inside a transaction', () => {
        let context;
        beforeEach(done => {
            db.tx(tx => {
                return tx.task(t => {
                    context = t;
                });
            })
                .finally(done);
        });
        it('must know it is in transaction', () => {
            expect(context.ctx.inTransaction).toBe(true);
        });
    });

    describe('with a callback that returns nothing', () => {
        let result;
        beforeEach(done => {
            db.task(dummy)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must resolve with undefined', () => {
            expect(result).toBeUndefined();
        });
    });

    describe('with a callback that returns a value', () => {
        let result;
        beforeEach(done => {
            db.task(() => {
                return 123;
            })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must resolve with the value', () => {
            expect(result).toBe(123);
        });
    });

    describe('with the callback throwing an error', () => {
        let result;
        beforeEach(done => {
            db.task(() => {
                throw new Error('test');
            })
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must reject with the error thrown', () => {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe('test');
        });
    });

    describe('with a simple promise result', () => {
        let result, context, THIS;
        beforeEach(done => {
            db.task(function (t) {
                THIS = this;
                context = t;
                return promise.resolve('Ok');
            })
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must resolve with that result', () => {
            expect(result).toBe('Ok');
        });
        it('must provide correct connection context', () => {
            expect(context && typeof context === 'object').toBeTruthy();
            expect(context === THIS).toBe(true);
        });
    });

    describe('with a notification error', () => {
        let result, event, counter = 0;
        beforeEach(done => {
            options.task = e => {
                if (counter) {
                    throw 'ops!';
                }
                counter++;
                event = e;
            };

            function myTask() {
                return promise.resolve('success');
            }

            db.task('testTag', myTask)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        afterEach(() => {
            delete options.task;
        });
        it('that must be ignored', () => {
            expect(result).toBe('success');
            expect(counter).toBe(1); // successful notification 'Start', failed for 'Finish';
            expect(event && event.ctx && typeof event.ctx === 'object').toBeTruthy();
            expect(event.ctx.tag).toBe('testTag');
        });
    });

});

describe('negative query formatting', () => {

    describe('with invalid property name', () => {
        let error;
        beforeEach(done => {
            db.one('select ${invalid}', {})
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(error instanceof Error).toBe(true);
            expect(error.message).toBe('Property \'invalid\' doesn\'t exist.');
        });
    });

    describe('with invalid variable index', () => {
        let error;
        beforeEach(done => {
            db.one('select $1', [])
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(error instanceof RangeError).toBe(true);
            expect(error.message).toBe('Variable $1 out of range. Parameters array length: 0');
        });
    });

    describe('with formatting parameter throwing error', () => {
        let error;
        const err = new Error('ops!');
        beforeEach(done => {
            db.one('select $1', [() => {
                throw err;
            }])
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(error instanceof Error).toBe(true);
            expect(error).toBe(err);
        });
    });

    describe('with formatting parameter throwing a non-error', () => {
        let error;
        const err = 'ops!';
        beforeEach(done => {
            db.one('select $1', [() => {
                throw err;
            }])
                .catch(e => {
                    error = e;
                })
                .finally(done);
        });
        it('must reject with correct error', () => {
            expect(error instanceof Error).toBe(false);
            expect(error).toBe(err);
        });
    });

});

describe('Multi-result queries', () => {
    let result;
    beforeEach(done => {
        db.one('select 1 as one;select 2 as two')
            .then(data => {
                result = data;
            })
            .finally(done);
    });
    it('must return the first result', () => {
        expect(result).toEqual({two: 2});
    });
});

describe('Dynamic Schema', () => {
    describe('for a single schema', () => {
        let result;
        beforeEach(done => {
            const innerDb = header({schema: 'test', noWarnings: true, promiseLib: promise}).db;
            innerDb.any('select * from users')
                .catch(error => {
                    result = error;
                })
                .finally(done);
        });
        it('must change the default schema', () => {
            expect(result && result.message).toBe('relation "users" does not exist');
        });
    });
    describe('for multiple schemas', () => {
        let result;
        beforeEach(done => {
            const innerDb = header({schema: ['first', 'second', 'public'], noWarnings: true, promiseLib: promise}).db;
            innerDb.any('select * from users')
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must change the default schemas', () => {
            expect(result && result.length).toBeGreaterThan(0);
        });
    });
    describe('for a callback', () => {
        let result;
        beforeEach(done => {
            const schema = () => ['first', 'second', 'public'];
            const innerDb = header({schema, noWarnings: true, promiseLib: promise}).db;
            innerDb.any('select * from users')
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must change the default schemas', () => {
            expect(result && result.length).toBeGreaterThan(0);
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
