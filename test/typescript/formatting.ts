/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var value1 = pgPromise.as.array([]);
var value2 = pgPromise.as.array(()=>[]);

var pgp:pgPromise.IMain = pgPromise();

var value3 = pgp.as.array([]);
var value4 = pgp.as.array(()=>[]);
var value5 = pgp.as.format('hello', []);
var value6 = pgp.as.format(new pgPromise.QueryFile(''));
