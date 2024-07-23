const npm = {
    util: require('util'), platform: require('os').platform()
};

const capture = require('./db/capture');
const pgResult = require('pg/lib/result');
const header = require('./db/header');
const tools = require('./db/tools');

const isMac = npm.platform === 'darwin';
const isWindows = npm.platform === 'win32';

const promise = header.defPromise;
const options = {
    promiseLib: promise, noWarnings: true
};
const dbHeader = header(options);
const pgp = dbHeader.pgp;
const dbSpec = dbHeader.db;

const dummy = () => {
    // dummy/empty function;
};

const isLocalPC = process.env.NODE_ENV === 'development';

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
        let status = 'connecting', error, doneRes;
        beforeEach(done => {
            dbSpec.connect()
                .then(obj => {
                    status = 'success';
                    doneRes = obj.done(); // release connection;
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
            expect(doneRes).toBeUndefined();
        });
    });

    describe('for regular queries', () => {
        let result, sco;
        beforeEach(done => {
            dbSpec.connect()
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
            expect(typeof sco.tx).toBe('function'); // just a protocol check;
        });
    });

    describe('for raw queries', () => {
        let result, sco;
        beforeEach(done => {
            dbSpec.connect()
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
            expect(typeof result.rowCount).toBe('number');
            expect(typeof result.duration).toBe('number');
            expect(result.rows.length === result.rowCount).toBe(true);
        });
    });

    describe('for invalid port', () => {
        let errCN, dbErr, result, log;
        beforeEach(() => {
            errCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
            errCN.port = 9999;
            errCN.password = '########';
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

                if (!isLocalPC) {
                    // these errors differ between Windows 11 and Linux :|
                    if (options.pgNative) {
                        expect(result.message).toContain('could not connect to server');
                    } else {
                        expect(result.message).toContain('connect ECONNREFUSED');
                    }
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

                if (!isLocalPC) {
                    // these errors differ between Windows 11 and Linux :|
                    if (options.pgNative) {
                        expect(result.message).toContain('could not connect to server');
                    } else {
                        expect(result.message).toContain('connect ECONNREFUSED');
                    }
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

            if (!isLocalPC) {
                // these errors differ between Windows 11 and Linux :|
                if (options.pgNative) {
                    expect(result.message).toContain('could not connect to server');
                } else {
                    expect(result.message).toContain('connect ECONNREFUSED');
                }
            }
        });
    });

    describe('direct end() call', () => {
        let txt;
        beforeEach(done => {
            dbSpec.connect()
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

    if (!isWindows) {
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
                if (isMac) {
                    expect(error.message.indexOf(oldStyleError) >= 0 || error.message.indexOf(newStyleError) >= 0).toBe(true);
                } else {
                    const msgCheck = error.message.includes('password authentication failed for user') ||
                        error.message.includes('getaddrinfo EAI_AGAIN base'); // the latter is a weird new error reported
                    expect(msgCheck).toBeTruthy();
                }
            });
        });
    }

    if (!isWindows) {
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
                const reportError = 'password authentication failed for user "somebody"';
                if (isMac) {
                    expect(error.message).toContain('role "somebody" does not exist');
                } else {
                    expect(error.message).toContain(reportError);
                }
            });
        });
    }

    describe('on repeated disconnection', () => {
        let error;
        beforeEach(done => {
            dbSpec.connect()
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
            dbSpec.connect()
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

    if (!isWindows) {
        describe('db side closing of the connection pool', () => {
            const singleCN = JSON.parse(JSON.stringify(dbHeader.cn)); // dumb connection cloning;
            singleCN.max = 1;
            const dbSingleCN = pgp(singleCN);

            let error;

            beforeEach(done => {
                dbSingleCN.connect()
                    .then(obj => {
                        obj.func('pg_backend_pid')
                            .then(res => {
                                const pid = res[0].pg_backend_pid;
                                return promise.all([obj.func('pg_sleep', [2])
                                    .catch(reason => {
                                        error = reason;
                                    }), // Terminate connection after a short delay, before the query finishes
                                    promise.delay(1000)
                                        .then(() => dbSpec.one('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = $1', pid))])
                                    .finally(() => {
                                        obj.done(error);
                                        done();
                                    });
                            });
                    });
            });

            it('returns the postgres error', () => {
                expect(error instanceof Error).toBe(true);
                expect(error.code).toEqual('57P01');
                expect(error.message).toEqual('terminating connection due to administrator command');
            });

            it('releases the client from the pool', done => {
                let result, singleError;

                dbSingleCN.one('SELECT 1 as test')
                    .then(data => {
                        result = data;
                    })
                    .catch(reason => {
                        singleError = reason;
                    })
                    .then(() => {
                        expect(singleError).not.toBeDefined();
                        expect(result).toEqual({test: 1});
                        done();
                    });
            });
        });
    }
});

describe('Direct Connection', () => {

    describe('successful connection', () => {
        let sco, doneRes;
        beforeEach(done => {
            dbSpec.connect({direct: true})
                .then(obj => {
                    sco = obj;
                    doneRes = sco.done();
                    done();
                });
        });
        it('must connect correctly', () => {
            expect(typeof sco).toBe('object');
            expect(doneRes && typeof doneRes.then === 'function').toBe(true);
        });
    });

    describe('direct end() call', () => {
        let txt;
        beforeEach(done => {
            dbSpec.connect({direct: true})
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

            if (!isLocalPC) {
                // these errors differ between Windows 11 and Linux :|
                if (options.pgNative) {
                    expect(result.message).toContain('could not connect to server');
                } else {
                    expect(result.message).toContain('connect ECONNREFUSED');
                }
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
            host: 'localhost', port: 123, user: 'unknown', password: '123'
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
            dbSpec.map('SELECT 1 as value', null, (value, index, arr) => {
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
                dbSpec.map('SELECT 1')
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
                dbSpec.map('SELECT 1', null, () => {
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
            dbSpec.each('SELECT 1 as value', null, (value, index, arr) => {
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
                dbSpec.each('SELECT 1')
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
                dbSpec.each('SELECT 1', null, () => {
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
        dbSpec.none('select * from users where id = $1', 12345678)
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
            dbSpec.none('select * from users')
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
            dbSpec.none('select 1; select * from users')
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
        dbSpec.one('select 123 as value')
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
            expect(typeof result).toBe('object');
            expect(result.value).toBe(123);
        });
    });

    describe('value transformation', () => {
        let result, context;
        beforeEach(done => {
            dbSpec.one('select count(*) from users', null, function (value) {
                'use strict';
                // NOTE: Outside the strict mode, only objects can be passed in as this context
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
            dbSpec.one('select * from users where id = $1', 12345678)
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
            dbSpec.one('select 1; select * from users where id = $1', 12345678)
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
            dbSpec.one('select * from users')
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
            dbSpec.one('select 1; select * from users')
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
        dbSpec.oneOrNone('select * from users where id = $1', 1)
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
            expect(typeof result).toBe('object');
            expect(result.id).toBe(1);
        });
    });

    it('must resolve with null when no data found', () => {
        let result, error, finished;
        dbSpec.oneOrNone('select * from users where id = $1', 12345678)
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
            dbSpec.oneOrNone('select count(*) from users', null, function (value) {
                'use strict';
                // NOTE: Outside strict mode, only objects can be passed in as this context
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
        dbSpec.oneOrNone('select * from users')
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
        dbSpec.many('select * from users')
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
            expect(Array.isArray(result)).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    it('must reject when no data found', () => {
        let result, error, finished;
        dbSpec.many('select * from users where id = $1', 12345678)
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
        dbSpec.manyOrNone('select * from users')
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
            expect(Array.isArray(result)).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    it('must resolve with an empty array when no data found', () => {
        let result, error, finished;
        dbSpec.manyOrNone('select * from users where id = $1', 12345678)
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
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

});

describe('Executing method query', () => {

    describe('with invalid query as parameter', () => {
        let result;
        beforeEach(done => {
            promise.any([dbSpec.query(), dbSpec.query(''), dbSpec.query('   '), dbSpec.query({}), dbSpec.query(1), dbSpec.query(null)])
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
            promise.any([dbSpec.query('something', undefined, ''), dbSpec.query('something', undefined, '2'), dbSpec.query('something', undefined, -1), dbSpec.query('something', undefined, 0), dbSpec.query('something', undefined, 100), dbSpec.query('something', undefined, NaN), dbSpec.query('something', undefined, 1 / 0), dbSpec.query('something', undefined, -1 / 0), dbSpec.query('something', undefined, 2.45)])
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
                promise.all([dbSpec.query(getQuery1, [], pgp.queryResult.one), dbSpec.query(getQuery2, 456, pgp.queryResult.one), dbSpec.query(getQuery3, 789, pgp.queryResult.one)])
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
                dbSpec.query(throwError, 123)
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
            async function invalidFunc() {
            }

            let error, query, params;
            beforeEach(done => {
                options.error = (err, e) => {
                    query = e.query;
                    params = e.params;
                };
                dbSpec.query(invalidFunc, 123)
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
            dbSpec.tx('complex', function (t) {
                tag = t.ctx.tag;
                THIS = this;
                context = t;
                const queries = [this.none('drop table if exists test'), this.none('create table test(id   serial, name text)')];
                for (let i = 1; i <= 10000; i++) {
                    queries.push(this.none('insert into test(name) values ($1)', 'name-' + i));
                }
                queries.push(this.one('select count(*) from test'));
                return this.batch(queries);
            })
                .then(data => {
                    result = data;
                    done();
                });
        }, 20000);

        it('must not fail', () => {
            expect(THIS === context).toBe(true);
            expect(error).toBeUndefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(10003); // drop + create + insert x 10000 + select;
            const last = result[result.length - 1]; // result from the select;
            expect(typeof last).toBe('object');
            expect(last.count).toBe('10000'); // last one must be the counter (as text);
            expect(tag).toBe('complex');
        });
    });

    describe('When a nested transaction fails', () => {
        let error, THIS, context, ctx;
        beforeEach(done => {
            options.capSQL = true;
            dbSpec.tx(function (t) {
                THIS = this;
                context = t;
                return this.batch([this.none('update users set login=$1 where id = $2', ['TestName', 1]), this.tx(function () {
                    ctx = this.ctx;
                    throw new Error('Nested TX failure');
                })]);
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
            dbSpec.tx(t => {
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
            dbSpec.tx(function (t1) {
                THIS1 = this;
                context1 = t1;
                return this.batch([this.none('update users set login=$1', 'External'), this.tx(function (t2) {
                    THIS2 = this;
                    context2 = t2;
                    return this.batch([this.none('update users set login=$1', 'Internal'), this.one('select * from unknownTable') // emulating a bad query;
                    ]);
                })]);
            })
                .then(dummy, reason => {
                    nestError = reason.data[1].result.data[1].result;
                    return promise.all([dbSpec.one('select count(*) from users where login = $1', 'External'), // 0 is expected;
                        dbSpec.one('select count(*) from users where login = $1', 'Internal') // 0 is expected;
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
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });

    describe('top-level failure', () => {
        let result;
        beforeEach(done => {
            dbSpec.tx(function () {
                return this.batch([this.none(`update users
                                              set login=$1
                                              where id = 1`, 'Test'), this.tx(function () {
                    return this.none(`update person
                                      set name=$1
                                      where id = 1`, 'Test');
                })])
                    .then(() => {
                        return promise.reject(new Error('ops!'));
                    });
            })
                .then(dummy, () => {
                    return promise.all([dbSpec.one(`select count(*)
                                                    from users
                                                    where login = $1`, 'Test'), // 0 is expected;
                        dbSpec.one(`select count(*)
                                from person
                                where name = $1`, 'Test') // 0 is expected;
                    ]);
                })
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must rollback everything', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].count).toBe('0'); // no changes within parent transaction;
            expect(result[1].count).toBe('0'); // no changes within nested transaction;
        });
    });

    describe('Calling without a callback', () => {
        describe('for a transaction', () => {
            let error;
            beforeEach(done => {
                dbSpec.tx()
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
                dbSpec.task()
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
            dbSpec.tx(0, function () {
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
                                    return this.batch([this.one('select \'Hello\' as word'), this.tx(6, function () {
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
                                    })]);
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
            expect(Array.isArray(result)).toBe(true);
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
            dbSpec.tx(() => {
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

    describe('Closing after a protocol violation', () => {
        let error, value;
        beforeEach(done => {
            dbSpec.task(task => task.tx(tx => tx.one('select \'\u0000\''))
                .then(() => {
                    throw new Error('expected error');
                }, () => {
                })
                .then(() => task.tx(tx => tx.one('select \'hi\' as v')))).then(row => {
                value = row.v;
            }, e => {
                error = e;
            }).then(done);
        });
        it('Must not have an error', () => {
            expect(value).toEqual('hi');
            expect(error).toEqual(undefined);
        });
    });

    describe('Closing after a connectivity issue', () => {
        let error, query;
        beforeEach(done => {
            options.query = e => {
                query = e.query;
            };
            dbSpec.tx(() => {
                throw {
                    code: 'ECONNRESET'
                };
            })
                .catch(e => {
                    error = e;
                    done();
                });
        });
        it('must still execute ROLLBACK', () => {
            expect(error).toEqual({code: 'ECONNRESET'});
            expect(query).toBe('rollback');
        });
        afterEach(() => {
            delete options.query;
        });
    });

    describe('db side closing of the connection during slow-verify', () => {
        // dumb connection cloning;
        const singleCN = JSON.parse(JSON.stringify(dbHeader.cn));
        singleCN.max = 1;
        // simulate a slow verify call;
        singleCN.verify = (client, done) => {
            client.on('error', () => {
                // Ignore
            });
            client.query('SELECT pg_sleep(3);', done);
        };
        const dbSingleCN = pgp(singleCN);

        let error;

        beforeEach(done => {
            Promise.all([dbSingleCN.connect().then((obj) => {
                obj.done();
            }, reason => {
                error = reason;
            }), // Terminate the connections during verify, which causes an 'error' event from the pool
                promise.delay(500).then(() => {
                    return dbSpec.query(`SELECT pg_terminate_backend(pid)
                                     FROM pg_stat_activity
                                     WHERE pid <> pg_backend_pid();`);
                })]).then(() => {
                done();
            }, (err) => {
                done(err);
            });
        });

        it('returns the postgres error', () => {
            expect(error instanceof Error).toBe(true);
            if (options.pgNative) {
                // we do not test it for native bindings
            } else {
                if (error.code.includes('ECONNRESET')) {
                    expect(error.code).toBe('ECONNRESET');
                    expect(error.message).toBe('read ECONNRESET');
                } else {
                    expect(error.code).toBe('57P01');
                    expect(error.message).toBe('terminating connection due to administrator command');
                }
            }
        });
    });
});

describe('Conditional Transaction', () => {
    describe('with default parameters', () => {
        let firstCtx, secondCtx;
        beforeEach(done => {
            dbSpec.txIf(t => {
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
            dbSpec.txIf({cnd: false}, t => {
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
            dbSpec.txIf({cnd: () => false}, t => {
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
            dbSpec.txIf({cnd: errorCondition}, () => {
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
            dbSpec.tx(t1 => {
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
            dbSpec.tx('first', t1 => {
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
            dbSpec.tx(t1 => {
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
            dbSpec.tx(t => {
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
            dbSpec.taskIf(t => {
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
            dbSpec.taskIf({cnd: true}, t1 => {
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
            dbSpec.taskIf({cnd: errorCondition}, () => {
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
            dbSpec.none(`select *
                         from person
                         where name = $1`, 'John')
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
        dbSpec.one(`select *
                    from person
                    where name = $1`, 'Unknown')
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
        dbSpec.one(`select *
                    from person`)
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
        dbSpec.oneOrNone(`select *
                          from person
                          where name = $1`, 'Unknown')
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
        dbSpec.any(`select *
                    from person
                    where name = 'Unknown'`)
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
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

});

describe('Queries must not allow invalid QRM (Query Request Mask) combinations', () => {
    it('method \'query\' must throw an error when mask is one+many', () => {
        let result, error;
        dbSpec.query(`select *
                      from person`, undefined, pgp.queryResult.one | pgp.queryResult.many)
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
        dbSpec.query(`select *
                      from person`, undefined, 7)
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
        dbSpec.query(`select *
                      from person`, undefined, 0)
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
        dbSpec.query(`select *
                      from person`, undefined, 'wrong qrm')
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
            dbSpec.result('select 1 as one')
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
            dbSpec.result('select 1 as one;select 2 as two')
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
            dbSpec.multiResult('select 1 as one')
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
            dbSpec.multiResult(`select 1 as one;
            select 2 as two;
            select *
            from users
            where id = - 1;`)
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
            dbSpec.multi('select 1 as one')
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
            dbSpec.multi(`select 1 as one;
            select 2 as two;
            select *
            from users
            where id = - 1;`)
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

describe('Querying an entity', () => {

    describe('multi-row function', () => {
        let result;
        beforeEach(done => {
            options.capSQL = true;
            dbSpec.func('get_users')
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return all rows', () => {
            expect(Array.isArray(result)).toBe(true);
            expect(result.length >= 4).toBe(true);
        });
        afterEach(() => {
            delete options.capSQL;
        });
    });

    describe('single-row function', () => {
        let result;
        beforeEach(done => {
            dbSpec.func('findUser', 1, pgp.queryResult.one)
                .then(data => {
                    result = data;
                })
                .finally(done);
        });
        it('must return one object', () => {
            expect(typeof result).toBe('object');
            expect('id' in result && 'login' in result && 'active' in result).toBe(true);
        });
    });

    describe('with invalid parameters', () => {
        let result;
        beforeEach(done => {
            promise.any([dbSpec.func(), // undefined function name;
                dbSpec.func(''), // empty-string function name;
                dbSpec.func('   '), // white-space string for function name;
                dbSpec.func(1), // invalid-type function name;
                dbSpec.func(null), // null function name;
                // query function overrides:
                dbSpec.query({
                    entity: null, type: 'func'
                }), dbSpec.query({
                    entity: '', type: 'func'
                }), dbSpec.query({
                    entity: '   ', type: 'func'
                })])
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

    describe('proc with bad parameters', () => {
        let result, errCtx;
        beforeEach(done => {
            options.error = function (err, e) {
                errCtx = e;
            };
            dbSpec.proc('camelCase', [() => {
                throw new Error('bad proc params');
            }])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe('bad proc params');
            // NOTE: camel-case ignored within the error query;
            expect(errCtx.query).toBe('call camelCase(...)');
        });
        afterEach(() => {
            delete options.error;
        });
    });

    describe('func with bad parameters', () => {
        let result, errCtx;
        beforeEach(done => {
            options.error = function (err, e) {
                errCtx = e;
            };
            dbSpec.func('camelCase', [() => {
                throw new Error('bad func params');
            }])
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe('bad func params');
            // NOTE: camel-case ignored within the error query;
            expect(errCtx.query).toBe('select * from camelCase(...)');
        });
        afterEach(() => {
            delete options.error;
        });
    });

    describe('with bad proc params + caps', () => {
        let result, errCtx;
        beforeEach(done => {
            options.error = function (err, e) {
                errCtx = e;
            };
            options.capSQL = true;
            dbSpec.proc('camelCase', () => {
                throw new Error('bad proc name');
            })
                .catch(reason => {
                    result = reason;
                })
                .finally(done);
        });
        it('must throw an error', () => {
            expect(result instanceof Error).toBe(true);
            expect(result.message).toBe('bad proc name');
            // NOTE: camel-case ignored within the error query;
            expect(errCtx.query).toBe('CALL camelCase(...)');
        });
        afterEach(() => {
            delete options.error;
            delete options.capSQL;
        });
    });

    describe('stored procedures', () => {
        describe('normal call', () => {
            it('must resolve with null', async () => {
                const res = await dbSpec.proc('empty_proc');
                expect(res).toBeNull();
            });
            it('must support output values', async () => {
                const res = await dbSpec.proc('output_proc', [null, 'world']);
                expect(res).toEqual({output1: true, output2: 'world-hello!'});
            });
            it('must support transformation', async () => {
                const res = await dbSpec.proc('output_proc', [null, 'world'], a => a.output2);
                expect(res).toBe('world-hello!');
            });
        });

        describe('with invalid name', () => {
            let err;
            beforeEach(done => {
                dbSpec.proc()
                    .catch(e => {
                        err = e.message;
                        done();
                    });
            });
            it('must throw error', () => {
                expect(err).toBe('Invalid procedure name.');
            });
        });

    });
});

describe('Task', () => {

    describe('with detached connection', () => {
        let error, tsk;
        beforeEach(done => {
            dbSpec.task(async function () {
                tsk = this;
            })
                .then(() => {
                    // try using the task connection context outside the task callback;
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
            dbSpec.tx(tx => {
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
            dbSpec.task(dummy)
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
        it('must resolve with the value', async () => {
            const result = await dbSpec.task(() => 123);
            expect(result).toBe(123);
        });
    });

    describe('with the callback throwing an error', () => {
        let result;
        beforeEach(done => {
            dbSpec.task(() => {
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
            dbSpec.task(async function (t) {
                THIS = this;
                context = t;
                return 'Ok';
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

            async function myTask() {
                return 'success';
            }

            dbSpec.task('testTag', myTask)
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
            dbSpec.one('select ${invalid}', {})
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
            dbSpec.one('select $1', [])
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
            dbSpec.one('select $1', [() => {
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
            dbSpec.one('select $1', [() => {
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
        dbSpec.one('select 1 as one;select 2 as two')
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
    describe('for an invalid value', () => {
        let result;
        beforeEach(done => {
            const innerDb = header({schema: 123, noWarnings: true, promiseLib: promise}).db;
            innerDb.any(`select *
                         from users`)
                .then(data => {
                    result = data;
                    done();
                });
        });
        it('must not try change the schema', () => {
            expect(result.length).toBeGreaterThan(1);
        });
    });

    describe('for a single schema', () => {
        let result;
        beforeEach(done => {
            const innerDb = header({schema: 'test', noWarnings: true, promiseLib: promise}).db;
            innerDb.any(`select *
                         from users`)
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
            innerDb.any(`select *
                         from users`)
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
            innerDb.any(`select *
                         from users`)
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

        // Note that we cannot test 'pgp.end()' as part of any test,
        // because it kills all other tests that depend on connection pool.
        // So to add coverage, without breaking all tests, we can only
        // call it from here...

        pgp.end(); // shut-down all connection pools;
    };
}
