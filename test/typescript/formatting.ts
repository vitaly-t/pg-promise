import * as pgPromise from '../../typescript/pg-promise';

const value1 = pgPromise.as.array([]);
const value2 = pgPromise.as.array(() => []);

const pgp: pgPromise.IMain = pgPromise();

const value3 = pgp.as.array([]);
const value4 = pgp.as.array(() => []);
const value5 = pgp.as.format('hello', []);
const value6 = pgp.as.format(new pgPromise.QueryFile(''));

let alias = pgp.as.alias('a');
alias = pgp.as.alias(() => 'a');

class CTF {

    toPostgres(a: any) {

    }

    rawType: boolean;

    // CTF symbols support:

    [pgp.as.ctf.toPostgres](): any {
        return 123;
    };

    // Ops! TypeScript doesn't support it yet!
    // See these issues:
    // - https://github.com/Microsoft/TypeScript/issues/16432
    // - https://github.com/Microsoft/TypeScript/pull/15473
    //
    // [pgp.as.ctf.rawType]: boolean;

}

const ctf = new CTF();

const testCTF = pgp.as.format(ctf);

const testFunc1 = pgp.as.func(() => {
});

const testFunc2 = pgp.as.func(a => {
    return 123;
});
