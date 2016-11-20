import * as pgMinify from '../../typescript/pg-minify';

var sql = pgMinify('sql--comment');

var pec = pgMinify.parsingErrorCode.multiLineQI;

var err = new pgMinify.SQLParsingError();

var line = err.position.line;
