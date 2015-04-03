var pgpLib = require('../lib/index');
var pgp = pgpLib(); // initializing the library;

var dateSample = new Date(2015, 2, 8, 16, 24, 8);

describe("Library entry object", function () {

    it("must be a function", function () {
        expect(typeof(pgpLib)).toBe('function');
    });

    it("must throw error on invalid promise override", function () {
        expect(function () {
            pgpLib({
                promiseLib: "test"
            });
        }).toThrow("Invalid or unsupported promise library override.");
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
            pgp(null);
        }).toThrow(err);
        expect(function () {
            pgp("");
        }).toThrow(err);
    });
    db = pgp("invalid connection details");
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
        expect(typeof(db.any)).toBe('function');
        expect(typeof(db.none)).toBe('function');
        expect(typeof(db.oneOrNone)).toBe('function');
        expect(typeof(db.manyOrNone)).toBe('function');
        expect(typeof(db.func)).toBe('function');
        expect(typeof(db.proc)).toBe('function');
    });
});

describe("Method as.bool", function () {
    it("must correctly convert any boolean", function () {
        expect(pgp.as.bool()).toBe("null");
        expect(pgp.as.bool(null)).toBe("null");
        expect(pgp.as.bool(0)).toBe("FALSE");
        expect(pgp.as.bool(false)).toBe("FALSE");
        expect(pgp.as.bool(1)).toBe("TRUE");
        expect(pgp.as.bool(true)).toBe("TRUE");
        expect(pgp.as.bool(10)).toBe("TRUE");
        expect(pgp.as.bool(-10)).toBe("TRUE");
        expect(pgp.as.bool([])).toBe("TRUE");
        expect(pgp.as.bool({})).toBe("TRUE");
        expect(pgp.as.bool(function () {
        })).toBe("TRUE");
        expect(pgp.as.bool("FALSE")).toBe("TRUE");
    });
});

describe("Method as.text", function () {
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
        expect(pgp.as.text(-123.456)).toBe("'-123.456'");
        expect(pgp.as.text(true)).toBe("'true'");
        expect(pgp.as.text(false)).toBe("'false'");
        expect(pgp.as.text(dateSample)).toBe("'" + dateSample.toString() + "'");
        expect(pgp.as.text([])).toBe("''");
        expect(pgp.as.text([1, "hello"])).toBe("'1,hello'"); // converts string as is;
        expect(pgp.as.text({})).toBe("'[object Object]'");
        expect(pgp.as.text(function (){})).toBe("'function (){}'");
    });
});

describe("Method as.date", function () {
    it("must correctly convert any date", function () {
        expect(pgp.as.date()).toBe("null");
        expect(pgp.as.date(null)).toBe("null");
        expect(function () {
            pgp.as.date("");
        }).toThrow("'' doesn't represent a valid Date object.");
        expect(function () {
            pgp.as.date("bla-bla");
        }).toThrow("'bla-bla' doesn't represent a valid Date object.");
        expect(function () {
            pgp.as.date(123);
        }).toThrow("'123' doesn't represent a valid Date object.");
        expect(function () {
            pgp.as.date(function () {});
        }).toThrow("'function () {}' doesn't represent a valid Date object.");
        expect(function () {
            pgp.as.date([]);
        }).toThrow("'' doesn't represent a valid Date object.");
        expect(function () {
            pgp.as.date({});
        }).toThrow("'[object Object]' doesn't represent a valid Date object.");

        expect(pgp.as.date(dateSample)).toBe("'" + dateSample.toUTCString() + "'");
    });
});

describe("Method as.csv", function () {

    it("must correctly convert any parameters into CSV", function () {

        expect(pgp.as.csv()).toBe(""); // test undefined;
        expect(pgp.as.csv([])).toBe(""); // test empty array;
        expect(pgp.as.csv(null)).toBe("null"); // test null;
        expect(pgp.as.csv([null])).toBe("null"); // test null in array;
        expect(pgp.as.csv([undefined])).toBe("null"); // test undefined in array;
        expect(pgp.as.csv([null, undefined])).toBe("null,null"); // test combination of null + undefined in array;

        expect(pgp.as.csv(0)).toBe("0"); // test zero;
        expect(pgp.as.csv([0])).toBe("0"); // test zero in array;
        expect(pgp.as.csv(-123.456)).toBe("-123.456"); // test a float;
        expect(pgp.as.csv([-123.456])).toBe("-123.456"); // test a float in array;

        expect(pgp.as.csv(true)).toBe("TRUE"); // test boolean True;
        expect(pgp.as.csv([true])).toBe("TRUE"); // test boolean True in array;

        expect(pgp.as.csv(false)).toBe("FALSE"); // test boolean False;
        expect(pgp.as.csv([false])).toBe("FALSE"); // test boolean False in array;

        expect(pgp.as.csv("")).toBe("''"); // empty text;
        expect(pgp.as.csv([""])).toBe("''"); // empty text in array;
        expect(pgp.as.csv("simple text")).toBe("'simple text'"); // simple text;
        expect(pgp.as.csv("don't break")).toBe("'don''t break'"); // text with one single-quote symbol;
        expect(pgp.as.csv("test ''")).toBe("'test '''''"); // text with two single-quote symbols;

        expect(pgp.as.csv(dateSample)).toBe("'" + dateSample.toUTCString() + "'"); // test date;
        expect(pgp.as.csv([dateSample])).toBe("'" + dateSample.toUTCString() + "'"); // test date in array;

        // test a combination of all values types;
        expect(pgp.as.csv([12.34, true, "don't break", undefined, dateSample]))
            .toBe("12.34,TRUE,'don''t break',null,'" + dateSample.toUTCString() + "'");

        ////////////////////////////////
        // negative tests;

        expect(function () {
            pgp.as.csv([[]]);
        }).toThrow("Cannot convert parameter with index 0");

        expect(function () {
            pgp.as.csv({});
        }).toThrow("Cannot convert a value of type 'object'");

        expect(function () {
            pgp.as.csv([{}, 'hello']);
        }).toThrow("Cannot convert parameter with index 0");

        expect(function () {
            pgp.as.csv(function () {});
        }).toThrow("Cannot convert a value of type 'function'");

        expect(function () {
            pgp.as.csv(['hello', function () {}]);
        }).toThrow("Cannot convert parameter with index 1");

    });
});

describe("Method as.format", function () {

    it("must return a correctly formatted string or throw an error", function () {

        expect(function () {
            pgp.as.format();
        }).toThrow("Parameter 'query' must be a text string.");

        expect(function () {
            pgp.as.format(null);
        }).toThrow("Parameter 'query' must be a text string.");

        expect(function () {
            pgp.as.format(null, [1, 2, 3]);
        }).toThrow("Parameter 'query' must be a text string.");

        expect(function () {
            pgp.as.format(123);
        }).toThrow("Parameter 'query' must be a text string.");

        expect(function () {
            pgp.as.format("", [123]);
        }).toThrow("More values passed in array than variables in the query.");

        expect(function () {
            pgp.as.format("", 123);
        }).toThrow("No variable found in the query to replace with the passed value.");

        expect(function () {
            pgp.as.format("", null);
        }).toThrow("No variable found in the query to replace with the passed value.");

        expect(function () {
            pgp.as.format("$1", [{}]);
        }).toThrow("Cannot convert parameter with index 0");

        expect(function () {
            pgp.as.format("$1, $2", ['one', {}]);
        }).toThrow("Cannot convert parameter with index 1");

        expect(pgp.as.format("", [])).toBe("");
        expect(pgp.as.format("$1", [])).toBe("$1");
        expect(pgp.as.format("$1")).toBe("$1");
        expect(pgp.as.format("$1", null)).toBe("null");

        expect(pgp.as.format("$1", [undefined])).toBe("null");

        expect(pgp.as.format("$1", "one")).toBe("'one'");
        expect(pgp.as.format("$1", ["one"])).toBe("'one'");

        expect(pgp.as.format("$1, $1", "one")).toBe("'one', 'one'");

        expect(pgp.as.format("$1$1", "one")).toBe("'one''one'");

        expect(pgp.as.format("$1, $2, $3, $4", [true, -12.34, "text", dateSample])).toBe("TRUE, -12.34, 'text', '" + dateSample.toUTCString() + "'");

        expect(pgp.as.format("$1 $1, $2 $2, $1", [1, "two"])).toBe("1 1, 'two' 'two', 1"); // test for repeated variables;

        expect(pgp.as.format("Test: $1", ["don't break quotes!"])).toBe("Test: 'don''t break quotes!'");

        expect(function(){
            pgp.as.format("$1,$2", [{}, {}]);
        }).toThrow("Cannot convert parameter with index 0");

        // test that errors in type conversion are
        // detected and reported from left to right;
        expect(function(){
            pgp.as.format("$1, $2", [true, function () {}]);
        }).toThrow("Cannot convert parameter with index 1");

        // test that once a conversion issue is encountered,
        // the rest of parameters are not verified;
        expect(function(){
            pgp.as.format("$1,$2", [1, {}, 2, 3, 4, 5]);
        }).toThrow("Cannot convert parameter with index 1");

        // testing with lots of variables;
        var source = "", dest = "", params = [];
        for (var i = 1; i <= 1000; i++) {
            source += '$' + i;
            dest += i;
            params.push(i);
        }
        expect(pgp.as.format(source, params)).toBe(dest);

        // testing various cases with many variables:
        // - variables next to each other;
        // - variables not defined;
        // - variables are repeated;
        // - long variable names present;
        expect(pgp.as.format("$1$2,$3,$4,$5,$6,$7,$8,$9,$10$11,$12,$13,$14,$15,$1,$3", [1, 2, 'C', 'DDD', 'E', 'F', 'G', 'H', 'I', 88, 99, 'LLL']))
            .toBe("12,'C','DDD','E','F','G','H','I',8899,'LLL',$13,$14,$15,1,'C'");

        // test that $1 variable isn't confused with $12;
        expect(function(){
            pgp.as.format("$12", 123);
        }).toThrow("No variable found in the query to replace with the passed value.");

        // test that $1 variable isn't confused with $112
        expect(function(){
            pgp.as.format("$112", 123);
        }).toThrow("No variable found in the query to replace with the passed value.");

        // test that variable names are not confused for longer ones;
        expect(pgp.as.format("$11, $1, $111, $1", 123)).toBe("$11, 123, $111, 123");

        // test that variable names are not confused for longer ones,
        // even when they are right next to each other;
        expect(pgp.as.format("$11$1$111$1", 123)).toBe("$11123$111123");
    });

    it("must correctly format named parameters or throw an error", function () {
        // - correctly handles leading and trailing spaces;
        // - supports underscores and digits in names;
        // - can join variables values next to each other;
        // - converts all simple types correctly;
        // - replaces undefined variables with null;
        expect(pgp.as.format("${ name_},${d_o_b },${  _active__},${ file_5A  }${__balance}", {
            name_: "John O'Connor",
            d_o_b: dateSample,
            _active__: true,
            __balance: -123.45
        })).toBe("'John O''Connor','" + dateSample.toUTCString() + "',TRUE,null-123.45");

    });
});
