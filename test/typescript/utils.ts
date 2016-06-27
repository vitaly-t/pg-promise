/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var utils = pgPromise.utils;

var pgp:pgPromise.IMain = pgPromise();

var utilsExtra = pgp.utils;

utils.camelize('');

utils.camelizeVar('');

var tree = utils.enumSql('', {recursive: true, ignoreErrors: true}, (file, name, path)=> {

});

utils.objectToCode(tree, (value, name, obj)=> {

});

var a:string = utils.buildSqlModule();

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
