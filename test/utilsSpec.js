'use strict';

var EOL = require('os').EOL;
var utils = require('../lib/utils');

function dummy() {
}

describe("camelize", function () {

    it("must keep leading digits", function () {
        expect(utils.camelize(' 123 name 456')).toBe('123Name456');
    });

    it("must replace all gaps correctly", function () {
        expect(utils.camelize(' one two - three _ four ')).toBe('oneTwoThreeFour');
        expect(utils.camelize('one.two-three_four')).toBe('oneTwoThreeFour');
    });

});

describe("camelizeVar", function () {
    it("must remove leading digits and white spaces", function () {
        expect(utils.camelizeVar(' 123 name 456')).toBe('name456');
    });
});

describe("enumSql", function () {

    it("must list all sql files in a folder", function () {
        var sql = utils.enumSql('./test/sql');
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect('sub' in sql).toBe(false);
    });

    it("must list sql files in sub-folders", function () {
        var sql = utils.enumSql('./test/sql', {recursive: true}, dummy);
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect(sql.sub.one).toContain('one.sql');
        expect(sql.sub.two).toContain('two.sql');
        expect('third' in sql.sub).toBe(false);
    });

    it("must set values correctly", function () {
        var sql = utils.enumSql('./test/sql', {recursive: true}, function (file, name, path) {
            return path;
        });
        expect(sql.allUsers).toBe('allUsers');
        expect(sql.invalid).toBe('invalid');
        expect(sql.params).toBe('params');
        expect(sql.simple).toBe('simple');
        expect(sql.sub.one).toContain('sub.one');
        expect(sql.sub.two).toContain('sub.two');
    });

    it("must be able to ignore duplicate folders", function () {
        var tree = utils.enumSql('./test/sql-special/dup-folders', {
            recursive: true,
            ignoreErrors: true
        }, function (file, name, path) {
            return path;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.sub.first).toBe('sub.first');
    });

    it("must be able to ignore duplicate files", function () {
        var tree = utils.enumSql('./test/sql-special/dup-files', {
            recursive: true,
            ignoreErrors: true
        }, function (file, name, path) {
            return path;
        });
        expect(tree && typeof tree === 'object').toBeTruthy();
        expect(tree.one).toBe('one');
    });

    describe("negative", function () {
        it("must throw on invalid or empty directory", function () {
            var errMsg = "Parameter 'dir' must be a non-empty text string.";
            expect(function () {
                utils.enumSql()
            }).toThrow(errMsg);
            expect(function () {
                utils.enumSql(null)
            }).toThrow(errMsg);
            expect(function () {
                utils.enumSql('')
            }).toThrow(errMsg);
        });

        it("must throw on duplicate folder", function () {
            var err;
            try {
                utils.enumSql('./test/sql-special/dup-folders', {recursive: true});
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain("Empty or duplicate camelized folder name:");
        });

        it("must throw on a duplicate file", function () {
            var err;
            try {
                utils.enumSql('./test/sql-special/dup-files', {recursive: true});
            } catch (e) {
                err = e;
            }
            expect(err instanceof Error).toBe(true);
            expect(err.message).toContain("Empty or duplicate camelized file name:");
        });

    });
});

describe("objectToCode", function () {

    it("must allow an empty tree", function () {
        expect(utils.objectToCode({})).toBe('{' + EOL + '}');
    });

    it("must format correctly", function () {
        var gap = utils.messageGap(1);
        expect(utils.objectToCode({one: 1})).toBe('{' + EOL + gap + 'one: 1' + EOL + '}');
    });

    it("must convert a full tree correctly", function () {
        var tree = utils.enumSql('./test/sql', {recursive: true});
        expect(utils.objectToCode(tree).length > 100).toBe(true);
    });

    it("must allow callback values", function () {
        var tree = utils.enumSql('./test/sql', {recursive: true});
        expect(utils.objectToCode(tree, dummy).length > 100).toBe(true);
    });

    it("must cover folders first", function () {
        var gap = utils.messageGap(1);
        var tree = utils.enumSql('./test/sql-special/folders-only', {recursive: true}, function (file, name, path) {
            return path;
        });
        expect(utils.objectToCode(tree, function (value) {
            return value;
        })).toBe('{' + EOL + gap + 'one: {' + EOL + gap + gap + 'first: one.first' + EOL + gap + '},' + EOL + gap + 'two: {' + EOL + gap + gap + 'first: two.first' + EOL + gap + '}' + EOL + '}');
    });

    describe("negative", function () {
        it("must throw on invalid object", function () {
            var err = new TypeError("Parameter 'obj' must be a non-null object.");
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
