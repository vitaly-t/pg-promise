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
    it("must have property 'pg'", function () {
        expect(typeof(pgp.pg)).toBe('object');
    });
    it("must have property 'as'", function () {
        expect(typeof(pgp.as)).toBe('object');
    });
    it("must have valid property 'as'", function () {
        expect(typeof(pgp.as.text)).toBe('function');
        expect(typeof(pgp.as.bool)).toBe('function');
        expect(typeof(pgp.as.date)).toBe('function');
        expect(typeof(pgp.as.csv)).toBe('function');
    });
    it("must have function 'end'", function () {
        expect(typeof(pgp.end)).toBe('function');
    });
});

describe("Query Result must be available", function () {
    it("must be an object", function () {
        expect(typeof(queryResult)).toBe('object');
    });
    it("must have all properties set correctly", function () {
        expect(queryResult.one).toBe(1);
        expect(queryResult.many).toBe(2);
        expect(queryResult.none).toBe(4);
        expect(queryResult.any).toBe(6);
    });
});

var db;

describe("Database Instantiation", function () {
    it("must throw an error when no or empty connection passed", function () {
        var err = "Invalid 'cn' parameter passed.";
        expect(pgp).toThrow(err);
        expect(function () {
            pgp(null)
        }).toThrow(err);
        expect(function () {
            pgp("")
        }).toThrow(err);
    });
    db = pgp("connection string");
    it("must return a valid object", function () {
        expect(typeof(db)).toBe('object');
    });
});

describe("Database Instance Check", function () {
    it("must have all the protocol functions", function () {
        expect(typeof(db.connect)).toBe('function');
        expect(typeof(db.query)).toBe('function');
        expect(typeof(db.tx)).toBe('function');
        expect(typeof(db.one)).toBe('function');
        expect(typeof(db.many)).toBe('function');
        expect(typeof(db.none)).toBe('function');
        expect(typeof(db.oneOrNone)).toBe('function');
        expect(typeof(db.manyOrNone)).toBe('function');
        expect(typeof(db.func)).toBe('function');
        expect(typeof(db.proc)).toBe('function');
    });
});

describe("Type conversion tests, namespace pgp.as", function () {
    it("must correctly convert any boolean", function () {
        expect(pgp.as.bool()).toBe("null");
        expect(pgp.as.bool(null)).toBe("null");
        expect(pgp.as.bool(0)).toBe("FALSE");
        expect(pgp.as.bool(false)).toBe("FALSE");
        expect(pgp.as.bool(1)).toBe("TRUE");
        expect(pgp.as.bool(true)).toBe("TRUE");
        expect(pgp.as.bool(10)).toBe("TRUE");
        expect(pgp.as.bool(-10)).toBe("TRUE");
    });
    it("must correctly convert any text", function () {
        expect(pgp.as.text()).toBe("null");
        expect(pgp.as.text(null)).toBe("null");
        expect(pgp.as.text("")).toBe("''");
        expect(pgp.as.text("some text")).toBe("'some text'");
        expect(pgp.as.text("'starts with quote")).toBe("'''starts with quote'");
        expect(pgp.as.text("ends with quote'")).toBe("'ends with quote'''");
        expect(pgp.as.text("has '' two quotes")).toBe("'has '''' two quotes'");
        expect(pgp.as.text("'")).toBe("''''");
        expect(pgp.as.text("''")).toBe("''''''");
    });
    it("must correctly convert any Date", function () {
        expect(pgp.as.date()).toBe("null");
        expect(pgp.as.date(null)).toBe("null");
        expect(function () {
            pgp.as.date("")
        }).toThrow("'' doesn't represent a valid Date object or value.");
        expect(function () {
            pgp.as.date("bla-bla")
        }).toThrow("'bla-bla' doesn't represent a valid Date object or value.");
        expect(function () {
            pgp.as.date(123)
        }).toThrow("'123' doesn't represent a valid Date object or value.");
        expect(function () {
            pgp.as.date(function(){})
        }).toThrow();
    });
});
