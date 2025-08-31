const exec = require('child_process').exec;
const path = require('path');
const TIMEOUT = 20000; // 20 SECONDS

describe('Typescript', () => {
    describe('build', () => {
        it('must build without error', done => {
            exec('tsc', {cwd: path.join('test', 'typescript')}, error => {
                expect(error).toBe(null);
                done();
            });
        }, TIMEOUT);
    });
});
