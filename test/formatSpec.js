'use strict';

var path = require('path');
var pgp = require('../lib/index');

var dateSample = new Date();

// common error messages;
var errors = {
    rawNull: function () {
        return "Values null/undefined cannot be used as raw text.";
    },
    range: function (variable, length) {
        return "Variable " + variable + " out of range. Parameters array length: " + length;
    },
    buffer: function (value) {
        return "'" + value + "' is not a Buffer object."
    }
};

var sqlSimple = getPath('./sql/simple.sql');
var sqlParams = getPath('./sql/params.sql');

function getPath(file) {
    return path.join(__dirname, file);
}

var dummy = function () {
};

var userObj = {
    name: "John O'Connor",
    dob: new Date(1980, 5, 15),
    active: true
};

describe("Method as.buffer", function () {

    describe("Positive:", function () {
        var data = new Buffer([1, 2, 3]);
        var hex = "\\x010203";

        it("must hex-format data", function () {
            expect(pgp.as.buffer(data)).toBe("'" + hex + "'");
            expect(pgp.as.buffer(data, true)).toBe(hex);
        });

        it("must format null/undefined correctly", function () {
            expect(pgp.as.buffer()).toBe('null');
            expect(pgp.as.buffer(null)).toBe('null');
        });

        it("must format values correctly", function () {
            expect(pgp.as.format("$1", data)).toBe("'" + hex + "'");
            expect(pgp.as.format("$1", [data])).toBe("'" + hex + "'");
        });

        it("must format raw values correctly", function () {
            expect(pgp.as.format("$1^", data)).toBe(hex);
            expect(pgp.as.format("$1^", [data])).toBe(hex);
        });

        it("must format open values correctly", function () {
            expect(pgp.as.format("$1#", data)).toBe(hex);
            expect(pgp.as.format("$1:value", [data])).toBe(hex);
        });

        it("must work in any other context", function () {
            var input = [23, new Buffer([1, 2, 3]), "Hello"], output = "23,'\\x010203','Hello'",
                simple = new Buffer([1, 2, 3]);
            expect(pgp.as.csv(simple)).toBe("'\\x010203'");
            expect(pgp.as.format("$1:json", [simple])).toEqual("'" + JSON.stringify(simple) + "'");
            expect(pgp.as.csv(input)).toBe(output);
            expect(pgp.as.format("$1,$2,$3", input)).toBe(output);
            expect(pgp.as.format("$1:csv", [input])).toBe(output);
        });
    });

    describe("Negative:", function () {
        it("must throw error on invalid data", function () {
            expect(function () {
                pgp.as.buffer(123);
            }).toThrow(new TypeError(errors.buffer(123)));

            expect(function () {
                pgp.as.buffer(null, true);
            }).toThrow(new Error(errors.rawNull()));

            expect(function () {
                pgp.as.buffer(undefined, true);
            }).toThrow(new Error(errors.rawNull()));

        });

    });
});

describe("Method as.bool", function () {

    it("must correctly convert any boolean-like value", function () {
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
        expect(pgp.as.bool("false")).toBe("true");
    });

    it("must correctly resolve functions", function () {
        expect(pgp.as.bool(dummy)).toBe("null");
        expect(pgp.as.bool(function () {
            return null;
        })).toBe("null");
        expect(pgp.as.bool(function () {
            return true;
        })).toBe("true");
        expect(pgp.as.bool(function () {
            return false;
        })).toBe("false");
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

    it("must correctly resolve functions", function () {
        expect(pgp.as.number(dummy)).toBe("null");
        expect(pgp.as.number(function () {
            return null;
        })).toBe("null");
        expect(pgp.as.number(function () {
            return 123;
        })).toBe("123");
        expect(pgp.as.number(function () {
            return 0;
        })).toBe("0");
        expect(pgp.as.number(function () {
            return -1 / 0;
        })).toBe("'-Infinity'");

        // deep-call test:
        expect(pgp.as.number(function () {
            return function () {
                return function () {
                    return 123;
                }
            };
        })).toBe("123");

    });

    it("must correctly reject invalid values", function () {

        var err = " is not a number.";
        expect(function () {
            pgp.as.number('');
        }).toThrow(new Error("''" + err));

        expect(function () {
            pgp.as.number([1, 2]);
        }).toThrow(new Error("'1,2'" + err));

    });

});

describe("Method as.text", function () {
    it("must correctly convert any text", function () {

        expect(pgp.as.text()).toBe("null");
        expect(pgp.as.text(null)).toBe("null");

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
    });

    it("must correctly resolve functions", function () {

        expect(pgp.as.text(dummy)).toBe("null");

        expect(pgp.as.text(function () {
            return null;
        })).toBe("null");

        expect(pgp.as.text(function () {
            return 'hello';
        })).toBe("'hello'");

    });

    it("must correctly respond to invalid raw-text requests", function () {
        expect(function () {
            pgp.as.text(undefined, true);
        }).toThrow(new Error(errors.rawNull()));

        expect(function () {
            pgp.as.text(null, true);
        }).toThrow(new Error(errors.rawNull()));

    });

});

describe("Method as.value", function () {
    it("must correctly convert any type", function () {
        expect(pgp.as.value(1)).toBe("1");
        expect(pgp.as.value(true)).toBe("true");
    });
    it("must correctly escape text", function () {
        expect(pgp.as.value("text")).toBe("text");
        expect(pgp.as.value("te'xt")).toBe("te''xt");
    });

    it("must correctly format values", function () {
        expect(pgp.as.format('$1:value', 'val')).toBe('val');
        expect(pgp.as.format('$1#', 'val')).toBe('val');
        expect(pgp.as.format('$1#', "val'ue")).toBe("val''ue");
    });

    it("must throw on null/undefined", function () {
        var err = "Open values cannot be null or undefined.";
        expect(function () {
            pgp.as.value();
        }).toThrow(new TypeError(err));

        expect(function () {
            pgp.as.format('$1#', [null]);
        }).toThrow(new TypeError(err));

        expect(function () {
            pgp.as.format('$1#', [undefined]);
        }).toThrow(new TypeError(err));
    });

});

describe("Method as.date", function () {
    it("must correctly convert any date", function () {
        expect(pgp.as.date()).toBe("null");
        expect(pgp.as.date(null)).toBe("null");
        expect(pgp.as.date(dateSample)).toBe("'" + dateSample.toUTCString() + "'");
        expect(pgp.as.date(dateSample, true)).toBe(dateSample.toUTCString());
    });

    it("must correctly resolve functions", function () {
        expect(pgp.as.date(dummy)).toBe("null");
        expect(pgp.as.date(function () {
            return null;
        })).toBe("null");
        expect(pgp.as.date(function () {
            return dateSample;
        }, true)).toBe(dateSample.toUTCString());
    });

    it("must correctly reject invalid requests", function () {

        expect(function () {
            pgp.as.date(undefined, true);
        }).toThrow(new Error(errors.rawNull()));

        expect(function () {
            pgp.as.date(null, true);
        }).toThrow(new Error(errors.rawNull()));

        expect(function () {
            pgp.as.date("");
        }).toThrow(new Error("'' is not a Date object."));

        expect(function () {
            pgp.as.date("bla-bla");
        }).toThrow(new Error("'bla-bla' is not a Date object."));

        expect(function () {
            pgp.as.date(123);
        }).toThrow(new Error("'123' is not a Date object."));

        expect(function () {
            pgp.as.date([]);
        }).toThrow(new Error("'' is not a Date object."));

        expect(function () {
            pgp.as.date({});
        }).toThrow(new Error("'[object Object]' is not a Date object."));

    });

});

describe("Method as.csv", function () {

    it("must correctly convert any parameters into CSV", function () {

        ////////////////////////////////
        // positive tests;

        expect(pgp.as.csv()).toBe(""); // test undefined;
        expect(pgp.as.csv([])).toBe(""); // test empty array;
        expect(pgp.as.csv([[]])).toBe("array[]"); // test empty array;
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
    });

    it("must correctly resolve functions", function () {

        expect(pgp.as.csv(dummy)).toBe("");

        expect(pgp.as.csv(function () {
            return null;
        })).toBe("null");

        expect(pgp.as.csv(function () {
            return 'one';
        })).toBe("'one'");

        expect(pgp.as.csv(function () {
            return ['one', 'two', [1, 2, 3]];
        })).toBe("'one','two',array[1,2,3]");
    });

});

describe("Method as.json", function () {

    it("must correctly convert any object into JSON", function () {
        expect(pgp.as.json()).toBe("null");
        expect(pgp.as.json(null)).toBe("null");
        expect(pgp.as.json({})).toBe("'" + JSON.stringify({}) + "'");
        expect(pgp.as.json(userObj)).toBe(pgp.as.text(JSON.stringify(userObj)));
    });

    it("must correctly resolve functions", function () {

        expect(pgp.as.json(dummy)).toBe("null");
        expect(pgp.as.json(function () {
            return null;
        })).toBe("null");

        expect(pgp.as.json(function () {
            return userObj;
        })).toBe(pgp.as.text(JSON.stringify(userObj)));
    });

    it("must correctly reject invalid requests", function () {
        expect(function () {
            pgp.as.json(null, true);
        }).toThrow(new Error(errors.rawNull()));
        expect(function () {
            pgp.as.json(undefined, true);
        }).toThrow(new Error(errors.rawNull()));
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

    it("must correctly resolve functions", function () {

        expect(pgp.as.array(dummy)).toBe("null");

        expect(pgp.as.array(function () {
            return null;
        })).toBe("null");

        expect(pgp.as.array(function () {
            return [1, 2, 3];
        })).toBe("array[1,2,3]");

    });

    it("must correctly reject invalid requests", function () {

        var err = " is not an Array object.";
        expect(function () {
            pgp.as.array(123);
        }).toThrow(new Error("'123'" + err));

        expect(function () {
            pgp.as.array('');
        }).toThrow(new Error("''" + err));

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
            return 'hello';
        }, true)).toBe("hello");

        expect(pgp.as.func(function () {
            return dummy()
            {
                return dummy()
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

        // the same object context must be
        // passed into every sub-function;
        expect(pgp.as.func(function () {
            return function () {
                return function () {
                    return this.test;
                }
            }
        }, false, {
            test: "Hello!"
        })).toBe("'Hello!'");

        /////////////////////////////
        // negative tests;

        expect(function () {
            pgp.as.func(1);
        }).toThrow(new Error("'1' is not a function."));

        expect(function () {
            pgp.as.func(undefined, true);
        }).toThrow(new Error("Values null/undefined cannot be used as raw text."));

        expect(function () {
            pgp.as.func(null, true);
        }).toThrow(new Error("Values null/undefined cannot be used as raw text."));

        expect(function () {
            pgp.as.func(function () {
                throw "internal error";
            });
        }).toThrow("internal error");

        expect(function () {
            pgp.as.func(dummy, false, '');
        }).toThrow(new Error("'' is not an object."));

        expect(function () {
            pgp.as.func(dummy, false, 0);
        }).toThrow(new Error("'0' is not an object."));

    });
});

describe("Method as.name", function () {

    describe("with an empty or non-string", function () {
        it("must throw na error", function () {
            expect(function () {
                pgp.as.name();
            }).toThrow(new TypeError('Invalid sql name: undefined'));
            expect(function () {
                pgp.as.name(null);
            }).toThrow(new TypeError('Invalid sql name: null'));
            expect(function () {
                pgp.as.name(123);
            }).toThrow(new TypeError('Invalid sql name: 123'));
            expect(function () {
                pgp.as.name('');
            }).toThrow(new TypeError('Invalid sql name: ""'));
        });
    });

    describe("with regular names", function () {
        it("must return the right name", function () {
            expect(pgp.as.name('a')).toBe('"a"');
            expect(pgp.as.name(' ')).toBe('" "');
            expect(pgp.as.name('\t')).toBe('"\t"');
            expect(pgp.as.name('"')).toBe('""""');
            expect(pgp.as.name('""')).toBe('""""""');
        });
    });

    describe("with a function", function () {
        function getName() {
            return "name";
        }

        it("must use the function value", function () {
            expect(pgp.as.name(getName)).toBe('"name"');
        });
    });

    describe("with *", function () {
        it("must return the original string", function () {
            expect(pgp.as.name('*')).toBe('*');
            expect(pgp.as.name(' \t *\t ')).toBe(' \t *\t ');
        });
    });

});

describe("Method as.format", function () {

    it("must return a correctly formatted string", function () {

        expect(pgp.as.format("", [])).toBe("");

        expect(pgp.as.format("$1")).toBe("$1");
        expect(pgp.as.format("$1", null)).toBe("null");

        expect(pgp.as.format("$1", [undefined])).toBe("null");

        expect(pgp.as.format("$1", "one")).toBe("'one'");
        expect(pgp.as.format("$1^", "one")).toBe("one");
        expect(pgp.as.format("$1:raw", "one")).toBe("one");

        expect(pgp.as.format("$1", ["one"])).toBe("'one'");
        expect(pgp.as.format("$1^", ["one"])).toBe("one");
        expect(pgp.as.format("$1:raw", ["one"])).toBe("one");

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
        expect(pgp.as.format("$1$2,$3,$4,$5,$6,$7,$8,$9,$10$11,$12,$13,$14,$15,$1,$3", [1, 2, 'C', 'DDD', 'E', 'F', 'G', 'H', 'I', 88, 99, 'LLL'], {partial: true}))
            .toBe("12,'C','DDD','E','F','G','H','I',8899,'LLL',$13,$14,$15,1,'C'");

        // test that variable names are not confused for longer ones;
        expect(pgp.as.format("$11, $1, $111, $1", 123)).toBe("$11, 123, $111, 123");

        // test that variable names are not confused for longer ones,
        // even when they are right next to each other;
        expect(pgp.as.format("$11$1$111$1", 123)).toBe("$11123$111123");

        expect(pgp.as.format("$1, $2", [
            'one', [2, 3]
        ])).toBe("'one', array[2,3]");

        // check that gaps are handled correctly;
        expect(pgp.as.format("$2, $4, $6", [1, 2, 3, 4, 5], {partial: true})).toBe("2, 4, $6");

        ///////////////////////////////////////////////////
        // test that inserting strings with variable names
        // in them doesn't effect formatting;

        // a) for regular variables;
        expect(pgp.as.format("$1, $2, $3^, $4", ["$2", "$3", "$2,$3"], {partial: true})).toBe("'$2', '$3', $2,$3, $4");

        // b) for the Named Parameters;
        expect(pgp.as.format("${one}, ${two}, ${three^}, $four", {
                one: "${two}",
                two: "${three}",
                three: "${two},${three}"
            }
        )).toBe("'${two}', '${three}', ${two},${three}, $four");

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

    });

    it("must correctly reject invalid requests", function () {

        var errEmptyString = "Parameter 'query' must be a text string.";

        expect(function () {
            pgp.as.format();
        }).toThrow(new Error(errEmptyString));

        expect(function () {
            pgp.as.format(null);
        }).toThrow(new Error(errEmptyString));

        expect(function () {
            pgp.as.format(null, [1, 2, 3]);
        }).toThrow(new Error(errEmptyString));

        expect(function () {
            pgp.as.format(123);
        }).toThrow(new Error(errEmptyString));

        expect(function () {
            pgp.as.format(function () {
                return '';
            }, dummy)
        }).toThrow(new Error(errEmptyString));

        expect(function () {
            pgp.as.format("$1^", null);
        }).toThrow(new Error(errors.rawNull()));

        expect(function () {
            pgp.as.format("$1^", [null]);
        }).toThrow(new Error(errors.rawNull()));

        expect(function () {
            pgp.as.format("$1^", [undefined]);
        }).toThrow(new Error(errors.rawNull()));

        expect(function () {
            pgp.as.format("$1", []);
        }).toThrow(new RangeError(errors.range("$1", 0)));

        expect(function () {
            pgp.as.format("$3", [1, 2]);
        }).toThrow(new RangeError(errors.range("$3", 2)));

    });

    describe("formatting options", function () {

        describe("partial", function () {
            it("must skip missing variables", function () {
                expect(pgp.as.format("$1", [], {partial: true})).toBe("$1");
                expect(pgp.as.format("$1^", [], {partial: true})).toBe("$1^");
                expect(pgp.as.format("$1:raw", [], {partial: true})).toBe("$1:raw");

            });
        });

        describe("default", function () {
            it("must replace missing variables", function () {
                expect(pgp.as.format("$1, $2", [1], {default: undefined})).toBe("1, null");
                expect(pgp.as.format("$1, $2", [1], {default: null})).toBe("1, null");
                expect(pgp.as.format("${present}, ${missing}", {present: 1}, {default: 2})).toBe("1, 2");
            });
            it("must invoke a callback correctly", function () {
                var value, context, param;

                function cb(v, p) {
                    context = this;
                    value = v;
                    param = p;
                    return 123;
                }

                var arr = ['hi'];
                expect(pgp.as.format("$1, $2", arr, {default: cb})).toBe("'hi', 123");
                expect(context === arr).toBe(true);
                expect(param === arr).toBe(true);
                expect(value).toBe(1);

                var obj = {first: 'f'};
                expect(pgp.as.format("${first}, ${  second^ \t}", obj, {default: cb})).toBe("'f', 123");
                expect(context === obj).toBe(true);
                expect(param === obj).toBe(true);
                expect(value).toBe('second');

            });
        });

    });

    describe("QueryFile - positive", function () {
        it("must format the object", function () {
            var qf = new pgp.QueryFile(sqlParams, {debug: false, minify: true});
            expect(pgp.as.format(qf, {
                column: 'col',
                schema: 'sc',
                table: 'tab'
            })).toBe('SELECT "col" FROM "sc"."tab"');
        });

        it("must format the type as a parameter", function () {
            var qf = new pgp.QueryFile(sqlSimple, {debug: false, minify: true});
            expect(pgp.as.format('$1', [qf])).toBe("'select 1;'");
            expect(pgp.as.format('$1^', qf)).toBe("select 1;");
            expect(pgp.as.format('$1#', qf)).toBe("select 1;");
        });

    });

    describe("QueryFile - negative", function () {
        it("must throw QueryFileError", function () {
            var error1, error2, qf = new pgp.QueryFile('bla-bla');
            try {
                pgp.as.format(qf);
            } catch (e) {
                error1 = e;
            }
            try {
                pgp.as.format('$1', [qf]);
            } catch (e) {
                error2 = e;
            }
            expect(error1 instanceof pgp.errors.QueryFileError).toBe(true);
            expect(error2 instanceof pgp.errors.QueryFileError).toBe(true);
        });
    });

});

describe("Named Parameters", function () {

    it("must recognize all supported symbols", function () {
        expect(pgp.as.format("${one},$(two),$[three],$<four>,$/five/", {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5
        })).toBe("1,2,3,4,5");
    });

    it("must ignore mixed open-close symbols", function () {
        var openers = '{([</', closers = '})]>/';
        for (var i = 0; i < openers.length; i++) {
            for (var k = 0; k < closers.length; k++) {
                var txt = '$' + openers[i] + 'value' + closers[k];
                var s = pgp.as.format(txt, {
                    value: 'hello'
                });
                if (i === k) {
                    expect(s).toBe("'hello'");
                } else {
                    expect(s).toBe(txt);
                }
            }
        }

    });

    it("must ignore internal spaces", function () {
        expect(pgp.as.format("${  one  },$(  two  ),$[  three  ],$<  four  >,$/  five  /", {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5
        })).toBe("1,2,3,4,5");
    });

    it("must support short property names", function () {
        expect(pgp.as.format("${$}$(_)$[a]$< _$>$/$$ /", {
            $: 1,
            _: 2,
            a: 3,
            _$: 4,
            $$: 5
        })).toBe("12345");
    });

    it("must support digit-only property names", function () {
        expect(pgp.as.format("${1}, $(2), $[5^]", {
            1: 'one',
            2: 'two',
            5: 'five'
        })).toBe("'one', 'two', five");
    });

    it("must recognize case difference", function () {
        expect(pgp.as.format("${value},$(Value),$[VALUE],$<valuE>,$/vaLue/", {
            value: 1,
            Value: 2,
            VALUE: 3,
            valuE: 4,
            vaLue: 5
        })).toBe("1,2,3,4,5");

        // Negative;
        expect(function () {
            pgp.as.format("$/propName/$(PropName)", {
                propName: undefined
            });
        }).toThrow(new Error("Property 'PropName' doesn't exist."));

    });

    it("must allow partial replacements", function () {
        expect(pgp.as.format("${first}, ${ second  }, ${third}",
            {
                first: 'one',
                third: 'three'
            }, {partial: true}))
            .toBe("'one', ${ second  }, 'three'");
    });

    it("must ignore invalid-formatted variables", function () {
        expect(pgp.as.format("$()", {})).toBe("$()");
        expect(pgp.as.format("$((test))", {})).toBe("$((test))");
        expect(pgp.as.format("${{test}}", {})).toBe("${{test}}");
        expect(pgp.as.format("$({test})", {})).toBe("$({test})");
        expect(pgp.as.format("$(^test)", {})).toBe("$(^test)");
        expect(pgp.as.format("${^test}", {})).toBe("${^test}");
        expect(pgp.as.format("$(test^^)", {})).toBe("$(test^^)");
        expect(pgp.as.format("${test^^}", {})).toBe("${test^^}");
    });

    it("must convert all types correctly", function () {
        expect(pgp.as.format("${one},$(two),$[three],$<four>,$/five/", {
            one: undefined,
            two: true,
            three: -123.45,
            four: dateSample,
            five: function () {
                return "text";
            }
        })).toBe("null,true,-123.45,'" + dateSample.toUTCString() + "','text'");
    });

    it("must treat null and undefined values equally", function () {
        // Both null and undefined properties are formatted as null;
        expect(pgp.as.format("${empty1}, $(empty2)", {
            empty1: null,
            empty2: undefined
        })).toBe("null, null");
    });

    it("must throw error when property doesn't exist", function () {
        expect(function () {
            pgp.as.format("${prop1},${prop2}", {
                prop1: 'hello'
            });
        }).toThrow(new Error("Property 'prop2' doesn't exist."));
    });

    describe("'this' formatting", function () {

        it("must recognize 'this'", function () {
            var obj = {
                val1: 123,
                val2: 'hello'
            };
            expect(pgp.as.format("${this}", obj)).toEqual("'" + JSON.stringify(obj) + "'");
        });

        it("must recognize 'this^'", function () {
            var obj = {
                val1: 123,
                val2: 'hello'
            };
            expect(pgp.as.format("${this^}", obj)).toEqual(JSON.stringify(obj));
        });

        it("must ignore 'this' when property exists", function () {
            var obj = {
                this: 'self',
                val1: 123,
                val2: 'hello'
            };
            expect(pgp.as.format("${this^}", obj)).toBe('self');
        });

    });

});

describe("Format Modifiers", function () {

    function SimpleValue() {
        this.formatDBType = function () {
            return 'hello';
        };
    }

    function RawValue() {
        this._rawDBType = true;
        this.formatDBType = function () {
            return 'experiment';
        };
    }

    describe("json modifier", function () {
        it("must replace any value with json", function () {
            expect(pgp.as.format("$1:json", 'hello')).toBe('\'"hello"\'');
            expect(pgp.as.format("$1:json", ['hello'])).toBe('\'"hello"\'');
            expect(pgp.as.format("${data:json}", {data: [1, 'two']})).toBe("'[1,\"two\"]'");
        });
        it("must ignore invalid flags", function () {
            expect(pgp.as.format("$1 :json", 'hello')).toBe("'hello' :json");
            expect(pgp.as.format("$1: json", 'hello')).toBe("'hello': json");
        });
        it("must resolve custom types", function () {
            expect(pgp.as.format("$1:json", [new SimpleValue()])).toBe("'\"hello\"'");
        });
        it("must resolve custom raw types inside array", function () {
            expect(pgp.as.format("$1:json", [new RawValue()])).toBe('"experiment"');
        });
        it("must resolve custom raw types directly", function () {
            expect(pgp.as.format("$1:json", new RawValue())).toBe('"experiment"');
        });

    });

    function SimpleArray() {
        this.formatDBType = function () {
            return [1, 'two'];
        };
    }

    function RawArray() {
        this._rawDBType = true;
        this.formatDBType = function () {
            return [1, 'two'];
        };
    }

    describe("csv modifier", function () {
        it("must replace any value with csv", function () {
            expect(pgp.as.format("$1:csv", 'hello')).toBe("'hello'");
            expect(pgp.as.format("${data:csv}", {data: [1, 'two']})).toBe("1,'two'");
        });
        it("must ignore invalid flags", function () {
            expect(pgp.as.format("$1 :csv", 'hello')).toBe("'hello' :csv");
            expect(pgp.as.format("$1: csv", 'hello')).toBe("'hello': csv");
        });
        it("must resolve custom types", function () {
            expect(pgp.as.format("$1:csv", [new SimpleArray()])).toBe("1,'two'");
        });
        it("must resolve custom raw types", function () {
            expect(pgp.as.format("$1:csv", [new RawArray()])).toBe("1,'two'");
        });
    });

});

describe("Custom Format", function () {

    function MyType(v) {
        this.value = v;
        this._rawDBType = true;
        this.formatDBType = function () {
            return this.value.toFixed(4);
        }
    }

    var test = new MyType(12.3);

    describe("as array value", function () {
        it("must convert correctly", function () {
            expect(pgp.as.format("$1", [test])).toBe("12.3000");
        });
    });

    describe("as one value", function () {
        it("must covert correctly", function () {
            expect(pgp.as.format("$1", test)).toBe("12.3000");
        });
    });

    describe("for Date override", function () {
        beforeEach(function () {
            Date.prototype.formatDBType = function () {
                function subLevel() {
                    return this.getFullYear();
                }

                return subLevel;
            }
        });
        var today = new Date();
        it("must covert correctly", function () {
            expect(pgp.as.format("$1", today)).toBe(today.getFullYear().toString());
        });
        afterEach(function () {
            delete Date.prototype.formatDBType;
        });
    });

    describe("for Array override", function () {
        beforeEach(function () {
            Array.prototype.formatDBType = function () {
                return new MyType(88); // testing recursive conversion;
            }
        });
        it("must covert correctly", function () {
            expect(pgp.as.format("$1^", [1, 2, 3])).toBe("88.0000");
        });
        afterEach(function () {
            delete Array.prototype.formatDBType;
        });
    });

    describe("with custom object - formatter", function () {
        var values = {
            test: 'hello'
        };

        function CustomFormatter() {
            this.formatDBType = function () {
                return values;
            }
        }

        it("must redirect to named formatting", function () {
            expect(pgp.as.format("${test}", new CustomFormatter())).toBe("'hello'");
        });
    });

    describe("with a simple value", function () {
        function SimpleFormatter() {
            this.formatDBType = function () {
                return 'value';
            }
        }

        it("must return the simple value", function () {
            expect(pgp.as.format("$1", [new SimpleFormatter()])).toBe("'value'");
        });
    });

    describe('raw inheritance/mutation', function () {
        var obj = {
            // raw flag here must apply to every value of the array returned;
            _rawDBType: true,
            formatDBType: function () {
                return ['first', 'second'];
            }
        };
        it("must work", function () {
            expect(pgp.as.format("$1, $2", obj)).toBe("first, second");
        });
    });
});

describe("SQL Names", function () {

    describe("direct", function () {
        it("must format correctly", function () {
            expect(pgp.as.format('$1~', 'name')).toBe('"name"');
            expect(pgp.as.format('$1~', '"name"')).toBe('"""name"""');
            expect(pgp.as.format('${name~}', {name: 'hello'})).toBe('"hello"');
        });
    });

    describe("from a function", function () {
        function getName() {
            return 'hello';
        }

        it("must use the function result", function () {
            expect(pgp.as.format('$1:name', getName)).toBe('"hello"');
        });
    });

    describe("from a mixed type", function () {

        function CS(name) {
            this.name = name;
            this.formatDBType = function () {
                return this.name;
            };
        }

        var csTest = new CS('customType');

        function getName() {
            return csTest;
        }

        it("must resolve the mixed type", function () {
            expect(pgp.as.format('$1~', getName)).toBe('"customType"');
        });
    });

    describe("with an object", function () {
        it("must enumerate properties", function () {
            expect(pgp.as.format('$1~', [{one: 1, two: 2}])).toBe('"one","two"');
        });
    });

    describe("with an array", function () {
        it("must enumerate properties", function () {
            expect(pgp.as.format('$1~', [['one', 'two']])).toBe('"one","two"');
        });
    });

    describe("Negative", function () {

        describe("with the wrong object type", function () {
            it("must reject the object with an error", function () {
                expect(function () {
                    pgp.as.format('$1~', [123]);
                }).toThrow(new TypeError('Invalid sql name: 123'));
                expect(function () {
                    pgp.as.format('$1~', [true]);
                }).toThrow(new TypeError('Invalid sql name: true'));
                expect(function () {
                    pgp.as.format('$1~', ['']);
                }).toThrow(new TypeError('Invalid sql name: ""'));
            });
        });

        describe("with an empty object", function () {
            it("must reject the object with an error", function () {
                expect(function () {
                    pgp.as.format('$1~', [{}]);
                }).toThrow(new TypeError("Cannot retrieve sql names from an empty array/object."));
            });
        });

        describe("with an empty array", function () {
            it("must reject the array with an error", function () {
                expect(function () {
                    pgp.as.format('$1~', [[]]);
                }).toThrow(new TypeError("Cannot retrieve sql names from an empty array/object."));
            });
        });

        describe("with invalid property", function () {
            it("must reject the property", function () {
                expect(function () {
                    pgp.as.format('$1~', [{'': 1}]);
                }).toThrow(new TypeError('Invalid sql name: ""'));
            });
        });

        describe("with invalid array value", function () {
            it("must reject the value", function () {
                expect(function () {
                    pgp.as.format('$1~', [[1]]);
                }).toThrow(new TypeError('Invalid sql name: 1'));
            });
        });

    });
});
