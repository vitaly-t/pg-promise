const supportsPromise = typeof Promise !== 'undefined';

const header = require('./db/header');

const options = {
    noWarnings: true
};

const dbHeader = header(options);

describe('Library entry function', () => {

    describe('without any promise override', () => {
        it('must return a valid library object', () => {
            if (supportsPromise) {
                const lib = header({noWarnings: true});
                expect(typeof lib.pgp).toBe('function');
            } else {
                expect(() => {
                    header();
                }).toThrow('Promise library must be specified.');
            }
        });
    });

    describe('with invalid options parameter', () => {
        const errBody = 'Invalid "options" parameter: ';
        it('must throw an error', () => {
            expect(() => {
                header(123);
            }).toThrow(errBody + '123');
            expect(() => {
                header('hello');
            }).toThrow(errBody + '"hello"');
        });
    });

    describe('Taking no initialization options', () => {
        it('must be supported', () => {
            expect(typeof dbHeader.pgpLib()).toBe('function');
        });
    });
});
