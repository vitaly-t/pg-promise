/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';
import * as pgSubset from 'pg-subset';

var pgp:pgPromise.IMain = pgPromise();

var pg = pgp.pg;

var client = new pg.Client({});
var query = new pg.Query();
var connection = new pg.Connection();

var database = pg.defaults.database;

var col:pgSubset.IColumn;
var res:pgSubset.IResult;
