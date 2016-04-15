/// <reference path='../../typescript/pg-promise' />

import * as pgMinify from 'pg-minify';

var sql = pgMinify('sql--comment');

var pec = pgMinify.parsingErrorCode.multiLineQI;

var err = new pgMinify.SQLParsingError();

var line = err.position.line;
