describe("Library entry function", function () {

    var pgpLib, moduleName = '../lib/index';

    beforeEach(function () {
        delete require.cache[require.resolve(moduleName)];
        pgpLib = require(moduleName);
    });

    describe("without any promise override", function () {
        it("must return a valid library object", function () {
            var lib = pgpLib();
            expect(typeof(lib)).toBe('function');
        })
    });

    describe("without any options", function () {
        var result;
        beforeEach(function (done) {
            var db = require('./db/header')().db;
            db.query("select * from users")
                .then(function (data) {
                    result = data;
                })
                .finally(function () {
                    done();
                });
        });
        it("must be able to execute queries", function () {
            expect(result instanceof Array).toBe(true);
        })
    });

    describe("with a valid promise library-object override", function () {
        it("must return a valid library object", function () {
            var lib = pgpLib(
                {
                    promiseLib: {
                        resolve: null,
                        reject: null
                    }
                });
            expect(typeof(lib)).toBe('function');
        })
    });

    describe("with a valid promise library-function override", function () {
        it("must return a valid library object", function () {
            function fakePromiseLib() {
            }

            fakePromiseLib.resolve = null;
            fakePromiseLib.reject = null;
            var lib = pgpLib({
                promiseLib: fakePromiseLib
            });
            expect(typeof(lib)).toBe('function');
        })
    });

    describe("with invalid promise override", function () {
        it("must throw the correct error", function () {
            expect(function () {
                pgpLib({
                    promiseLib: "test"
                });
            }).toThrow(new Error("Invalid or unsupported promise library override."));
        });
    });

    describe("with invalid options parameter", function () {
        it("must throw the correct error", function () {
            expect(function () {
                pgpLib(123);
            }).toThrow(new Error("Invalid parameter 'options' specified."));
        });
    });

});

