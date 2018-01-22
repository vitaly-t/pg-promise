'use strict';

const EOL = require('os').EOL;

const $u = require('../lib/utils');
const utils = require('../lib/utils/public');
const internal = require('../lib/utils');
const path = require('path');

function dummy() {
}

describe('camelize', function () {

    it('must keep leading digits', function () {
        expect(utils.camelize(' 123 name 456')).toBe('123Name456');
    });

    it('must replace all gaps correctly', function () {
        expect(utils.camelize(' one two - three _ four ')).toBe('oneTwoThreeFour');
        expect(utils.camelize('one.two-three_four')).toBe('oneTwoThreeFour');
    });

});

describe('camelizeVar', function () {
    it('must remove leading digits and white spaces', function () {
        expect(utils.camelizeVar(' 123 name 456')).toBe('name456');
    });
    it('must handle all special symbols', function () {
        expect(utils.camelizeVar('-123_ 456.78.one.two . three.8')).toBe('oneTwoThree8');
    });
});

describe('enumSql', function () {

    it('must list all sql files in a folder', function () {
        const sql = utils.enumSql('./test/sql');
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect('sub' in sql).toBe(false);
    });

    it('must list sql files in sub-folders', function () {
        const sql = utils.enumSql('./test/sql', {recursive: true}, dummy);
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect(sql.sub.one).toContain('one.sql');
        expect(sql.sub.two).toContain('two.sql');
        expect('third' in sql.sub).toBe(false);
    });

    it('must set values correctly', function () {
        const sql = utils.enumSql('./test/sql', {recursive: true}, function (file, name, path) {
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

    it('must be able to ignore duplicate folders', function () {
        let tree = utils.enumSql('./test/sql-special/dup-folders', {
            recursive: true,
            ignoreErrors: true
        }, function (file, name, path) {
            return path;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.sub.first).toBe('sub.first');
    });

    it('must be able to ignore duplicate files', function () {
        let tree = utils.enumSql('./test/sql-special/dup-files', {
            recursive: true,
            ignoreErrors: true
        }, function (file, name, path) {
            return path;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.one).toBe('one');
    });

    describe('negative', function () {
        it('must throw on invalid or empty directory', function () {
            const errMsg = 'Parameter \'dir\' must be a non-empty text string.';
            expect(function () {
                utils.enumSql();
            }).toThrow(errMsg);
            expect(function () {
                utils.enumSql(null);
            }).toThrow(errMsg);
            expect(function () {
                utils.enumSql('');
            }).toThrow(errMsg);
        });

        it('must throw on duplicate folder', function () {
            let err;
            try {
                utils.enumSql('./test/sql-special/dup-folders', {recursive: true});
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain('Empty or duplicate camelized folder name:');
        });

        it('must throw on a duplicate file', function () {
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

describe('objectToCode', function () {

    it('must allow an empty tree', function () {
        expect(utils.objectToCode({})).toBe('{' + EOL + '}');
    });

    it('must format correctly', function () {
        const gap = $u.messageGap(1);
        expect(utils.objectToCode({one: 1})).toBe('{' + EOL + gap + 'one: 1' + EOL + '}');
    });

    it('must convert a full tree correctly', function () {
        const tree = utils.enumSql('./test/sql', {recursive: true});
        expect(utils.objectToCode(tree).length > 100).toBe(true);
    });

    it('must allow callback values', function () {
        const tree = utils.enumSql('./test/sql', {recursive: true});
        expect(utils.objectToCode(tree, dummy).length > 100).toBe(true);
    });

    it('must cover folders first', function () {
        const gap = $u.messageGap(1);
        const tree = utils.enumSql('./test/sql-special/folders-only', {recursive: true}, function (file, name, path) {
            return path;
        });
        expect(utils.objectToCode(tree, function (value) {
            return value;
        })).toBe('{' + EOL + gap + 'one: {' + EOL + gap + gap + 'first: one.first' + EOL + gap + '},' + EOL + gap + 'two: {' + EOL + gap + gap + 'first: two.first' + EOL + gap + '}' + EOL + '}');
    });

    describe('negative', function () {
        it('must throw on invalid object', function () {
            const err = new TypeError('Parameter \'obj\' must be a non-null object.');
            expect(function () {
                utils.objectToCode();
            }).toThrow(err);
            expect(function () {
                utils.objectToCode(null);
            }).toThrow(err);
            expect(function () {
                utils.objectToCode(123);
            }).toThrow(err);
        });
    });
});

describe('buildSqlModule', function () {

    it('must succeed for a valid configurator', function () {
        let code1 = utils.buildSqlModule({dir: './test/sql'});
        let code2 = utils.buildSqlModule({dir: './test/sql', output: path.join(__dirname, '../generated.js')});
        expect(typeof code1).toBe('string');
        expect(typeof code2).toBe('string');
        expect(code1.length > 100).toBe(true);
        expect(code2.length > 100).toBe(true);
    });

    it('must succeed for valid configuration files', function () {
        let code1 = utils.buildSqlModule(path.join(__dirname, './sql-special/sql-config.json'));
        let code2 = utils.buildSqlModule(path.join(__dirname, './sql-special/sql-simple.json'));
        expect(typeof code1).toBe('string');
        expect(typeof code2).toBe('string');
        expect(code1.length > 100).toBe(true);
        expect(code2.length > 100).toBe(true);
    });

    describe('negative', function () {
        it('must fail without any configuration', function () {
            let err;
            try {
                utils.buildSqlModule();
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain('Default SQL configuration file not found:');
        });

        it('must throw on missing \'dir\'', function () {
            const err = new Error('Property \'dir\' must be a non-empty string.');
            expect(function () {
                utils.buildSqlModule(path.join(__dirname, './sql-special/sql-invalid.json'));
            }).toThrow(err);
        });

        it('must throw on invalid \'config\' parameter', function () {
            const err = new TypeError('Invalid parameter \'config\' specified.');
            expect(function () {
                utils.buildSqlModule(123);
            }).toThrow(err);
            expect(function () {
                utils.buildSqlModule(0);
            }).toThrow(err);
            expect(function () {
                utils.buildSqlModule('');
            }).toThrow(err);
            expect(function () {
                utils.buildSqlModule('    ');
            }).toThrow(err);
        });

        it('must throw in invalid config file path', function () {
            // this one is mainly for coverage:
            expect(function () {
                utils.buildSqlModule('./sql-special/non-existent.json');
            }).toThrow();
        });
    });
});

describe('isDev', function () {
    const env = process.env.NODE_ENV;

    it('must detect the default environment', function () {
        delete process.env.NODE_ENV;
        expect(internal.isDev()).toBe(false);
    });

    it('must detect a dev environment', function () {
        process.env.NODE_ENV = 'development';
        expect(internal.isDev()).toBe(true);

        process.env.NODE_ENV = 'dev';
        expect(internal.isDev()).toBe(true);

        process.env.NODE_ENV = 'something-dev';
        expect(internal.isDev()).toBe(true);
    });

    it('must detect a non-dev environment', function () {
        process.env.NODE_ENV = 'production';
        expect(internal.isDev()).toBe(false);
    });

    afterEach(function () {
        process.env.NODE_ENV = env;
    });
});

describe('getSafeConnection', () => {
    const cn = 'postgres://postgres:password@localhost:5432/invalidDB';
    it('must obscure passwords', () => {
        expect(internal.getSafeConnection(cn)).toBe('postgres://postgres:########@localhost:5432/invalidDB');
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
        expect(duration).toBeLessThan(10); // it must be fast, even for 10,000 levels
    });
});
