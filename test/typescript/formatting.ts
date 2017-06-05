import * as pgPromise from '../../typescript/pg-promise';

var value1 = pgPromise.as.array([]);
var value2 = pgPromise.as.array(() => []);

var pgp: pgPromise.IMain = pgPromise();

var value3 = pgp.as.array([]);
var value4 = pgp.as.array(() => []);
var value5 = pgp.as.format('hello', []);
var value6 = pgp.as.format(new pgPromise.QueryFile(''));

var alias = pgp.as.alias('a');
alias = pgp.as.alias(() => 'a');

class CTF {
    formatDBType(a: any) {

    }

    // _rawDBType:boolean;
}

var ctf = new CTF();

var testCTF = pgp.as.format(ctf);

var testFunc1 = pgp.as.func(() => {
});

var testFunc2 = pgp.as.func(a => {
    return 123;
});
