import * as pgPromise from '../../typescript/pg-promise';

const utils = pgPromise.utils;

const pgp: pgPromise.IMain = pgPromise();

const utilsExtra = pgp.utils;

utils.camelize('');

utils.camelizeVar('');

const tree = utils.enumSql('', {recursive: true, ignoreErrors: true}, (file: string, name: string, path: string) => {

});

function testTaskArgs() {
    const args = utils.taskArgs<{ first: string, second: boolean }>(arguments);
    args.options.tag = 123;
    args.options.mode = null;
    args.options.cnd = new Error();

    args.options.first = '';
    args.options.second = true;
}

testTaskArgs();
