/// <reference path='../../typescript/pg-promise' />

import * as pgPromise from 'pg-promise';

var result = new pgPromise.errors.QueryResultError();
var resultCheck = result instanceof pgPromise.errors.QueryResultError;

var query = new pgPromise.errors.QueryFileError();
var queryCheck = result instanceof pgPromise.errors.QueryFileError;
var line = query.error.position.line;

var ps = new pgPromise.errors.PreparedStatementError();
var queryCheck = result instanceof pgPromise.errors.PreparedStatementError;
var file = ps.error.file;

var qrec = pgPromise.errors.queryResultErrorCode;
var t = qrec.multiple;
