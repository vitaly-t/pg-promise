var pgpLib = require('../index');
var pgp = pgpLib(); // initializing the library;

describe("Library entry object", function () {

    it("must be a function", function () {
        expect(typeof(pgpLib)).toBe('function');
    });

});

describe("Library initialization object", function () {

    it("must be a function", function () {
        expect(typeof(pgp)).toBe('function');
    });

    it("must have property 'pg'", function () {
        expect(typeof(pgp.pg)).toBe('object');
    });

    it("must have function 'end'", function () {
        expect(typeof(pgp.end)).toBe('function');
    });

    it("must have valid property 'as'", function () {
        expect(typeof(pgp.as)).toBe('object');
        expect(typeof(pgp.as.text)).toBe('function');
        expect(typeof(pgp.as.bool)).toBe('function');
        expect(typeof(pgp.as.date)).toBe('function');
        expect(typeof(pgp.as.csv)).toBe('function');
        expect(typeof(pgp.as.format)).toBe('function');
    });
});

describe("Query Result", function () {
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

var db; // database instance;

describe("Database Instantiation", function () {
    it("must throw an error when empty or no connection passed", function () {
        var err = "Invalid 'cn' parameter passed.";
        expect(pgp).toThrow(err);
        expect(function () {
            pgp(null)
        }).toThrow(err);
        expect(function () {
            pgp("")
        }).toThrow(err);
    });
    db = pgp("any connection detail");
    it("must return a valid object", function () {
        expect(typeof(db)).toBe('object');
    });
});

describe("Database object", function () {
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

describe("Type conversion in pgp.as", function () {
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
            pgp.as.date(function () {})
        }).toThrow("'function () {}' doesn't represent a valid Date object or value.");

        expect(pgp.as.date(new Date(2015, 2, 8, 16, 24, 8))).toBe("'Sun, 08 Mar 2015 16:24:08 GMT'");
    });

    it("must correctly convert any Array of values into CSV", function () {
        expect(function () {
            pgp.as.csv(1); // test an integer;
        }).toThrow("'1' doesn't represent a valid Array object or value.");
        expect(function () {
            pgp.as.csv("'' doesn't represent a valid Array object or value."); // test an empty string;
        }).toThrow();
        expect(function () {
            pgp.as.csv("'text' doesn't represent a valid Array object or value."); // test a text string;
        }).toThrow();

        expect(pgp.as.csv()).toBe("null"); // test undefined;
        expect(pgp.as.csv(null)).toBe("null"); // test null;
        expect(pgp.as.csv([])).toBe(""); // test empty array;
        expect(pgp.as.csv([1])).toBe("1"); // test an integer;
        expect(pgp.as.csv([-123.456])).toBe("-123.456"); // test a float;
        expect(pgp.as.csv(["Hello World!"])).toBe("'Hello World!'"); // test a text;
        expect(pgp.as.csv([true])).toBe("TRUE"); // test boolean True;
        expect(pgp.as.csv([false])).toBe("FALSE"); // test boolean False;
        expect(pgp.as.csv([new Date(2015, 2, 8, 16, 24, 8)])).toBe("'Sun, 08 Mar 2015 16:24:08 GMT'"); // test date;
        // test a combination of values;
        expect(pgp.as.csv([1, true, "don't break", new Date(2015, 2, 8, 16, 24, 8)])).toBe("1,TRUE,'don''t break','Sun, 08 Mar 2015 16:24:08 GMT'");
    });

    it("must format correctly any query with variables", function () {

        // expert always an object back, no matter what;
        expect(typeof(pgp.as.format())).toBe("object");
        expect(typeof(pgp.as.format(null))).toBe("object");
        expect(typeof(pgp.as.format(""))).toBe("object");

        var q = pgp.as.format();
        expect(q.success).toBe(false);
        expect(q.error).toBe("Parameter 'query' must be a text string.");

        q = pgp.as.format(null);
        expect(q.success).toBe(false);
        expect(q.error).toBe("Parameter 'query' must be a text string.");

        q = pgp.as.format(null, [1, 2, 3]);
        expect(q.success).toBe(false);
        expect(q.error).toBe("Parameter 'query' must be a text string.");

        q = pgp.as.format("$1", null);
        expect(q.success).toBe(true);
        expect(q.query).toBe("$1");

        expect(pgp.as.format("$1").success).toBe(true);
        expect(pgp.as.format("$1").query).toBe("$1");

        expect(pgp.as.format("$1", []).success).toBe(true);
        expect(pgp.as.format("$1", []).query).toBe("$1");

        q = pgp.as.format("$1", ["one"]);
        expect(q.success).toBe(true);
        expect(q.query).toBe("'one'");

        q = pgp.as.format("$1", "one");
        expect(q.success).toBe(true);
        expect(q.query).toBe("'one'");

        q = pgp.as.format("$1, $1", "one");
        expect(q.success).toBe(true);
        expect(q.query).toBe("'one', 'one'");

        q = pgp.as.format("$1, $2, $3, $4", [true, -12.34, "text", new Date(2015, 2, 8, 16, 24, 8)]);
        expect(q.success).toBe(true);
        expect(q.query).toBe("TRUE, -12.34, 'text', 'Sun, 08 Mar 2015 16:24:08 GMT'");

        q = pgp.as.format("$1 $1, $2 $2, $1", [1, "two"]); // test for repeated variables;
        expect(q.success).toBe(true);
        expect(q.query).toBe("1 1, 'two' 'two', 1");

        q = pgp.as.format("Test: $1", ["don't break quotes!"]);
        expect(q.success).toBe(true);
        expect(q.query).toBe("Test: 'don''t break quotes!'");

        q = pgp.as.format("", [1]);
        expect(q.success).toBe(false);
        expect(q.error).toBe("More values passed than variables in the query.");

        q = pgp.as.format("", 1);
        expect(q.success).toBe(false);
        expect(q.error).toBe("No variable found in query to replace with the value passed.");

        q = pgp.as.format("$1", {});
        expect(q.success).toBe(false);
        expect(q.error).toBe("Cannot convert type 'object' into a query variable value.");

        q = pgp.as.format("$1", function () {
        });
        expect(q.success).toBe(false);
        expect(q.error).toBe("Cannot convert type 'function' into a query variable value.");

        q = pgp.as.format("$1", [{}]);
        expect(q.success).toBe(false);
        expect(q.error).toBe("Cannot convert parameter with index 0");

        q = pgp.as.format("$1, $2", [true, function () {
        }]);
        expect(q.success).toBe(false);
        expect(q.error).toBe("Cannot convert parameter with index 1");

    });
});
