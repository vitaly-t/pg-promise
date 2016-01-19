'use strict';

var LB = require('os').EOL;
var fs = require('fs');
var utils = require('../lib/utils');
var header = require('./db/header');
var promise = header.defPromise;
var options = {
    promiseLib: promise
};
var dbHeader = header(options);
var pgp = dbHeader.pgp;
var db = dbHeader.db;

var QueryFile = pgp.QueryFile;

var sqlSimple = './test/sql/simple.sql';
var sqlUsers = './test/sql/allUsers.sql';
var sqlUnknown = './test/sql/unknown.sql';
var sqlTemp = './test/sql/temp.sql';

describe("QueryFile / Positive:", function () {

    describe("without options", function () {
        var qf = new QueryFile(sqlSimple);
        it("must not minify", function () {
            expect(qf.query).toBe("select 1; --comment");
        });
    });

    describe("with minify=true && debug=true", function () {
        var qf = new QueryFile(sqlUsers, {debug: true, minify: true});
        it("must return minified query", function () {
            expect(qf.query).toBe("select * from users");
        });
    });

    describe("non-minified query", function () {
        var result;
        beforeEach(function (done) {
            db.query(QueryFile(sqlUsers, {}))
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must resolve with data", function () {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe("minified query", function () {
        var result;
        beforeEach(function (done) {
            db.query(QueryFile(sqlUsers, {minify: true}))
                .then(function (data) {
                    result = data;
                    done();
                });
        });
        it("must resolve with data", function () {
            expect(result instanceof Array).toBe(true);
            expect(result.length > 0).toBe(true);
        });
    });

    describe("property options", function () {
        var options = {
            debug: process.env.NODE_ENV === 'development',
            minify: false
        };
        Object.freeze(options);
        it("must be consistent with the settings", function () {
            expect(QueryFile(sqlSimple).options).toEqual(options);
        });
    });

    describe("inspect", function () {
        var qf = new QueryFile(sqlSimple);
        it("must return the query", function () {
            expect(qf.inspect()).toBe(qf.query);
        });
    });

    describe("modified file", function () {
        var q1 = "select 1";
        var q2 = "select 2";
        it("must be read again", function () {
            fs.writeFileSync(sqlTemp, q1);
            var qf = new QueryFile(sqlTemp, {debug: true});
            expect(qf.query).toBe(q1);
            expect(qf.error).toBeUndefined();

            fs.writeFileSync(sqlTemp, q2);
            var t = new Date();
            t.setTime(t.getTime() + 60 * 60 * 1000);
            fs.utimesSync(sqlTemp, t, t);
            qf.prepare();
            expect(qf.query).toBe(q2);
            expect(qf.error).toBeUndefined();
        });
    });
});

describe("QueryFile / Negative:", function () {

    describe("non-minified query", function () {
        var error;
        beforeEach(function (done) {
            db.query(QueryFile(sqlUnknown))
                .catch(function (err) {
                    error = err;
                    done();
                });
        });
        it("must reject with an error", function () {
            expect(error instanceof Error).toBe(true);
        });
    });

    describe("inspect", function () {
        var qf = new QueryFile(sqlUnknown);
        it("must return the error", function () {
            expect(qf.inspect()).toBe(qf.error);
        });
    });

    describe("accessing a temporary file", function () {
        var query = "select 123 as value";
        it("must result in error once deleted", function () {
            fs.writeFileSync(sqlTemp, query);
            var qf = new QueryFile(sqlTemp, {debug: true});
            expect(qf.query).toBe(query);
            expect(qf.error).toBeUndefined();
            fs.unlinkSync(sqlTemp);
            qf.prepare();
            expect(qf.query).toBeUndefined();
            expect(qf.error instanceof Error).toBe(true);
        });
    });
});

describe("EOL", function () {

    it("must detect empty text correctly", function () {
        expect(utils.getEOL("")).toBe(LB);
        expect(utils.getEOL(" ")).toBe(LB);
    });

    it("must detect Unix correctly", function () {
        expect(utils.getEOL("\n")).toBe("\n");
        expect(utils.getEOL("\r\n\n\n")).toBe("\n");
    });

    it("must detect Windows correctly", function () {
        expect(utils.getEOL("\r\n")).toBe("\r\n");
        expect(utils.getEOL("\r\n\n\r\n")).toBe("\r\n");
    });
});

function minify(sql) {
    return utils.minifySQL(sql, "test.sql")
}

describe("Minify/Positive", function () {

    describe("single-line comment", function () {
        it("must return an empty string", function () {
            expect(minify("--comment")).toBe("");
        });
    });

    describe("single-line comment with a prefix", function () {
        it("must return the prefix", function () {
            expect(minify("text--comment")).toBe("text");
        });
    });

    describe("comments in strings", function () {
        it("must be skipped", function () {
            expect(minify("'--comment'")).toBe("'--comment'");
            expect(minify("'/*comment*/'")).toBe("'/*comment*/'");
        });
    });

    describe("empty text", function () {
        it("must be returned empty", function () {
            expect(minify("")).toBe("");
            expect(minify("''")).toBe("''");
        });
    });
    describe("quotes in strings", function () {
        it("must be ignored", function () {
            expect(minify("''''")).toBe("''''");
            expect(minify("''''''")).toBe("''''''");
        });
    });

    describe("with multiple lines", function () {
        it("must be ignored", function () {
            expect(minify("--comment" + LB + "text")).toBe("text");
            expect(minify("--comment" + LB + LB + "text")).toBe("text");
            expect(minify("/*start" + LB + "end*/")).toBe("");
            expect(minify("/*start" + LB + "end*/text")).toBe("text");
            expect(minify("start-/*comment*/end")).toBe("start-end");
            expect(minify("start/*comment*/" + LB + "end")).toBe("start end");

            expect(minify("start/*comment*/" + LB + " end")).toBe("start end");

            expect(minify("/*comment*/end " + LB)).toBe("end");
        });
    });

});

describe("Minify/Negative", function () {

    describe("quotes in strings", function () {
        var errMsg = "SQL Parsing Error: unclosed text block." + LB + "test.sql at {line:1,col:1}";
        it("must throw an error", function () {
            expect(function () {
                minify("'");
            }).toThrow(errMsg);

            expect(function () {
                minify("'''");
            }).toThrow(errMsg);

            try {
                minify("'''text");
            } catch (e) {
                expect(e.inspect()).toBe(e.message + LB + LB + e.stack);
            }
        });
    });

    describe("unclosed multi-lines", function () {
        var errMsg = "SQL Parsing Error: unclosed multi-line comment." + LB + "test.sql at {line:1,col:1}";
        it("must throw an error", function () {
            expect(function () {
                minify("/*");
            }).toThrow(errMsg);

            expect(function () {
                minify("/*text");
            }).toThrow(errMsg);
        });
    });

});

describe("Index Position:", function () {
    function pos(text, idx) {
        return utils.getIndexPos(text, idx, "\r\n");
    }

    describe("", function () {
        it("", function () {
            expect(pos("123\r\n456", 0)).toEqual({
                line: 1,
                col: 1
            });
            expect(pos("123\r\n456", 5)).toEqual({
                line: 2,
                col: 1
            });
            expect(pos("123\r\n", 3)).toEqual({
                line: 1,
                col: 3
            });

        });
    });
});
