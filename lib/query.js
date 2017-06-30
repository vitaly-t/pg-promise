'use strict';

const npm = {
    utils: require('./utils'),
    special: require('./special'),
    QueryFile: require('./queryFile'),
    formatting: require('./formatting'),
    result: require('./result'),
    errors: require('./errors'),
    events: require('./events'),
    stream: require('./stream'),
    types: require('./types')
};

const QueryResultError = npm.errors.QueryResultError,
    InternalError = npm.utils.InternalError,
    ExternalQuery = npm.types.ExternalQuery,
    PreparedStatement = npm.types.PreparedStatement,
    ParameterizedQuery = npm.types.ParameterizedQuery,
    SpecialQuery = npm.special.SpecialQuery,
    qrec = npm.errors.queryResultErrorCode;

const badMask = npm.result.one | npm.result.many; // unsupported combination bit-mask;

//////////////////////////////
// Generic query method;
function $query(ctx, query, values, qrm, config) {

    let isResult;
    const $p = config.promise;

    if (qrm instanceof SpecialQuery) {
        if (qrm.isStream) {
            return npm.stream.call(this, ctx, query, values, config);
        }
        isResult = qrm.isResult;
    }

    const opt = ctx.options,
        capSQL = opt.capSQL;

    let error, isFunc,
        pgFormatting = opt.pgFormatting,
        params = pgFormatting ? values : undefined;

    if (!query) {
        error = new TypeError('Empty or undefined query.');
    }

    if (!error && typeof query === 'object') {
        if (query instanceof npm.QueryFile) {
            query.prepare();
            if (query.error) {
                error = query.error;
                query = query.file;
            } else {
                query = query.query;
            }
        } else {
            if ('funcName' in query) {
                isFunc = true;
                query = query.funcName; // query is a function name;
            } else {
                if (query instanceof ExternalQuery) {
                    pgFormatting = true;
                } else {
                    if ('name' in query) {
                        query = new PreparedStatement(query);
                        pgFormatting = true;
                    } else {
                        if ('text' in query) {
                            query = new ParameterizedQuery(query);
                            pgFormatting = true;
                        }
                    }
                }
                if (query instanceof ExternalQuery && !npm.utils.isNull(values)) {
                    query.values = values;
                }
            }
        }
    }

    if (!error) {
        if (!pgFormatting && !npm.utils.isText(query)) {
            error = new TypeError(isFunc ? 'Invalid function name.' : 'Invalid query format.');
        }
        if (query instanceof ExternalQuery) {
            const qp = query.parse();
            if (qp instanceof Error) {
                error = qp;
            } else {
                query = qp;
            }
        }
    }

    if (!error && !isResult) {
        if (npm.utils.isNull(qrm)) {
            qrm = npm.result.any; // default query result;
        } else {
            if (qrm !== parseInt(qrm) || (qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
                error = new TypeError('Invalid Query Result Mask specified.');
            }
        }
    }

    if (!error && (!pgFormatting || isFunc)) {
        try {
            // use 'pg-promise' implementation of values formatting;
            if (isFunc) {
                params = undefined;
                query = npm.formatting.formatFunction(query, values, capSQL);
            } else {
                query = npm.formatting.formatQuery(query, values);
            }
        } catch (e) {
            if (isFunc) {
                const prefix = capSQL ? 'SELECT * FROM' : 'select * from';
                query = prefix + ' ' + query + '(...)';
            } else {
                params = values;
            }
            error = e instanceof Error ? e : new npm.utils.InternalError(e);
        }
    }

    return $p((resolve, reject) => {

        if (notifyReject()) {
            return;
        }
        error = npm.events.query(opt, getContext());
        if (notifyReject()) {
            return;
        }
        const start = Date.now();
        try {
            ctx.db.client.query(query, params, (err, result) => {
                let data;
                if (!err) {
                    npm.utils.addReadProp(result, 'duration', Date.now() - start);
                    npm.utils.addReadProp(result.rows, 'duration', result.duration, true);
                    if (result.rows.length) {
                        err = npm.events.receive(opt, result.rows, result, getContext());
                        err = err || error;
                    }
                }
                if (err) {
                    error = err;
                } else {
                    if (isResult) {
                        data = result; // raw object requested (Result type);
                    } else {
                        data = result.rows;
                        const len = data.length;
                        if (len) {
                            if (len > 1 && qrm & npm.result.one) {
                                // one row was expected, but returned multiple;
                                error = new QueryResultError(qrec.multiple, result, query, params);
                            } else {
                                if (!(qrm & (npm.result.one | npm.result.many))) {
                                    // no data should have been returned;
                                    error = new QueryResultError(qrec.notEmpty, result, query, params);
                                } else {
                                    if (!(qrm & npm.result.many)) {
                                        data = data[0];
                                    }
                                }
                            }
                        } else {
                            // no data returned;
                            if (qrm & npm.result.none) {
                                if (qrm & npm.result.one) {
                                    data = null;
                                } else {
                                    data = qrm & npm.result.many ? data : null;
                                }
                            } else {
                                error = new QueryResultError(qrec.noData, result, query, params);
                            }
                        }
                    }
                }
                if (!notifyReject()) {
                    resolve(data);
                }
            });
        } catch (e) {
            // this can only happen as a result of an internal failure within node-postgres,
            // like during a sudden loss of communications, which is impossible to reproduce
            // automatically, so removing it from the test coverage:
            // istanbul ignore next
            error = e;
        }

        function getContext() {
            let client;
            if (ctx.db) {
                client = ctx.db.client;
            } else {
                error = new Error('Loose request outside an expired connection.');
            }
            return {
                client, query, params,
                dc: ctx.dc,
                ctx: ctx.ctx
            };
        }

        notifyReject();

        function notifyReject() {
            const context = getContext();
            if (error) {
                if (error instanceof InternalError) {
                    error = error.error;
                }
                npm.events.error(opt, error, context);
                reject(error);
                return true;
            }
        }
    });
}

module.exports = config => {
    return function (ctx, query, values, qrm) {
        return $query.call(this, ctx, query, values, qrm, config);
    };
};
