import * as pgPromise from '../../typescript/pg-promise';

var err1 = <typeof pgPromise.errors.QueryResultError>null;
var query = err1.query;

var err2 = <typeof pgPromise.errors.QueryFileError>null;
var line = err2.error.position.line;

var err3 = <typeof pgPromise.errors.PreparedStatementError>null;
var file = err3.error.file;

var qrec = pgPromise.errors.queryResultErrorCode;
var t = qrec.multiple;
