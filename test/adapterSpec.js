'use strict';

const pgp = require('../lib/index');
const PromiseAdapter = pgp.PromiseAdapter;

const dummy = () => {
};

describe('Adapter', () => {

    describe('with invalid parameters', () => {
        const error = 'Adapter requires an api configuration object.';
        it('must throw an error', () => {
            expect(() => {
                new PromiseAdapter();
            }).toThrow(error);
            expect(() => {
                new PromiseAdapter(null);
            }).toThrow(error);
            expect(() => {
                new PromiseAdapter(123);
            }).toThrow(error);
            expect(() => {
                new PromiseAdapter('test');
            }).toThrow(error);
        });
    });

    describe('with invalid \'create\'', () => {
        it('must throw an error', () => {
            expect(() => {
                new PromiseAdapter({});
            }).toThrow('Function \'create\' must be specified.');
        });
    });

    describe('with invalid \'resolve\'', () => {
        it('must throw an error', () => {
            expect(() => {
                new PromiseAdapter({create: dummy});
            }).toThrow('Function \'resolve\' must be specified.');
        });
    });

    describe('with invalid \'reject\'', () => {
        it('must throw an error', () => {
            expect(() => {
                new PromiseAdapter({create: dummy, resolve: dummy});
            }).toThrow('Function \'reject\' must be specified.');
        });
    });

    describe('with invalid \'all\'', () => {
        it('must throw an error', () => {
            expect(() => {
                new PromiseAdapter({create: dummy, resolve: dummy, reject: dummy});
            }).toThrow('Function \'all\' must be specified.');
        });
    });

    describe('with all valid parameters', () => {
        it('must be successful', () => {
            const adapter = new PromiseAdapter({create: dummy, resolve: dummy, reject: dummy, all: dummy});
            expect(adapter instanceof PromiseAdapter).toBe(true);
        });
    });

});
