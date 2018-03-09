'use strict';

const exec = require('child_process').exec;
const path = require('path');

describe('Typescript', () => {
    describe('build', () => {
        it('must build without error', done => {
            exec('tsc', {cwd: path.join('test', 'typescript')}, error => {
                expect(error).toBe(null);
                done();
            });
        });
    });
});
