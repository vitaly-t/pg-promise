import * as pgPromise from '../../typescript/pg-promise';

const err1 = <pgPromise.errors.QueryResultError>null;
const query = err1.query;

const err2 = <pgPromise.errors.QueryFileError>null;
const line = err2.error.position.line;

const err3 = <pgPromise.errors.PreparedStatementError>null;
const file = err3.error.file;

const qrec = pgPromise.errors.queryResultErrorCode;
const t = qrec.multiple;
