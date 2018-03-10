'use strict';

const EOL = require('os').EOL;

const $u = require('../lib/utils');
const utils = require('../lib/utils/public');
const internal = require('../lib/utils');
const path = require('path');

function dummy() {
}

describe('taskArgs', () => {
    describe('with invalid arguments', () => {
        const error = 'Parameter "args" must be an array-like object of arguments.';
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
        const sql = utils.enumSql('./test/sql', {recursive: true}, (file, name, path) => {
            return path;
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
        let tree = utils.enumSql('./test/sql-special/dup-folders', {
            recursive: true,
            ignoreErrors: true
        }, (file, name, path) => {
            return path;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.sub.first).toBe('sub.first');
    });

    it('must be able to ignore duplicate files', () => {
        let tree = utils.enumSql('./test/sql-special/dup-files', {
            recursive: true,
            ignoreErrors: true
        }, (file, name, path) => {
            return path;
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

describe('objectToCode', () => {

    it('must allow an empty tree', () => {
        expect(utils.objectToCode({})).toBe('{' + EOL + '}');
    });

    it('must format correctly', () => {
        const gap = $u.messageGap(1);
        expect(utils.objectToCode({one: 1})).toBe('{' + EOL + gap + 'one: 1' + EOL + '}');
    });

    it('must convert a full tree correctly', () => {
        const tree = utils.enumSql('./test/sql', {recursive: true});
        expect(utils.objectToCode(tree).length > 100).toBe(true);
    });

    it('must allow callback values', () => {
        const tree = utils.enumSql('./test/sql', {recursive: true});
        expect(utils.objectToCode(tree, dummy).length > 100).toBe(true);
    });

    it('must cover folders first', () => {
        const gap = $u.messageGap(1);
        const tree = utils.enumSql('./test/sql-special/folders-only', {recursive: true}, (file, name, path) => {
            return path;
        });
        expect(utils.objectToCode(tree, value => {
            return value;
        })).toBe('{' + EOL + gap + 'one: {' + EOL + gap + gap + 'first: one.first' + EOL + gap + '},' + EOL + gap + 'two: {' + EOL + gap + gap + 'first: two.first' + EOL + gap + '}' + EOL + '}');
    });

    describe('negative', () => {
        it('must throw on invalid object', () => {
            const err = 'Parameter \'obj\' must be a non-null object.';
            expect(() => {
                utils.objectToCode();
            }).toThrow(err);
            expect(() => {
                utils.objectToCode(null);
            }).toThrow(err);
            expect(() => {
                utils.objectToCode(123);
            }).toThrow(err);
        });
    });
});

describe('buildSqlModule', () => {

    it('must succeed for a valid configurator', () => {
        let code1 = utils.buildSqlModule({dir: './test/sql'});
        let code2 = utils.buildSqlModule({dir: './test/sql', output: path.join(__dirname, '../generated.js')});
        expect(typeof code1).toBe('string');
        expect(typeof code2).toBe('string');
        expect(code1.length > 100).toBe(true);
        expect(code2.length > 100).toBe(true);
    });

    it('must succeed for valid configuration files', () => {
        let code1 = utils.buildSqlModule(path.join(__dirname, './sql-special/sql-config.json'));
        let code2 = utils.buildSqlModule(path.join(__dirname, './sql-special/sql-simple.json'));
        expect(typeof code1).toBe('string');
        expect(typeof code2).toBe('string');
        expect(code1.length > 100).toBe(true);
        expect(code2.length > 100).toBe(true);
    });

    describe('negative', () => {
        it('must fail without any configuration', () => {
            let err;
            try {
                utils.buildSqlModule();
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain('Default SQL configuration file not found:');
        });

        it('must throw on missing \'dir\'', () => {
            const err = new Error('Property \'dir\' must be a non-empty string.');
            expect(() => {
                utils.buildSqlModule(path.join(__dirname, './sql-special/sql-invalid.json'));
            }).toThrow(err);
        });

        it('must throw on invalid \'config\' parameter', () => {
            const err = 'Invalid parameter \'config\' specified.';
            expect(() => {
                utils.buildSqlModule(123);
            }).toThrow(err);
            expect(() => {
                utils.buildSqlModule(0);
            }).toThrow(err);
            expect(() => {
                utils.buildSqlModule('');
            }).toThrow(err);
            expect(() => {
                utils.buildSqlModule('    ');
            }).toThrow(err);
        });

        it('must throw in invalid config file path', () => {
            // this one is mainly for coverage:
            expect(() => {
                utils.buildSqlModule('./sql-special/non-existent.json');
            }).toThrow();
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

describe('isPathAbsolute', () => {
    const tests = [];
    if (process.platform === 'win32') {
        tests.push({path: 'C:\\Temp\\file.txt', absolute: true});
        tests.push({path: 'C:/Temp/file.txt', absolute: true});
        tests.push({path: 'Temp\\file.txt', absolute: false});
        tests.push({path: 'Temp/file.txt', absolute: false});
        tests.push({path: 'file.txt', absolute: false});
    } else {
        tests.push({path: '/Temp/file.txt', absolute: true});
        tests.push({path: 'file.txt', absolute: false});
    }
    it('must determine each path type', () => {
        tests.forEach(t => {
            expect(internal.isPathAbsolute(t.path)).toBe(t.absolute);
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
