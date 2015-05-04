var pgp = require('../lib/index')();

var dateSample = new Date();

// common error messages;
var errors = {
    rawNull: function () {
        return "Values null/undefined cannot be used as raw text.";
    }
};

var func = function () {
};

var userObj = {
    name: "John O'Connor",
    dob: new Date(1980, 5, 15),
    active: true
};

describe("Method as.bool", function () {
    it("must correctly convert any boolean", function () {
        expect(pgp.as.bool()).toBe("null");
        expect(pgp.as.bool(null)).toBe("null");
        expect(pgp.as.bool(0)).toBe("false");
        expect(pgp.as.bool(false)).toBe("false");
        expect(pgp.as.bool(1)).toBe("true");
        expect(pgp.as.bool(true)).toBe("true");
        expect(pgp.as.bool(10)).toBe("true");
        expect(pgp.as.bool(-10)).toBe("true");
        expect(pgp.as.bool([])).toBe("true");
        expect(pgp.as.bool({})).toBe("true");
        expect(pgp.as.bool(function () {
        })).toBe("true");
        expect(pgp.as.bool("false")).toBe("true");
    });
});

describe("Method as.number", function () {
    it("must correctly convert any number", function () {
        expect(pgp.as.number()).toBe("null");
        expect(pgp.as.number(null)).toBe("null");
        expect(pgp.as.number(0)).toBe("0");
        expect(pgp.as.number(1)).toBe("1");
        expect(pgp.as.number(1234567890)).toBe("1234567890");
        expect(pgp.as.number(-123.456)).toBe("-123.456");
        expect(pgp.as.number(NaN)).toBe("'NaN'");
        expect(pgp.as.number(1 / 0)).toBe("'+Infinity'");
        expect(pgp.as.number(-1 / 0)).toBe("'-Infinity'");
    });

    it("must correctly reject invalid numbers", function () {

        var err = " is not a number.";
        expect(function(){
            pgp.as.number('');
        }).toThrow("''" + err);

        expect(function(){
            pgp.as.number([1,2]);
        }).toThrow("'1,2'" + err);

        expect(function(){
            pgp.as.number(func);
        }).toThrow("'" + func + "'" + err);

    });

});

describe("Method as.text", function () {
    it("must correctly convert any text", function () {

        expect(pgp.as.text()).toBe("null");

        expect(function () {
            pgp.as.text(undefined, true);
        }).toThrow(errors.rawNull());

        expect(pgp.as.text(null)).toBe("null");

        expect(function () {
            pgp.as.text(null, true);
        }).toThrow(errors.rawNull());

        expect(pgp.as.text("")).toBe("''");
        expect(pgp.as.text("", true)).toBe(""); // raw-text test;

        expect(pgp.as.text("some text")).toBe("'some text'");
        expect(pgp.as.text("some text", true)).toBe("some text"); // raw-text test;

        expect(pgp.as.text("'starts with quote")).toBe("'''starts with quote'");
        expect(pgp.as.text("'starts with quote", true)).toBe("'starts with quote"); // raw-text test;

        expect(pgp.as.text("ends with quote'")).toBe("'ends with quote'''");
        expect(pgp.as.text("ends with quote'", true)).toBe("ends with quote'"); // raw-text test;

        expect(pgp.as.text("has '' two quotes")).toBe("'has '''' two quotes'");
        expect(pgp.as.text("has '' two quotes", true)).toBe("has '' two quotes"); // raw-text test;

        expect(pgp.as.text("'")).toBe("''''");
        expect(pgp.as.text("'", true)).toBe("'"); // raw-text test;

        expect(pgp.as.text("''")).toBe("''''''");
        expect(pgp.as.text("''", true)).toBe("''"); // raw-text test;

        expect(pgp.as.text(-123.456)).toBe("'-123.456'");
        expect(pgp.as.text(true)).toBe("'true'");
        expect(pgp.as.text(false)).toBe("'false'");
        expect(pgp.as.text(dateSample)).toBe("'" + dateSample.toString() + "'");

        expect(pgp.as.text([])).toBe("''");
        expect(pgp.as.text([], true)).toBe(""); // raw-text test;

        expect(pgp.as.text([1, "hello"])).toBe("'1,hello'"); // converts string as is;
        expect(pgp.as.text([1, "hello"], true)).toBe("1,hello"); // converts string as is;

        expect(pgp.as.text({})).toBe("'[object Object]'");
        expect(pgp.as.text(func)).toBe("'" + func.toString() + "'");
    });
});

describe("Method as.date", function () {
    it("must correctly convert any date", function () {

        expect(pgp.as.date()).toBe("null");

        expect(function () {
            pgp.as.date(undefined, true);
        }).toThrow(errors.rawNull());

        expect(pgp.as.date(null)).toBe("null");

        expect(function () {
            pgp.as.date(null, true);
        }).toThrow(errors.rawNull());

        expect(function () {
            pgp.as.date("");
        }).toThrow("'' is not a Date object.");

        expect(function () {
            pgp.as.date("bla-bla");
        }).toThrow("'bla-bla' is not a Date object.");

        expect(function () {
            pgp.as.date(123);
        }).toThrow("'123' is not a Date object.");

        expect(function () {
            pgp.as.date(func);
        }).toThrow("'" + func.toString() + "' is not a Date object.");

        expect(function () {
            pgp.as.date([]);
        }).toThrow("'' is not a Date object.");

        expect(function () {
            pgp.as.date({});
        }).toThrow("'[object Object]' is not a Date object.");

        expect(pgp.as.date(dateSample)).toBe("'" + dateSample.toUTCString() + "'");

        expect(pgp.as.date(dateSample, true)).toBe(dateSample.toUTCString());
    });
});

describe("Method as.csv", function () {

    it("must correctly convert any parameters into CSV", function () {

        ////////////////////////////////
        // positive tests;

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

        expect(pgp.as.csv(true)).toBe("true"); // test boolean True;
        expect(pgp.as.csv([true])).toBe("true"); // test boolean True in array;

        expect(pgp.as.csv(false)).toBe("false"); // test boolean False;
        expect(pgp.as.csv([false])).toBe("false"); // test boolean False in array;

        expect(pgp.as.csv("")).toBe("''"); // empty text;
        expect(pgp.as.csv([""])).toBe("''"); // empty text in array;
        expect(pgp.as.csv("simple text")).toBe("'simple text'"); // simple text;
        expect(pgp.as.csv("don't break")).toBe("'don''t break'"); // text with one single-quote symbol;
        expect(pgp.as.csv("test ''")).toBe("'test '''''"); // text with two single-quote symbols;

        expect(pgp.as.csv(dateSample)).toBe("'" + dateSample.toUTCString() + "'"); // test date;
        expect(pgp.as.csv([dateSample])).toBe("'" + dateSample.toUTCString() + "'"); // test date in array;

        expect(pgp.as.csv([userObj])).toBe(pgp.as.text(JSON.stringify(userObj)));

        // test a combination of all possible types;
        expect(pgp.as.csv([12.34, true, "don't break", null, undefined, userObj, dateSample, [1, 2]]))
            .toBe("12.34,true,'don''t break',null,null," + pgp.as.text(JSON.stringify(userObj)) + ",'" + dateSample.toUTCString() + "',array[1,2]");

        // test array-type as a parameter;
        expect(pgp.as.csv([1, [2, 3], 4])).toBe("1,array[2,3],4");
        expect(pgp.as.csv([1, [['two'], ['three']], 4])).toBe("1,array[['two'],['three']],4");

        expect(pgp.as.csv(function () {
            return 'one';
        })).toBe("'one'");

        expect(pgp.as.csv(function () {
            return ['one', 'two'];
        })).toBe("array['one','two']");

    });
});

describe("Method as.json", function () {

    it("must correctly convert any object into JSON", function () {
        expect(pgp.as.json()).toBe("null");
        expect(pgp.as.json(null)).toBe("null");
        expect(pgp.as.json({})).toBe("'" + JSON.stringify({}) + "'");
        expect(pgp.as.json(userObj)).toBe(pgp.as.text(JSON.stringify(userObj)));
        expect(function () {
            pgp.as.json(null, true);
        }).toThrow(errors.rawNull());
        expect(function () {
            pgp.as.json(undefined, true);
        }).toThrow(errors.rawNull());
    });
});

describe("Method as.array", function () {

    it("must correctly convert an empty array or value", function () {
        expect(pgp.as.array()).toBe('null');
        expect(pgp.as.array(null)).toBe('null');
        expect(pgp.as.array([])).toBe("array[]");
    });

    it("must correctly convert multi-dimension arrays", function () {
        expect(pgp.as.array([[1, 2], ['three', 'four', [5, 'six', true]]]))
            .toBe("array[[1,2],['three','four',[5,'six',true]]]");
    });

    // 20-dimension test;
    it("must correctly convert arrays of any depth", function () {
        expect(pgp.as.array([[[[[[[[[[[[[[[[[[[[20]]]]]]]]]]]]]]]]]]]]))
            .toBe("array[[[[[[[[[[[[[[[[[[[[20]]]]]]]]]]]]]]]]]]]]");
    });

    it("must correctly reject invalid parameters", function () {

        var err = " is not an Array object.";
        expect(function(){
            pgp.as.array(123);
        }).toThrow("'123'" + err);

        expect(function(){
            pgp.as.array('');
        }).toThrow("''" + err);

    });

});

describe("Method as.func", function () {

    it("must correctly convert any function return", function () {
        expect(pgp.as.func()).toBe('null');
        expect(pgp.as.func(null)).toBe('null');

        expect(pgp.as.func(function () {
            return 1;
        })).toBe("1");

        expect(pgp.as.func(function () {
            return [1, 2, 3];
        })).toBe("array[1,2,3]");

        expect(pgp.as.func(function () {
        })).toBe("null");

        expect(pgp.as.func(function () {
            return null;
        })).toBe("null");

        expect(pgp.as.func(function () {
            return func()
            {
                return func()
                {
                }
            }
        })).toBe("null");

        expect(pgp.as.func(function () {
            return function () {
                return function () {
                    return true;
                }
            }
        })).toBe("true");

        expect(pgp.as.format("$1,$1^", function () {
            return function () {
                return 'one';
            };
        })).toBe("'one',one");

        // testing function-object context;
        expect(pgp.as.format("${summ}", {
            val1: 1,
            val2: 2,
            summ: function () {
                return this.val1 + this.val2; // `this` must work here;
            }
        })).toBe("3");

        /////////////////////////////
        // negative tests;

        expect(function () {
            pgp.as.func(1);
        }).toThrow("'1' is not a function.");

        expect(function () {
            pgp.as.func(undefined, true);
        }).toThrow("Values null/undefined cannot be used as raw text.");

        expect(function () {
            pgp.as.func(null, true);
        }).toThrow("Values null/undefined cannot be used as raw text.");

        expect(function () {
            pgp.as.func(function () {
                throw "internal error";
            });
        }).toThrow("internal error");

        expect(function () {
            pgp.as.func(func, false, '');
        }).toThrow("'' is not an object.");

        expect(function () {
            pgp.as.func(func, false, 0);
        }).toThrow("'0' is not an object.");

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
            pgp.as.format("$1,$2", [1, 2, 3]);
        }).toThrow("No variable $3 found for the value with index 2");

        expect(function () {
            pgp.as.format("", 123);
        }).toThrow("No variable $1 found to replace with the value passed.");

        expect(function () {
            pgp.as.format("", null);
        }).toThrow("No variable $1 found to replace with the value passed.");

        expect(pgp.as.format("", [])).toBe("");

        expect(pgp.as.format("$1", [])).toBe("$1");
        expect(pgp.as.format("$1^", [])).toBe("$1^");

        expect(pgp.as.format("$1")).toBe("$1");
        expect(pgp.as.format("$1", null)).toBe("null");

        expect(pgp.as.format("$1", [undefined])).toBe("null");

        expect(pgp.as.format("$1", "one")).toBe("'one'");
        expect(pgp.as.format("$1^", "one")).toBe("one");

        expect(pgp.as.format("$1", ["one"])).toBe("'one'");
        expect(pgp.as.format("$1^", ["one"])).toBe("one");

        expect(pgp.as.format("$1, $1", "one")).toBe("'one', 'one'");

        expect(pgp.as.format("$1$1", "one")).toBe("'one''one'");
        expect(pgp.as.format("$1^$1^", "one")).toBe("oneone");

        expect(pgp.as.format("$1", [userObj])).toBe(pgp.as.text(JSON.stringify(userObj)));
        expect(pgp.as.format("$1^", [userObj])).toBe(JSON.stringify(userObj));

        expect(pgp.as.format("$1, $2, $3, $4", [true, -12.34, "text", dateSample])).toBe("true, -12.34, 'text', '" + dateSample.toUTCString() + "'");

        expect(pgp.as.format("$1 $1, $2 $2, $1", [1, "two"])).toBe("1 1, 'two' 'two', 1"); // test for repeated variables;

        expect(pgp.as.format("Test: $1", ["don't break quotes!"])).toBe("Test: 'don''t break quotes!'");

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
        expect(function () {
            pgp.as.format("$12", 123);
        }).toThrow("No variable $1 found to replace with the value passed.");

        // test that $1 variable isn't confused with $112
        expect(function () {
            pgp.as.format("$112", 123);
        }).toThrow("No variable $1 found to replace with the value passed.");

        // test that variable names are not confused for longer ones;
        expect(pgp.as.format("$11, $1, $111, $1", 123)).toBe("$11, 123, $111, 123");

        // test that variable names are not confused for longer ones,
        // even when they are right next to each other;
        expect(pgp.as.format("$11$1$111$1", 123)).toBe("$11123$111123");

        expect(pgp.as.format("$1, $2", [
            'one', [2, 3]
        ])).toBe("'one', array[2,3]");
    });

    it("must correctly format named parameters or throw an error", function () {
        // - correctly handles leading and trailing spaces;
        // - supports underscores, digits and '$' in names;
        // - can join variables values next to each other;
        // - converts all simple types correctly;
        expect(pgp.as.format("${ $Nam$E_},${d_o_b },${  _active__},${_$_Balance}", {
            $Nam$E_: "John O'Connor",
            d_o_b: dateSample,
            _active__: true,
            _$_Balance: -123.45
        })).toBe("'John O''Connor','" + dateSample.toUTCString() + "',true,-123.45");

        // test that even one-symbol, special-named properties work correctly;
        expect(pgp.as.format("${$}${_}${a}", {
            $: 1,
            _: 2,
            a: 3
        })).toBe("123");

        // Both null and undefined properties are formatted as null;
        expect(pgp.as.format("${empty1}, ${empty2}", {
            empty1: null,
            empty2: undefined
        })).toBe("null, null");

        // when a property is missing in the object, an error is thrown;
        expect(function () {
            pgp.as.format("${prop1},${prop2}", {
                prop1: 'hello'
            });
        }).toThrow("Property 'prop2' doesn't exist.");

        // testing case sensitivity - Positive;
        expect(pgp.as.format("${propVal}${PropVal}${propVAL}${PropVAL}", {
            propVal: 1,
            PropVal: 2,
            propVAL: 3,
            PropVAL: 4
        })).toBe("1234");

        // testing array-as-property formatting;
        expect(pgp.as.format("${prop1}, ${prop2}", {
            prop1: 'one',
            prop2: [2, ['three']]
        })).toBe("'one', array[2,['three']]");

        // testing case sensitivity - Negative;
        expect(function () {
            pgp.as.format("${PropName}", {
                propName: 'hello'
            });
        }).toThrow("Property 'PropName' doesn't exist.");

    });

    it("must correctly inject raw-text variables", function () {

        expect(pgp.as.format("${name},${name^},${name},${name^}", {
            name: 'me'
        })).toBe("'me',me,'me',me");

        expect(pgp.as.format("$1,$1^,$1,$1^", 'hello')).toBe("'hello',hello,'hello',hello");

        expect(pgp.as.format("$1,$2,$1^,$2^", ['one', 'two']))
            .toBe("'one','two',one,two");

        expect(pgp.as.format("$1^ $2^ $1", ["Don't break", 'this']))
            .toBe("Don't break this 'Don''t break'");

        expect(pgp.as.format("$1^,$1", dateSample))
            .toBe(dateSample.toUTCString() + ",'" + dateSample.toUTCString() + "'");

        expect(function () {
            pgp.as.format("$1^", null);
        }).toThrow(errors.rawNull());

        expect(function () {
            pgp.as.format("$1^", [null]);
        }).toThrow(errors.rawNull());

        expect(function () {
            pgp.as.format("$1^", [undefined]);
        }).toThrow(errors.rawNull());

    });
});
