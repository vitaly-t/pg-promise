'use strict';

const path = require('path');
const pgp = require('../lib/index');

const $pgUtils = require('pg/lib/utils');

const dateSample = new Date();

// common error messages;
const errors = {
    rawNull: () => 'Values null/undefined cannot be used as raw text.',
    range: (variable, length) => 'Variable ' + variable + ' out of range. Parameters array length: ' + length,
    buffer: value => '\'' + value + '\' is not a Buffer object.'
};

const sqlSimple = getPath('./sql/simple.sql');
const sqlParams = getPath('./sql/params.sql');

function getPath(file) {
    return path.join(__dirname, file);
}

const dummy = () => {
};

const userObj = {
    name: 'John O\'Connor',
    dob: new Date(1980, 5, 15),
    active: true
};

describe('Method as.buffer', () => {

    describe('Positive:', () => {
        const data = new Buffer([1, 2, 3]);
        const hex = '\\x010203';

        it('must hex-format data', () => {
            expect(pgp.as.buffer(data)).toBe('\'' + hex + '\'');
            expect(pgp.as.buffer(data, true)).toBe(hex);
        });

        it('must format null/undefined correctly', () => {
            expect(pgp.as.buffer()).toBe('null');
            expect(pgp.as.buffer(null)).toBe('null');
        });

        it('must format values correctly', () => {
            expect(pgp.as.format('$1', data)).toBe('\'' + hex + '\'');
            expect(pgp.as.format('$1', [data])).toBe('\'' + hex + '\'');
        });

        it('must format raw values correctly', () => {
            expect(pgp.as.format('$1^', data)).toBe(hex);
            expect(pgp.as.format('$1^', [data])).toBe(hex);
        });

        it('must format open values correctly', () => {
            expect(pgp.as.format('$1#', data)).toBe(hex);
            expect(pgp.as.format('$1:value', [data])).toBe(hex);
        });

        it('must work in any other context', () => {
            const input = [23, new Buffer([1, 2, 3]), 'Hello'], output = '23,\'\\x010203\',\'Hello\'',
                simple = new Buffer([1, 2, 3]);
            expect(pgp.as.csv(simple)).toBe('\'\\x010203\'');
            expect(pgp.as.format('$1:json', [simple])).toEqual('\'' + JSON.stringify(simple) + '\'');
            expect(pgp.as.csv(input)).toBe(output);
            expect(pgp.as.format('$1,$2,$3', input)).toBe(output);
            expect(pgp.as.format('$1:csv', [input])).toBe(output);
        });
    });

    describe('Negative:', () => {
        it('must throw error on invalid data', () => {
            expect(() => {
                pgp.as.buffer(123);
            }).toThrow(new TypeError(errors.buffer(123)));

            expect(() => {
                pgp.as.buffer(null, true);
            }).toThrow(new Error(errors.rawNull()));

            expect(() => {
                pgp.as.buffer(undefined, true);
            }).toThrow(new Error(errors.rawNull()));

        });

    });
});

describe('Method as.bool', () => {

    it('must correctly convert any boolean-like value', () => {
        expect(pgp.as.bool()).toBe('null');
        expect(pgp.as.bool(null)).toBe('null');
        expect(pgp.as.bool(0)).toBe('false');
        expect(pgp.as.bool(false)).toBe('false');
        expect(pgp.as.bool(1)).toBe('true');
        expect(pgp.as.bool(true)).toBe('true');
        expect(pgp.as.bool(10)).toBe('true');
        expect(pgp.as.bool(-10)).toBe('true');
        expect(pgp.as.bool([])).toBe('true');
        expect(pgp.as.bool({})).toBe('true');
        expect(pgp.as.bool('false')).toBe('true');
    });

    it('must correctly resolve functions', () => {
        expect(pgp.as.bool(dummy)).toBe('null');
        expect(pgp.as.bool(() => null)).toBe('null');
        expect(pgp.as.bool(() => true)).toBe('true');
        expect(pgp.as.bool(() => false)).toBe('false');
    });

});

describe('Method as.number', () => {

    it('must correctly convert any number', () => {
        expect(pgp.as.number()).toBe('null');
        expect(pgp.as.number(null)).toBe('null');
        expect(pgp.as.number(0)).toBe('0');
        expect(pgp.as.number(1)).toBe('1');
        expect(pgp.as.number(1234567890)).toBe('1234567890');
        expect(pgp.as.number(-123.456)).toBe('-123.456');
        expect(pgp.as.number(NaN)).toBe('\'NaN\'');
        expect(pgp.as.number(Number.NaN)).toBe('\'NaN\'');
        expect(pgp.as.number(1 / 0)).toBe('\'+Infinity\'');
        expect(pgp.as.number(Number.POSITIVE_INFINITY)).toBe('\'+Infinity\'');
        expect(pgp.as.number(-1 / 0)).toBe('\'-Infinity\'');
        expect(pgp.as.number(Number.NEGATIVE_INFINITY)).toBe('\'-Infinity\'');
    });

    it('must correctly resolve functions', () => {
        expect(pgp.as.number(dummy)).toBe('null');
        expect(pgp.as.number(() => null)).toBe('null');
        expect(pgp.as.number(() => 123)).toBe('123');
        expect(pgp.as.number(() => 0)).toBe('0');
        expect(pgp.as.number(() => -1 / 0)).toBe('\'-Infinity\'');

        // deep-call test:
        expect(pgp.as.number(() => {
            return () => {
                return () => {
                    return 123;
                };
            };
        })).toBe('123');

    });

    it('must correctly reject invalid values', () => {

        const err = ' is not a number.';
        expect(() => {
            pgp.as.number('');
        }).toThrow(new Error('\'\'' + err));

        expect(() => {
            pgp.as.number([1, 2]);
        }).toThrow(new Error('\'1,2\'' + err));

    });

});

describe('Method as.text', () => {
    it('must correctly convert any text', () => {

        expect(pgp.as.text()).toBe('null');
        expect(pgp.as.text(null)).toBe('null');

        expect(pgp.as.text('')).toBe('\'\'');
        expect(pgp.as.text('', true)).toBe(''); // raw-text test;

        expect(pgp.as.text('some text')).toBe('\'some text\'');
        expect(pgp.as.text('some text', true)).toBe('some text'); // raw-text test;

        expect(pgp.as.text('\'starts with quote')).toBe('\'\'\'starts with quote\'');
        expect(pgp.as.text('\'starts with quote', true)).toBe('\'starts with quote'); // raw-text test;

        expect(pgp.as.text('ends with quote\'')).toBe('\'ends with quote\'\'\'');
        expect(pgp.as.text('ends with quote\'', true)).toBe('ends with quote\''); // raw-text test;

        expect(pgp.as.text('has \'\' two quotes')).toBe('\'has \'\'\'\' two quotes\'');
        expect(pgp.as.text('has \'\' two quotes', true)).toBe('has \'\' two quotes'); // raw-text test;

        expect(pgp.as.text('\'')).toBe('\'\'\'\'');
        expect(pgp.as.text('\'', true)).toBe('\''); // raw-text test;

        expect(pgp.as.text('\'\'')).toBe('\'\'\'\'\'\'');
        expect(pgp.as.text('\'\'', true)).toBe('\'\''); // raw-text test;

        expect(pgp.as.text(-123.456)).toBe('\'-123.456\'');
        expect(pgp.as.text(true)).toBe('\'true\'');
        expect(pgp.as.text(false)).toBe('\'false\'');
        expect(pgp.as.text(dateSample)).toBe('\'' + dateSample.toString() + '\'');

        expect(pgp.as.text([])).toBe('\'\'');
        expect(pgp.as.text([], true)).toBe(''); // raw-text test;

        expect(pgp.as.text([1, 'hello'])).toBe('\'1,hello\''); // converts string as is;
        expect(pgp.as.text([1, 'hello'], true)).toBe('1,hello'); // converts string as is;

        expect(pgp.as.text({})).toBe('\'[object Object]\'');
    });

    it('must correctly resolve functions', () => {

        expect(pgp.as.text(dummy)).toBe('null');

        expect(pgp.as.text(() => null)).toBe('null');

        expect(pgp.as.text(() => 'hello')).toBe('\'hello\'');

    });

    it('must correctly respond to invalid raw-text requests', () => {
        expect(() => {
            pgp.as.text(undefined, true);
        }).toThrow(new Error(errors.rawNull()));

        expect(() => {
            pgp.as.text(null, true);
        }).toThrow(new Error(errors.rawNull()));

    });

});

describe('Method as.value', () => {
    it('must correctly convert any type', () => {
        expect(pgp.as.value(1)).toBe('1');
        expect(pgp.as.value(true)).toBe('true');
    });
    it('must correctly escape text', () => {
        expect(pgp.as.value('text')).toBe('text');
        expect(pgp.as.value('te\'xt')).toBe('te\'\'xt');
    });

    it('must correctly format values', () => {
        expect(pgp.as.format('$1:value', 'val')).toBe('val');
        expect(pgp.as.format('$1#', 'val')).toBe('val');
        expect(pgp.as.format('$1#', 'val\'ue')).toBe('val\'\'ue');
    });

    it('must throw on null/undefined', () => {
        const err = 'Open values cannot be null or undefined.';
        expect(() => {
            pgp.as.value();
        }).toThrow(new TypeError(err));

        expect(() => {
            pgp.as.format('$1#', [null]);
        }).toThrow(new TypeError(err));

        expect(() => {
            pgp.as.format('$1#', [undefined]);
        }).toThrow(new TypeError(err));
    });

});

describe('Method as.date', () => {
    it('must correctly convert any date', () => {
        expect(pgp.as.date()).toBe('null');
        expect(pgp.as.date(null)).toBe('null');
        expect(pgp.as.date(dateSample)).toBe('\'' + $pgUtils.prepareValue(dateSample) + '\'');
        expect(pgp.as.date(dateSample, true)).toBe($pgUtils.prepareValue(dateSample));
    });

    it('must correctly resolve functions', () => {
        expect(pgp.as.date(dummy)).toBe('null');
        expect(pgp.as.date(() => null)).toBe('null');
        expect(pgp.as.date(() => dateSample, true)).toBe($pgUtils.prepareValue(dateSample));
    });

    it('must correctly reject invalid requests', () => {

        expect(() => {
            pgp.as.date(undefined, true);
        }).toThrow(new Error(errors.rawNull()));

        expect(() => {
            pgp.as.date(null, true);
        }).toThrow(new Error(errors.rawNull()));

        expect(() => {
            pgp.as.date('');
        }).toThrow(new Error('\'\' is not a Date object.'));

        expect(() => {
            pgp.as.date('bla-bla');
        }).toThrow(new Error('\'bla-bla\' is not a Date object.'));

        expect(() => {
            pgp.as.date(123);
        }).toThrow(new Error('\'123\' is not a Date object.'));

        expect(() => {
            pgp.as.date([]);
        }).toThrow(new Error('\'\' is not a Date object.'));

        expect(() => {
            pgp.as.date({});
        }).toThrow(new Error('\'[object Object]\' is not a Date object.'));

    });

});

describe('Method as.csv', () => {

    it('must correctly convert any parameters into CSV', () => {

        ////////////////////////////////
        // positive tests;

        expect(pgp.as.csv()).toBe(''); // test undefined;
        expect(pgp.as.csv([])).toBe(''); // test empty array;
        expect(pgp.as.csv([[]])).toBe('\'{}\''); // test empty array;
        expect(pgp.as.csv(null)).toBe('null'); // test null;
        expect(pgp.as.csv([null])).toBe('null'); // test null in array;
        expect(pgp.as.csv([undefined])).toBe('null'); // test undefined in array;
        expect(pgp.as.csv([null, undefined])).toBe('null,null'); // test combination of null + undefined in array;

        expect(pgp.as.csv(0)).toBe('0'); // test zero;
        expect(pgp.as.csv([0])).toBe('0'); // test zero in array;
        expect(pgp.as.csv(-123.456)).toBe('-123.456'); // test a float;
        expect(pgp.as.csv([-123.456])).toBe('-123.456'); // test a float in array;

        expect(pgp.as.csv(true)).toBe('true'); // test boolean True;
        expect(pgp.as.csv([true])).toBe('true'); // test boolean True in array;

        expect(pgp.as.csv(false)).toBe('false'); // test boolean False;
        expect(pgp.as.csv([false])).toBe('false'); // test boolean False in array;

        expect(pgp.as.csv('')).toBe('\'\''); // empty text;
        expect(pgp.as.csv([''])).toBe('\'\''); // empty text in array;
        expect(pgp.as.csv('simple text')).toBe('\'simple text\''); // simple text;
        expect(pgp.as.csv('don\'t break')).toBe('\'don\'\'t break\''); // text with one single-quote symbol;
        expect(pgp.as.csv('test \'\'')).toBe('\'test \'\'\'\'\''); // text with two single-quote symbols;

        expect(pgp.as.csv(dateSample)).toBe('\'' + $pgUtils.prepareValue(dateSample) + '\''); // test date;
        expect(pgp.as.csv([dateSample])).toBe('\'' + $pgUtils.prepareValue(dateSample) + '\''); // test date in array;

        expect(pgp.as.csv([userObj])).toBe(pgp.as.text(JSON.stringify(userObj)));

        // test a combination of all possible types;
        expect(pgp.as.csv([12.34, true, 'don\'t break', null, undefined, userObj, dateSample, [1, 2]]))
            .toBe('12.34,true,\'don\'\'t break\',null,null,' + pgp.as.text(JSON.stringify(userObj)) + ',\'' + $pgUtils.prepareValue(dateSample) + '\',array[1,2]');

        // test array-type as a parameter;
        expect(pgp.as.csv([1, [2, 3], 4])).toBe('1,array[2,3],4');
        expect(pgp.as.csv([1, [['two'], ['three']], 4])).toBe('1,array[[\'two\'],[\'three\']],4');
    });

    it('must correctly resolve functions', () => {

        expect(pgp.as.csv(dummy)).toBe('');

        expect(pgp.as.csv(() => null)).toBe('null');

        expect(pgp.as.csv(() => 'one')).toBe('\'one\'');

        expect(pgp.as.csv(() => ['one', 'two', [1, 2, 3]])).toBe('\'one\',\'two\',array[1,2,3]');
    });

});

describe('Method as.json', () => {

    it('must correctly convert any object into JSON', () => {
        expect(pgp.as.json()).toBe('null');
        expect(pgp.as.json(null)).toBe('null');
        expect(pgp.as.json({})).toBe('\'' + JSON.stringify({}) + '\'');
        expect(pgp.as.json(userObj)).toBe(pgp.as.text(JSON.stringify(userObj)));
    });

    it('must correctly resolve functions', () => {
        expect(pgp.as.json(dummy)).toBe('null');
        expect(pgp.as.json(() => null)).toBe('null');
        expect(pgp.as.json(() => userObj)).toBe(pgp.as.text(JSON.stringify(userObj)));
    });

    it('must correctly reject invalid requests', () => {
        expect(() => {
            pgp.as.json(null, true);
        }).toThrow(new Error(errors.rawNull()));
        expect(() => {
            pgp.as.json(undefined, true);
        }).toThrow(new Error(errors.rawNull()));
    });
});

describe('Method as.array', () => {

    it('must correctly convert an empty array or value', () => {
        expect(pgp.as.array()).toBe('null');
        expect(pgp.as.array(null)).toBe('null');
        expect(pgp.as.array([])).toBe('\'{}\'');
    });

    it('must correctly convert nested arrays', () => {
        expect(pgp.as.array([[]])).toBe('array[[]]');
        expect(pgp.as.array([[1, 2], ['three', 'four', [], [5, 'six', true]]]))
            .toBe('array[[1,2],[\'three\',\'four\',[],[5,\'six\',true]]]');
    });

    // 20-dimension test;
    it('must correctly convert arrays of any depth', () => {
        expect(pgp.as.array([[[[[[[[[[[[[[[[[[[[20]]]]]]]]]]]]]]]]]]]]))
            .toBe('array[[[[[[[[[[[[[[[[[[[[20]]]]]]]]]]]]]]]]]]]]');
    });

    it('must correctly resolve functions', () => {
        expect(pgp.as.array(dummy)).toBe('null');
        expect(pgp.as.array(() => null)).toBe('null');
        expect(pgp.as.array(() => [1, 2, 3])).toBe('array[1,2,3]');
    });

    it('must correctly reject invalid requests', () => {

        const err = ' is not an Array object.';
        expect(() => {
            pgp.as.array(123);
        }).toThrow(new Error('\'123\'' + err));

        expect(() => {
            pgp.as.array('');
        }).toThrow(new Error('\'\'' + err));

    });

});

describe('Method as.func', () => {

    it('must correctly convert any function return', () => {
        expect(pgp.as.func()).toBe('null');
        expect(pgp.as.func(null)).toBe('null');
        expect(pgp.as.func(() => 1)).toBe('1');
        expect(pgp.as.func(() => [1, 2, 3])).toBe('array[1,2,3]');
        expect(pgp.as.func(() => {
        })).toBe('null');

        expect(pgp.as.func(() => null)).toBe('null');
        expect(pgp.as.func(() => 'hello', true)).toBe('hello');

        expect(pgp.as.func(() => {
            return () => {
                return () => {
                };
            };
        })).toBe('null');

        expect(pgp.as.func(() => {
            return () => {
                return () => {
                    return true;
                };
            };
        })).toBe('true');

        expect(pgp.as.format('$1,$1^', () => {
            return () => {
                return 'one';
            };
        })).toBe('\'one\',one');

        // testing function-object context;
        expect(pgp.as.format('${summ1} + ${summ2}', {
            val1: 1,
            val2: 2,
            summ1: function () {
                return this.val1 + this.val2; // `this` must work here;
            },
            summ2: a => a.val2 * 3
        })).toBe('3 + 6');

        // the same object context must be
        // passed into every sub-function;
        expect(pgp.as.func(() => {
            return () => {
                return function () {
                    return this.test;
                };
            };
        }, false, {
            test: 'Hello!'
        })).toBe('\'Hello!\'');

        expect(pgp.as.func(dummy, false, '')).toBe('null');

        expect(pgp.as.func(a => a, false, 123)).toBe('123');

        /////////////////////////////
        // negative tests;

        expect(() => {
            pgp.as.func(1);
        }).toThrow(new Error('\'1\' is not a function.'));

        expect(() => {
            pgp.as.func(undefined, true);
        }).toThrow(new Error('Values null/undefined cannot be used as raw text.'));

        expect(() => {
            pgp.as.func(null, true);
        }).toThrow(new Error('Values null/undefined cannot be used as raw text.'));

        expect(() => {
            pgp.as.func(() => {
                throw 'internal error';
            });
        }).toThrow('internal error');

    });
});

describe('Method as.name', () => {

    describe('with an empty or non-string', () => {
        it('must throw na error', () => {
            expect(() => {
                pgp.as.name();
            }).toThrow(new TypeError('Invalid sql name: undefined'));
            expect(() => {
                pgp.as.name(null);
            }).toThrow(new TypeError('Invalid sql name: null'));
            expect(() => {
                pgp.as.name(123);
            }).toThrow(new TypeError('Invalid sql name: 123'));
            expect(() => {
                pgp.as.name('');
            }).toThrow(new TypeError('Invalid sql name: ""'));
        });
    });

    describe('with regular names', () => {
        it('must return the right name', () => {
            expect(pgp.as.name('a')).toBe('"a"');
            expect(pgp.as.name(' ')).toBe('" "');
            expect(pgp.as.name('\t')).toBe('"\t"');
            expect(pgp.as.name('"')).toBe('""""');
            expect(pgp.as.name('""')).toBe('""""""');
        });
    });

    describe('with a function', () => {
        function getName() {
            return 'name';
        }

        it('must use the function value', () => {
            expect(pgp.as.name(getName)).toBe('"name"');
        });
    });

    describe('with *', () => {
        it('must return the original string', () => {
            expect(pgp.as.name('*')).toBe('*');
            expect(pgp.as.name(' \t *\t ')).toBe(' \t *\t ');
        });
    });

});

describe('Method as.alias', () => {

    describe('with an empty or non-string', () => {
        it('must throw na error', () => {
            expect(() => {
                pgp.as.alias();
            }).toThrow(new TypeError('Invalid sql alias: undefined'));
            expect(() => {
                pgp.as.alias(null);
            }).toThrow(new TypeError('Invalid sql alias: null'));
            expect(() => {
                pgp.as.alias(123);
            }).toThrow(new TypeError('Invalid sql alias: 123'));
            expect(() => {
                pgp.as.alias('');
            }).toThrow(new TypeError('Invalid sql alias: ""'));
        });
    });

    describe('with regular names', () => {
        it('must return the right name', () => {
            expect(pgp.as.alias('a')).toBe('"a"');
            expect(pgp.as.alias(' ')).toBe('" "');
            expect(pgp.as.alias('\t')).toBe('"\t"');
            expect(pgp.as.alias('"')).toBe('""""');
            expect(pgp.as.alias('""')).toBe('""""""');
        });
    });

    describe('with a function', () => {
        function getName() {
            return 'name';
        }

        it('must support the function value', () => {
            expect(pgp.as.alias(getName)).toBe('"name"');
        });
    });

});

describe('Method as.format', () => {

    it('must return a correctly formatted string', () => {

        expect(pgp.as.format('', [])).toBe('');

        expect(pgp.as.format('$1')).toBe('$1');
        expect(pgp.as.format('$1', null)).toBe('null');

        expect(pgp.as.format('$1', [undefined])).toBe('null');

        expect(pgp.as.format('$1', 'one')).toBe('\'one\'');
        expect(pgp.as.format('$1^', 'one')).toBe('one');
        expect(pgp.as.format('$1:raw', 'one')).toBe('one');

        expect(pgp.as.format('$1', ['one'])).toBe('\'one\'');
        expect(pgp.as.format('$1^', ['one'])).toBe('one');
        expect(pgp.as.format('$1:raw', ['one'])).toBe('one');

        expect(pgp.as.format('$1, $1', 'one')).toBe('\'one\', \'one\'');

        expect(pgp.as.format('$1$1', 'one')).toBe('\'one\'\'one\'');
        expect(pgp.as.format('$1^$1^', 'one')).toBe('oneone');

        expect(pgp.as.format('$1', [userObj])).toBe(pgp.as.text(JSON.stringify(userObj)));
        expect(pgp.as.format('$1^', [userObj])).toBe(JSON.stringify(userObj));

        expect(pgp.as.format('$1, $2, $3, $4', [true, -12.34, 'text', dateSample])).toBe('true, -12.34, \'text\', \'' + $pgUtils.prepareValue(dateSample) + '\'');

        expect(pgp.as.format('$1 $1, $2 $2, $1', [1, 'two'])).toBe('1 1, \'two\' \'two\', 1'); // test for repeated variables;

        expect(pgp.as.format('Test: $1', ['don\'t break quotes!'])).toBe('Test: \'don\'\'t break quotes!\'');

        // testing with lots of variables;
        let source = '', dest = '';
        const params = [];
        for (let i = 1; i <= 1000; i++) {
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
        expect(pgp.as.format('$1$2,$3,$4,$5,$6,$7,$8,$9,$10$11,$12,$13,$14,$15,$1,$3', [1, 2, 'C', 'DDD', 'E', 'F', 'G', 'H', 'I', 88, 99, 'LLL'], {partial: true}))
            .toBe('12,\'C\',\'DDD\',\'E\',\'F\',\'G\',\'H\',\'I\',8899,\'LLL\',$13,$14,$15,1,\'C\'');

        // test that variable names are not confused for longer ones;
        expect(pgp.as.format('$11, $1, $111, $1', 123)).toBe('$11, 123, $111, 123');

        // test that variable names are not confused for longer ones,
        // even when they are right next to each other;
        expect(pgp.as.format('$11$1$111$1', 123)).toBe('$11123$111123');

        expect(pgp.as.format('$1, $2', [
            'one', [2, 3]
        ])).toBe('\'one\', array[2,3]');

        // check that gaps are handled correctly;
        expect(pgp.as.format('$2, $4, $6', [1, 2, 3, 4, 5], {partial: true})).toBe('2, 4, $6');

        ///////////////////////////////////////////////////
        // test that inserting strings with variable names
        // in them doesn't effect formatting;

        // a) for regular variables;
        expect(pgp.as.format('$1, $2, $3^, $4', ['$2', '$3', '$2,$3'], {partial: true})).toBe('\'$2\', \'$3\', $2,$3, $4');

        // b) for the Named Parameters;
        expect(pgp.as.format('${one}, ${two}, ${three^}, $four', {
            one: '${two}',
            two: '${three}',
            three: '${two},${three}'
        })).toBe('\'${two}\', \'${three}\', ${two},${three}, $four');
    });

    it('must correctly inject raw-text variables', () => {

        expect(pgp.as.format('${name},${name^},${name},${name^}', {
            name: 'me'
        })).toBe('\'me\',me,\'me\',me');

        expect(pgp.as.format('$1,$1^,$1,$1^', 'hello')).toBe('\'hello\',hello,\'hello\',hello');

        expect(pgp.as.format('$1,$2,$1^,$2^', ['one', 'two']))
            .toBe('\'one\',\'two\',one,two');

        expect(pgp.as.format('$1^ $2^ $1', ['Don\'t break', 'this']))
            .toBe('Don\'t break this \'Don\'\'t break\'');

        expect(pgp.as.format('$1^,$1', dateSample))
            .toBe($pgUtils.prepareValue(dateSample) + ',\'' + $pgUtils.prepareValue(dateSample) + '\'');

    });

    it('must correctly reject invalid requests', () => {

        const errEmptyString = 'Parameter \'query\' must be a text string.';

        expect(() => pgp.as.format()).toThrow(new Error(errEmptyString));
        expect(() => pgp.as.format(null)).toThrow(new Error(errEmptyString));
        expect(() => pgp.as.format(null, [1, 2, 3])).toThrow(new Error(errEmptyString));
        expect(() => pgp.as.format(123)).toThrow(new Error(errEmptyString));
        expect(() => pgp.as.format(() => '', dummy)).toThrow(new Error(errEmptyString));
        expect(() => pgp.as.format('$1^', null)).toThrow(new Error(errors.rawNull()));
        expect(() => pgp.as.format('$1^', [null])).toThrow(new Error(errors.rawNull()));
        expect(() => pgp.as.format('$1^', [undefined])).toThrow(new Error(errors.rawNull()));
        expect(() => pgp.as.format('$1', [])).toThrow(new RangeError(errors.range('$1', 0)));
        expect(() => pgp.as.format('$3', [1, 2])).toThrow(new RangeError(errors.range('$3', 2)));
        expect(() => pgp.as.format('$100001', [])).toThrow(new RangeError('Variable $100001 exceeds supported maximum of $100000'));
    });

    it('must throw on type Symbol', () => {

        const value = Symbol('one.two');
        const symbolError = new TypeError('Type Symbol has no corresponding PostgreSQL type: ' + value.toString());

        expect(() => pgp.as.format('$1', value)).toThrow(symbolError);
        expect(() => pgp.as.format('$1', [value])).toThrow(symbolError);
    });

    describe('formatting options', () => {

        describe('partial', () => {
            it('must skip missing variables', () => {
                expect(pgp.as.format('$1', [], {partial: true})).toBe('$1');
                expect(pgp.as.format('$1^', [], {partial: true})).toBe('$1^');
                expect(pgp.as.format('$1:raw', [], {partial: true})).toBe('$1:raw');
            });
        });

        describe('default', () => {
            it('must replace missing variables', () => {
                expect(pgp.as.format('$1, $2', [1], {default: undefined})).toBe('1, null');
                expect(pgp.as.format('$1, $2', [1], {default: null})).toBe('1, null');
                expect(pgp.as.format('${present}, ${missing}', {present: 1}, {default: 2})).toBe('1, 2');
            });
            it('must invoke a callback correctly', () => {
                let value, context, param;

                function cb(v, p) {
                    context = this;
                    value = v;
                    param = p;
                    return 123;
                }

                const arr = ['hi'];
                expect(pgp.as.format('$1, $2', arr, {default: cb})).toBe('\'hi\', 123');
                expect(context === arr).toBe(true);
                expect(param === arr).toBe(true);
                expect(value).toBe(1);

                const obj = {first: 'f'};
                expect(pgp.as.format('${first}, ${  second^ \t}', obj, {default: cb})).toBe('\'f\', 123');
                expect(context === obj).toBe(true);
                expect(param === obj).toBe(true);
                expect(value).toBe('second');

            });
        });

    });

    describe('QueryFile - positive', () => {
        it('must format the object', () => {
            const qf = new pgp.QueryFile(sqlParams, {debug: false, minify: true, noWarnings: true});
            expect(pgp.as.format(qf, {
                column: 'col',
                schema: 'sc',
                table: 'tab'
            })).toBe('SELECT "col" FROM "sc"."tab"');
        });

        it('must format the type as a parameter', () => {
            const qf = new pgp.QueryFile(sqlSimple, {debug: false, minify: true, noWarnings: true});
            expect(pgp.as.format('$1', [qf])).toBe('select 1;');
            expect(pgp.as.format('$1^', qf)).toBe('select 1;');
            expect(pgp.as.format('$1#', qf)).toBe('select 1;');
        });

    });

    describe('QueryFile - negative', () => {
        it('must throw QueryFileError', () => {
            let error1, error2;
            const qf = new pgp.QueryFile('bla-bla');
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

describe('Named Parameters', () => {

    it('must recognize all supported symbols', () => {
        expect(pgp.as.format('${one},$(two),$[three],$<four>,$/five/', {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5
        })).toBe('1,2,3,4,5');
    });

    it('must ignore mixed open-close symbols', () => {
        const openers = '{([</', closers = '})]>/';
        for (let i = 0; i < openers.length; i++) {
            for (let k = 0; k < closers.length; k++) {
                const txt = '$' + openers[i] + 'value' + closers[k];
                const s = pgp.as.format(txt, {
                    value: 'hello'
                });
                if (i === k) {
                    expect(s).toBe('\'hello\'');
                } else {
                    expect(s).toBe(txt);
                }
            }
        }

    });

    it('must ignore internal spaces', () => {
        expect(pgp.as.format('${  one  },$(  two  ),$[  three  ],$<  four  >,$/  five  /', {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5
        })).toBe('1,2,3,4,5');
    });

    it('must support short property names', () => {
        expect(pgp.as.format('${$}$(_)$[a]$< _$>$/$$ /', {
            $: 1,
            _: 2,
            a: 3,
            _$: 4,
            $$: 5
        })).toBe('12345');
    });

    it('must support digit-only property names', () => {
        expect(pgp.as.format('${1}, $(2), $[5^]', {
            1: 'one',
            2: 'two',
            5: 'five'
        })).toBe('\'one\', \'two\', five');
    });

    it('must recognize case difference', () => {
        expect(pgp.as.format('${value},$(Value),$[VALUE],$<valuE>,$/vaLue/', {
            value: 1,
            Value: 2,
            VALUE: 3,
            valuE: 4,
            vaLue: 5
        })).toBe('1,2,3,4,5');

        // Negative;
        expect(() => {
            pgp.as.format('$/propName/$(PropName)', {
                propName: undefined
            });
        }).toThrow(new Error('Property \'PropName\' doesn\'t exist.'));

    });

    it('must allow partial replacements', () => {
        expect(pgp.as.format('${first}, ${ second  }, ${third}',
            {
                first: 'one',
                third: 'three'
            }, {partial: true}))
            .toBe('\'one\', ${ second  }, \'three\'');
    });

    it('must ignore invalid-formatted variables', () => {
        expect(pgp.as.format('$()', {})).toBe('$()');
        expect(pgp.as.format('$((test))', {})).toBe('$((test))');
        expect(pgp.as.format('${{test}}', {})).toBe('${{test}}');
        expect(pgp.as.format('$({test})', {})).toBe('$({test})');
        expect(pgp.as.format('$(^test)', {})).toBe('$(^test)');
        expect(pgp.as.format('${^test}', {})).toBe('${^test}');
        expect(pgp.as.format('$(test^^)', {})).toBe('$(test^^)');
        expect(pgp.as.format('${test^^}', {})).toBe('${test^^}');
    });

    it('must convert all types correctly', () => {
        expect(pgp.as.format('${one},$(two),$[three],$<four>,$/five/', {
            one: undefined,
            two: true,
            three: -123.45,
            four: dateSample,
            five: () => 'text'
        })).toBe('null,true,-123.45,\'' + $pgUtils.prepareValue(dateSample) + '\',\'text\'');
    });

    it('must treat null and undefined values equally', () => {
        // Both null and undefined properties are formatted as null;
        expect(pgp.as.format('${empty1}, $(empty2)', {
            empty1: null,
            empty2: undefined
        })).toBe('null, null');
    });

    it('must throw error when property doesn\'t exist', () => {
        const err = name => new Error('Property \'' + name + '\' doesn\'t exist.');
        expect(() => pgp.as.format('${abc}', {})).toThrow(err('abc'));
        expect(() => pgp.as.format('${a.b}', {a: {}})).toThrow(err('a.b'));
    });

    it('must throw error for invalid properties', () => {
        const err = name => new Error('Invalid property name \'' + name + '\'.');
        expect(() => pgp.as.format('${.}', {})).toThrow(err('.'));
        expect(() => pgp.as.format('${ a. }', {})).toThrow(err('a.'));
        expect(() => pgp.as.format('${.b}', {})).toThrow(err('.b'));
    });

    describe('\'this\' formatting', () => {

        it('must recognize \'this\'', () => {
            const obj = {
                val1: 123,
                val2: 'hello'
            };
            expect(pgp.as.format('${this}', obj)).toEqual('\'' + JSON.stringify(obj) + '\'');
        });

        it('must recognize \'this^\'', () => {
            const obj = {
                val1: 123,
                val2: 'hello'
            };
            expect(pgp.as.format('${this^}', obj)).toEqual(JSON.stringify(obj));
        });

        it('must ignore \'this\' when property exists', () => {
            const obj = {
                this: 'self',
                val1: 123,
                val2: 'hello'
            };
            expect(pgp.as.format('${this^}', obj)).toBe('self');
        });

    });

});

describe('Nested Named Parameters', () => {

    describe('basic variables', () => {
        it('must be formatted correctly', () => {
            expect(pgp.as.format('${a.b}', {a: {b: 123}})).toBe('123');
            expect(pgp.as.format('${_.$.123}', {_: {$: {123: 111}}})).toBe('111');
        });
    });

    describe('prototype variables', () => {
        beforeEach(() => {
            Number.prototype.msg = 'hello!';
        });
        afterEach(() => {
            delete Number.prototype.msg;
        });
        it('must be discoverable', () => {
            expect(pgp.as.format('${value.msg}', {value: 10})).toBe('\'hello!\'');
        });
    });

    describe('default values', () => {
        it('must be formatted correctly', () => {
            expect(pgp.as.format('${one.two.three}', {}, {'default': 123})).toBe('123');
        });
    });

    describe('calling context', () => {
        describe('for functions', () => {
            it('must represent the container', () => {
                const obj = {
                    first: {
                        second: {
                            test1: a => a.value,
                            test2: function () {
                                return this.value;
                            },
                            value: 123
                        }
                    }
                };
                expect(pgp.as.format('${first.second.test1}', obj)).toBe('123');
                expect(pgp.as.format('${first.second.test2}', obj)).toBe('123');
            });
        });

        describe('for CTF', () => {
            it('must represent the container', () => {
                const obj = {
                    first: {
                        second: {
                            test: {
                                toPostgres: a => a.value,
                                value: 456
                            },
                            toPostgres: function () {
                                return this.value;
                            },
                            value: 123
                        }
                    }
                };
                expect(pgp.as.format('${first.second}', obj)).toBe('123');
                expect(pgp.as.format('${first.second.test}', obj)).toBe('456');
            });
        });

        describe('for default values', () => {
            it('must represent the source object', () => {
                const obj = {
                    value: 1,
                    one: {
                        value: 2,
                        two: {
                            value: 3
                        }
                    }
                };
                expect(pgp.as.format('${one.two.three}', obj, {'default': (name, obj) => obj.value})).toBe('1');
                expect(pgp.as.format('${one.two.three}', obj, {
                    'default': function () {
                        return this.value;
                    }
                })).toBe('1');
            });
            it('must pass in the full property name', () => {
                expect(pgp.as.format('${one.two.three}', {}, {'default': name => name})).toBe('\'one.two.three\'');
            });
        });

    });

});

describe('Format Modifiers', function () {

    function SimpleValue() {
        this.toPostgres = function () {
            return 'hello';
        };
    }

    function RawValue() {
        this.rawType = true;
        this.toPostgres = function () {
            return 'experiment';
        };
    }

    describe('json modifier', function () {
        it('must replace any value with json', function () {
            expect(pgp.as.format('$1:json', 'hello')).toBe('\'"hello"\'');
            expect(pgp.as.format('$1:json', ['hello'])).toBe('\'"hello"\'');
            expect(pgp.as.format('${data:json}', {data: [1, 'two']})).toBe('\'[1,"two"]\'');
        });
        it('must ignore invalid flags', function () {
            expect(pgp.as.format('$1 :json', 'hello')).toBe('\'hello\' :json');
            expect(pgp.as.format('$1: json', 'hello')).toBe('\'hello\': json');
        });
        it('must resolve custom types', function () {
            expect(pgp.as.format('$1:json', [new SimpleValue()])).toBe('\'"hello"\'');
        });
        it('must resolve custom raw types inside array', function () {
            expect(pgp.as.format('$1:json', [new RawValue()])).toBe('"experiment"');
        });
        it('must resolve custom raw types directly', function () {
            expect(pgp.as.format('$1:json', new RawValue())).toBe('"experiment"');
        });

    });

    function SimpleArray() {
        this.toPostgres = function () {
            return [1, 'two'];
        };
    }

    function RawArray() {
        this.rawType = true;
        this.toPostgres = function () {
            return [1, 'two'];
        };
    }

    describe('csv modifier', function () {
        it('must replace any value with csv', function () {
            expect(pgp.as.format('$1:csv', 'hello')).toBe('\'hello\'');
            expect(pgp.as.format('${data:csv}', {data: [1, 'two']})).toBe('1,\'two\'');
        });
        it('must ignore invalid flags', function () {
            expect(pgp.as.format('$1 :csv', 'hello')).toBe('\'hello\' :csv');
            expect(pgp.as.format('$1: csv', 'hello')).toBe('\'hello\': csv');
        });
        it('must resolve custom types', function () {
            expect(pgp.as.format('$1:csv', [new SimpleArray()])).toBe('1,\'two\'');
        });
        it('must resolve custom raw types', function () {
            expect(pgp.as.format('$1:csv', [new RawArray()])).toBe('1,\'two\'');
        });
    });

    describe('alias modifier', () => {
        it('must replace any value correctly', () => {
            expect(pgp.as.format('$1:alias', 'name')).toBe('"name"');
            expect(pgp.as.format('$1:alias', '*')).toBe('"*"');
            expect(pgp.as.format('${name:alias}', {name: 'hello'})).toBe('"hello"');
        });
    });
});

describe('Custom Type Formatting', function () {

    function MyType1(v) {
        this.value = v;
        this.rawType = true;
        this.toPostgres = () => {
            return this.value.toFixed(4);
        };
    }

    function MyType2(v) {
        this.value = v;
        this.rawType = true;
        this.toPostgres = a => a.value.toFixed(2);
    }

    const test1 = new MyType1(12.3);
    const test2 = new MyType2(56.7);

    describe('as formatting type', function () {
        it('must pass the values in correctly', function () {
            expect(pgp.as.format(test2)).toBe('56.70');
        });
    });

    describe('as array value', function () {
        it('must convert correctly', function () {
            expect(pgp.as.format('$1', [test1])).toBe('12.3000');
            expect(pgp.as.format('$1', [test2])).toBe('56.70');
        });
    });

    describe('as one value', function () {
        it('must covert correctly', function () {
            expect(pgp.as.format('$1', test1)).toBe('12.3000');
            expect(pgp.as.format('$1', test2)).toBe('56.70');
        });
    });

    describe('for Date override', function () {
        beforeEach(function () {
            Date.prototype.toPostgres = () => {
                function subLevel() {
                    return this.getFullYear();
                }

                return subLevel;
            };
        });
        const today = new Date();
        it('must covert correctly', function () {
            expect(pgp.as.format('$1', today)).toBe(today.getFullYear().toString());
        });
        afterEach(function () {
            delete Date.prototype.toPostgres;
        });
    });

    describe('for Array override', function () {
        beforeEach(function () {
            Array.prototype.toPostgres = () => {
                return new MyType1(88); // testing recursive conversion;
            };
        });
        it('must covert correctly', function () {
            expect(pgp.as.format('$1^', [1, 2, 3])).toBe('88.0000');
        });
        afterEach(function () {
            delete Array.prototype.toPostgres;
        });
    });

    describe('with custom object - formatter', function () {
        const values = {
            test: 'hello'
        };

        function CustomFormatter() {
            this.toPostgres = () => {
                return values;
            };
        }

        it('must redirect to named formatting', function () {
            expect(pgp.as.format('${test}', new CustomFormatter())).toBe('\'hello\'');
        });
    });

    describe('with a simple value', function () {
        function SimpleFormatter() {
            this.toPostgres = () => 'value';
        }

        it('must return the simple value', function () {
            expect(pgp.as.format('$1', [new SimpleFormatter()])).toBe('\'value\'');
        });
    });

    describe('raw inheritance/mutation', function () {
        const obj = {
            // raw flag here must apply to every value of the array returned;
            rawType: true,
            toPostgres: function () {
                return ['first', 'second'];
            }
        };
        it('must work', function () {
            expect(pgp.as.format('$1, $2', obj)).toBe('first, second');
        });
    });

    describe('for simple type', () => {
        it('Boolean', () => {
            Boolean.prototype.toPostgres = self => self + 1;
            const a = true;
            expect(pgp.as.format('$1', a)).toBe('2');
            expect(pgp.as.format('$1', [a])).toBe('2');
            delete Boolean.prototype.toPostgres;
        });
        it('Number', () => {
            const a = 2;
            Number.prototype.toPostgres = self => (self + 3).toString();
            Number.prototype.rawType = true;
            expect(pgp.as.format('$1', a)).toBe('5');
            expect(pgp.as.format('$1', [a])).toBe('5');
            delete Number.prototype.toPostgres;
            delete Number.prototype.rawType;
        });
        it('String', () => {
            const a = 'true';
            String.prototype.toPostgres = self => self === 'true' ? true : self;
            expect(pgp.as.format('$1', a)).toBe('true');
            expect(pgp.as.format('$1', [a])).toBe('true');
            delete String.prototype.toPostgres;
        });
    });

    describe('for ctf symbols', () => {
        const ctf = pgp.as.ctf;
        it('must recognize symbolic ctf', () => {
            expect(pgp.as.format('$1', {[ctf.toPostgres]: () => 'ok'})).toBe('\'ok\'');
        });
        it('must recognize symbolic ctf for simple types', () => {
            const value = 0;
            Number.prototype[ctf.toPostgres] = () => 'ok';
            expect(pgp.as.format('$1', value)).toBe('\'ok\'');
            delete Number.prototype[ctf.toPostgres];
        });
        it('must support symbolic rawType', () => {
            expect(pgp.as.format('$1', {[ctf.toPostgres]: () => 'ok', [ctf.rawType]: true})).toBe('ok');
        });
        it('must ignore explicit rawType for symbolic ctf', () => {
            expect(pgp.as.format('$1', {[ctf.toPostgres]: () => 'ok', rawType: true})).toBe('\'ok\'');
        });
        it('must ignore symbolic rawType for explicit ctf', () => {
            expect(pgp.as.format('$1', {toPostgres: () => 'ok', [ctf.rawType]: true})).toBe('\'ok\'');
        });
    });
});

describe('SQL Names', function () {

    describe('direct', function () {
        it('must format correctly', function () {
            expect(pgp.as.format('$1~', 'name')).toBe('"name"');
            expect(pgp.as.format('$1~', '"name"')).toBe('"""name"""');
            expect(pgp.as.format('${name~}', {name: 'hello'})).toBe('"hello"');
        });
    });

    describe('from a function', function () {
        function getName() {
            return 'hello';
        }

        it('must use the function result', function () {
            expect(pgp.as.format('$1:name', getName)).toBe('"hello"');
        });
    });

    describe('from a mixed type', function () {

        function CS(name) {
            this.name = name;
            this.toPostgres = function () {
                return this.name;
            };
        }

        const csTest = new CS('customType');

        function getName() {
            return csTest;
        }

        it('must resolve the mixed type', function () {
            expect(pgp.as.format('$1~', getName)).toBe('"customType"');
        });
    });

    describe('with an object', function () {
        it('must enumerate properties', function () {
            expect(pgp.as.format('$1~', [{one: 1, two: 2}])).toBe('"one","two"');
        });
    });

    describe('with an array', function () {
        it('must enumerate properties', function () {
            expect(pgp.as.format('$1~', [['one', 'two']])).toBe('"one","two"');
        });
    });

    describe('Negative', function () {

        describe('with the wrong object type', function () {
            it('must reject the object with an error', function () {
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

        describe('with an empty object', function () {
            it('must reject the object with an error', function () {
                expect(function () {
                    pgp.as.format('$1~', [{}]);
                }).toThrow(new TypeError('Cannot retrieve sql names from an empty array/object.'));
            });
        });

        describe('with an empty array', function () {
            it('must reject the array with an error', function () {
                expect(function () {
                    pgp.as.format('$1~', [[]]);
                }).toThrow(new TypeError('Cannot retrieve sql names from an empty array/object.'));
            });
        });

        describe('with invalid property', function () {
            it('must reject the property', function () {
                expect(function () {
                    pgp.as.format('$1~', [{'': 1}]);
                }).toThrow(new TypeError('Invalid sql name: ""'));
            });
        });

        describe('with invalid array value', function () {
            it('must reject the value', function () {
                expect(function () {
                    pgp.as.format('$1~', [[1]]);
                }).toThrow(new TypeError('Invalid sql name: 1'));
            });
        });

    });
});
