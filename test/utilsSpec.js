'use strict';

var utils = require('../lib/utils');

function dummy() {
}

describe("camelize", function () {

    it("must keep leading digits", function () {
        expect(utils.camelize(' 123 name 456')).toBe('123Name456');
    });

    it("must replace all gaps correctly", function () {
        expect(utils.camelize(' one two - three _ four ')).toBe('oneTwoThreeFour');
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
        var sql = utils.enumSql('./test/sql', {recursive: true, ignoreErrors: true}, dummy);
        expect(sql.allUsers).toContain('allUsers.sql');
        expect(sql.invalid).toContain('invalid.sql');
        expect(sql.params).toContain('params.sql');
        expect(sql.simple).toContain('simple.sql');
        expect(sql.sub.one).toContain('one.sql');
        expect(sql.sub.two).toContain('two.sql');
    });

    it("must set values correctly", function () {
        var sql = utils.enumSql('./test/sql', {recursive: true, ignoreErrors: true}, function (file, name) {
            return name;
        });
        console.log(sql);
        expect(sql.allUsers).toBe('allUsers');
        expect(sql.invalid).toContain('invalid');
        expect(sql.params).toContain('params');
        expect(sql.simple).toContain('simple');
        expect(sql.sub.one).toContain('sub.one');
        expect(sql.sub.two).toContain('sub.two');
    });

    it("must throw on duplicate names", function () {
        expect(function () {
            utils.enumSql('./test/sql', {recursive: true})
        }).toThrow();
    });
});

