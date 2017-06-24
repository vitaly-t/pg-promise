import * as pgPromise from '../../typescript/pg-promise';

const utils = pgPromise.utils;

const pgp: pgPromise.IMain = pgPromise();

const utilsExtra = pgp.utils;

utils.camelize('');

utils.camelizeVar('');

const tree = utils.enumSql('', {recursive: true, ignoreErrors: true}, (file: string, name: string, path: string) => {

});

utils.objectToCode(tree, (value, name, obj) => {

});

const a: string = utils.buildSqlModule();

utils.buildSqlModule('');

utils.buildSqlModule({
    dir: ''
});

utils.buildSqlModule({
    dir: '',
    recursive: true,
    ignoreErrors: true,
    output: '',
    module: {
        name: '',
        path: ''
    }
});
