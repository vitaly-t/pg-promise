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
    formatDBType(a: any) {

    }

    // _rawDBType:boolean;
}

const ctf = new CTF();

const testCTF = pgp.as.format(ctf);

const testFunc1 = pgp.as.func(() => {
});

const testFunc2 = pgp.as.func(a => {
    return 123;
});
