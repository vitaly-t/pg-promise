'use strict';

const pgp = require('../lib/index');
const PromiseAdapter = pgp.PromiseAdapter;

const dummy = function () {
};

describe('Adapter', function () {

    describe('with invalid parameters', function () {
        const error = new TypeError('Adapter requires an api configuration object.');
        it('must throw an error', function () {
            expect(function () {
                new PromiseAdapter();
            }).toThrow(error);
            expect(function () {
                new PromiseAdapter(null);
            }).toThrow(error);
            expect(function () {
                new PromiseAdapter(123);
            }).toThrow(error);
            expect(function () {
                new PromiseAdapter('test');
            }).toThrow(error);
        });
    });

    describe('with invalid \'create\'', function () {
        it('must throw an error', function () {
            expect(function () {
                new PromiseAdapter({});
            }).toThrow('Function \'create\' must be specified.');
        });
    });

    describe('with invalid \'resolve\'', function () {
        it('must throw an error', function () {
            expect(function () {
                new PromiseAdapter({create: dummy});
            }).toThrow('Function \'resolve\' must be specified.');
        });
    });

    describe('with invalid \'reject\'', function () {
        it('must throw an error', function () {
            expect(function () {
                new PromiseAdapter({create: dummy, resolve: dummy});
            }).toThrow('Function \'reject\' must be specified.');
        });
    });

    describe('with invalid \'all\'', function () {
        it('must throw an error', function () {
            expect(function () {
                new PromiseAdapter({create: dummy, resolve: dummy, reject: dummy});
            }).toThrow('Function \'all\' must be specified.');
        });
    });

    describe('with valid parameters', function () {
        it('must be successful with new', function () {
            const adapter = new PromiseAdapter({create: dummy, resolve: dummy, reject: dummy, all: dummy});
            expect(adapter instanceof PromiseAdapter).toBe(true);
        });
        it('must be successful without new', function () {
            // eslint-disable-next-line
            const adapter = PromiseAdapter({create: dummy, resolve: dummy, reject: dummy, all: dummy});
            expect(adapter instanceof PromiseAdapter).toBe(true);
        });
        it('must be successful with wrong context', function () {
            const obj = {};
            const adapter = PromiseAdapter.call(obj, {create: dummy, resolve: dummy, reject: dummy, all: dummy});
            expect(adapter instanceof PromiseAdapter).toBe(true);
        });
    });

});
