const $u = require('../lib/utils');
const utils = require('../lib/utils/public');
const internal = require('../lib/utils');

function dummy() {
}

describe('taskArgs', () => {
    describe('with invalid arguments', () => {
        const error = 'Parameter \'args\' must be an array-like object of arguments.';
        it('must throw error', () => {
            expect(() => {
                utils.taskArgs();
            }).toThrow(error);
            expect(() => {
                utils.taskArgs(123);
            }).toThrow(error);
        });
    });
    describe('without options', () => {
        describe('with empty arguments', () => {
            const emptyResult = [{}, undefined];
            emptyResult.options = emptyResult[0];
            emptyResult.cb = emptyResult[1];
            it('must return empty result', () => {
                expect(utils.taskArgs([])).toEqual(emptyResult);
            });
        });
        describe('with a function', () => {
            it('must detect as the first argument', () => {
                const args = [() => {
                }];
                const result = [{}, args[0]];
                result.options = result[0];
                result.cb = result[1];
                expect(utils.taskArgs(args)).toEqual(result);
            });
            it('must detect as the second argument', () => {
                const args = [undefined, () => {
                }];
                const result = [{}, args[1]];
                result.options = result[0];
                result.cb = result[1];
                expect(utils.taskArgs(args)).toEqual(result);
            });
            it('must ignore as the third argument', () => {
                const args = [undefined, undefined, () => {
                }];
                const result = [{}, undefined];
                result.options = result[0];
                result.cb = result[1];
                expect(utils.taskArgs(args)).toEqual(result);
            });
            it('must allow overrides', () => {
                const args = utils.taskArgs([]);
                args.cb = 123;
                const result = [{}, 123];
                result.options = {};
                result.cb = 123;
                expect(args.cb).toBe(123);
                expect(args).toEqual(result);
            });
        });
    });
    describe('with options', () => {
        it('must support random options', () => {
            const result = [{first: 1, second: 'hello'}, undefined];
            result.options = result[0];
            expect(utils.taskArgs([{first: 1, second: 'hello'}])).toEqual(result);
        });
        it('must allow overrides', () => {
            const args = utils.taskArgs([]);
            args.options = 123;
            const result = [123, undefined];
            result.options = 123;
            expect(args.options).toBe(123);
            expect(args).toEqual(result);
        });
    });
    describe('direct tag', () => {
        it('must support strings', () => {
            const result = [{tag: 'hello'}, undefined];
            result.options = result[0];
            expect(utils.taskArgs(['hello'])).toEqual(result);
        });
        it('must support empty strings', () => {
            const result = [{tag: ''}, undefined];
            result.options = result[0];
            expect(utils.taskArgs([''])).toEqual(result);
        });
        it('must support numbers', () => {
            const result = [{tag: 123}, undefined];
            result.options = result[0];
            expect(utils.taskArgs([123])).toEqual(result);
        });
    });
    describe('indirect tag', () => {
        it('must support numbers', () => {
            const result = [{tag: 123}, undefined];
            result.options = result[0];
            expect(utils.taskArgs([{tag: 123}])).toEqual(result);
        });
        it('must support strings', () => {
            const result = [{tag: 'hello'}, undefined];
            result.options = result[0];
            expect(utils.taskArgs([{tag: 'hello'}])).toEqual(result);
        });
        it('must use callback name when without tag', () => {
            function tst() {
            }

            const result = [{tag: 'tst'}, tst];
            result.options = result[0];
            result.cb = result[1];
            expect(utils.taskArgs([tst])).toEqual(result);
            expect(utils.taskArgs([{}, tst])).toEqual(result);
        });
        it('must skip callback name when with tag', () => {
            function tst() {
            }

            const result = [{tag: 'hello'}, tst];
            result.options = result[0];
            result.cb = result[1];
            expect(utils.taskArgs([{tag: 'hello'}, tst])).toEqual(result);
            expect(utils.taskArgs(['hello', tst])).toEqual(result);
        });

    });

});

describe('camelize', () => {

    it('must keep leading digits', () => {
        expect(utils.camelize(' 123 name 456')).toBe('123Name456');
    });

    it('must replace all gaps correctly', () => {
        expect(utils.camelize(' one two - three _ four ')).toBe('oneTwoThreeFour');
        expect(utils.camelize('one.two-three_four')).toBe('oneTwoThreeFour');
    });

});

describe('camelizeVar', () => {
    it('must remove leading digits and white spaces', () => {
        expect(utils.camelizeVar(' 123 name 456')).toBe('name456');
    });
    it('must handle all special symbols', () => {
        expect(utils.camelizeVar('-123_ 456.78.one.two . three.8')).toBe('oneTwoThree8');
    });
});

describe('enumSql', () => {

    it('must list all sql files in a folder', () => {
        const sql = utils.enumSql('./test/sql');
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect('sub' in sql).toBe(false);
    });

    it('must list sql files in sub-folders', () => {
        const sql = utils.enumSql('./test/sql', {recursive: true}, dummy);
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect(sql.sub.one).toContain('one.sql');
        expect(sql.sub.two).toContain('two.sql');
        expect('third' in sql.sub).toBe(false);
    });

    it('must set values correctly', () => {
        const sql = utils.enumSql('./test/sql', {recursive: true}, (file, name, p) => {
            return p;
        });
        expect(sql.allUsers).toBe('allUsers');
        expect(sql.invalid).toBe('invalid');
        expect(sql.params).toBe('params');
        expect(sql.simple).toBe('simple');
        expect(sql.sub.one).toContain('sub.one');
        expect(sql.sub.two).toContain('sub.two');
        expect(sql.sub.oneTwoThree).toContain('sub.oneTwoThree');
    });

    it('must be able to ignore duplicate folders', () => {
        const tree = utils.enumSql('./test/sql-special/dup-folders', {
            recursive: true,
            ignoreErrors: true
        }, (file, name, p) => {
            return p;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.sub.first).toBe('sub.first');
    });

    it('must be able to ignore duplicate files', () => {
        const tree = utils.enumSql('./test/sql-special/dup-files', {
            recursive: true,
            ignoreErrors: true
        }, (file, name, p) => {
            return p;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.one).toBe('one');
    });

    describe('negative', () => {
        it('must throw on invalid or empty directory', () => {
            const errMsg = 'Parameter \'dir\' must be a non-empty text string.';
            expect(() => {
                utils.enumSql();
            }).toThrow(errMsg);
            expect(() => {
                utils.enumSql(null);
            }).toThrow(errMsg);
            expect(() => {
                utils.enumSql('');
            }).toThrow(errMsg);
        });

        it('must throw on duplicate folder', () => {
            let err;
            try {
                utils.enumSql('./test/sql-special/dup-folders', {recursive: true});
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain('Empty or duplicate camelized folder name:');
        });

        it('must throw on a duplicate file', () => {
            let err;
            try {
                utils.enumSql('./test/sql-special/dup-files', {recursive: true});
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain('Empty or duplicate camelized file name:');
        });

    });
});

describe('isDev', () => {
    const env = process.env.NODE_ENV;

    it('must detect the default environment', () => {
        delete process.env.NODE_ENV;
        expect(internal.isDev()).toBe(false);
    });

    it('must detect a dev environment', () => {
        process.env.NODE_ENV = 'development';
        expect(internal.isDev()).toBe(true);

        process.env.NODE_ENV = 'dev';
        expect(internal.isDev()).toBe(true);

        process.env.NODE_ENV = 'something-dev';
        expect(internal.isDev()).toBe(true);
    });

    it('must detect a non-dev environment', () => {
        process.env.NODE_ENV = 'production';
        expect(internal.isDev()).toBe(false);
    });

    afterEach(() => {
        process.env.NODE_ENV = env;
    });
});

describe('getSafeConnection', () => {
    const cn1 = 'postgres://postgres:password@localhost:5432/invalidDB';
    const cn2 = {connectionString: 'postgres://postgres:password@localhost:5432/invalidDB'};
    const cn3 = {password: 'hello', connectionString: 'postgres://postgres:password@localhost:5432/invalidDB'};
    it('must obscure direct passwords', () => {
        expect(internal.getSafeConnection(cn1)).toBe('postgres://postgres:########@localhost:5432/invalidDB');
    });
    it('must obscure indirect passwords', () => {
        expect(internal.getSafeConnection(cn2)).toEqual({connectionString: 'postgres://postgres:########@localhost:5432/invalidDB'});
    });
    it('must obscure all passwords', () => {
        expect(internal.getSafeConnection(cn3)).toEqual({
            password: '#####',
            connectionString: 'postgres://postgres:########@localhost:5432/invalidDB'
        });
    });
});

describe('Nested Named Parameters', () => {
    let tmp, result, duration;
    beforeEach(() => {
        const obj = {}, depth = 10000;
        let varPath = '';
        tmp = obj;
        for (let i = 1; i < depth; i++) {
            if (varPath) {
                varPath += '.' + i;
            } else {
                varPath = i;
            }
            const newObj = {};
            tmp[i] = newObj;
            tmp = newObj;
        }
        tmp.value = 123;
        const start = Date.now();
        result = $u.getIfHas(obj, varPath + '.value');
        duration = Date.now() - start;
    });
    it('must support any depth level', () => {
        expect(result).toEqual({valid: true, has: true, target: tmp, value: 123});
    });
    it('must be fast', () => {
        // In reality, it is very fast, i.e. way under 10ms for 10,000 levels;
        // However, Travis CI test environment is too slow to test it properly,
        // so the expectation here is significantly lowered for that reason:
        expect(duration).toBeLessThan(100);
    });
});

describe('toJson', () => {
    const v = process.versions.node.split('.'),
        highVer = +v[0], lowVer = +v[1];
    if (highVer > 10 || (highVer === 10 && lowVer >= 4)) {
        // Node.js v10.4.0 is required to support BigInt natively.
        describe('for a direct value', () => {
            expect(internal.toJson(BigInt('0'))).toBe('0');
            expect(internal.toJson(BigInt('123'))).toBe('123');
            expect(internal.toJson(BigInt('-12345678901234567890'))).toBe('-12345678901234567890');
        });
        describe('for an object', () => {
            expect(internal.toJson({value: BigInt('0')})).toEqual('{"value":0}');
            expect(internal.toJson({value: BigInt('123')})).toEqual('{"value":123}');
            expect(internal.toJson({value: BigInt('-456')})).toEqual('{"value":-456}');
            const mix1 = {
                // eslint-disable-next-line no-loss-of-precision
                val1: 12345678901234567890,
                val2: BigInt('12345678901234567890')
            };
            expect(internal.toJson(mix1)).toEqual('{"val1":12345678901234567000,"val2":12345678901234567890}');
        });
        describe('for an undefined', () => {
            expect(internal.toJson()).toBeUndefined();
            expect(internal.toJson(undefined)).toBeUndefined();
        });
    }
});
