/// <reference path="../../typescript/pg-promise" />

import * as pgPromise from "pg-promise";

var pgp = pgPromise();

var pg = pgp.pg;

var client = new pg.Client({});
var query = new pg.Query();
var connection = new pg.Connection();

var database = pg.defaults.database;
