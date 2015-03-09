var pgpLib = require('../index')

describe("Library Loading", function () {
    it("must be a function", function () {
        expect(typeof(pgpLib)).toBe('function');
    });
});

var pgp = pgpLib();

describe("Library Instance Check", function () {
    it("must be a function", function () {
        expect(typeof(pgp)).toBe('function');
    });
    it("must have pg property", function () {
        expect(typeof(pgp.pg)).toBe('object');
    });
    it("must have as property", function () {
        expect(typeof(pgp.as)).toBe('object');
    });    
    it("must have end function", function () {
        expect(typeof(pgp.end)).toBe('function');
    });
});

describe("Query Result must be available", function () {
    it("must be an object", function () {
        expect(typeof(queryResult)).toBe('object');
    });
    it("must have all properties set correctly", function () {
        expect(queryResult.one === 1 && queryResult.many === 2 && queryResult.none === 4 && queryResult.any === 6).toBe(true);
    });
});

var db;

describe("Database Instantiation", function () {
    it("must throw an error when no connection passed", function () {
        expect(pgp).toThrow("Invalid 'cn' parameter passed.");
    });
    db = pgp("connection string");
    it("must return a valid object", function () {
        expect(typeof(db)).toBe('object');
    });
});
