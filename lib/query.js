'use strict';

var $npm = {
    utils: require('./utils'),
    special: require('./special'),
    queryFile: require('./queryFile'),
    formatting: require('./formatting'),
    result: require('./result'),
    errors: require('./errors'),
    events: require('./events'),
    stream: require('./stream'),
    types: require('./types')
};

var QueryResultError = $npm.errors.QueryResultError,
    ExternalQuery = $npm.types.ExternalQuery,
    PreparedStatement = $npm.types.PreparedStatement,
    ParameterizedQuery = $npm.types.ParameterizedQuery,
    InternalError = $npm.utils.InternalError,
    SpecialQuery = $npm.special.SpecialQuery,
    qrec = $npm.errors.queryResultErrorCode;

var badMask = $npm.result.one | $npm.result.many; // the combination isn't supported;

//////////////////////////////
// Generic query method;
function $query(ctx, query, values, qrm, config) {

    var isResult, $p = config.promise;

    if (qrm instanceof SpecialQuery) {
        if (qrm.isStream) {
            return $npm.stream.call(this, ctx, query, values, config);
        }
        isResult = qrm.isResult;
    }

    var errMsg, isFunc,
        opt = ctx.options,
        pgFormatting = opt.pgFormatting,
        capSQL = opt.capSQL,
        params = pgFormatting ? values : undefined;

    if (query && typeof query === 'object') {
        if (query instanceof $npm.queryFile) {
            query.prepare();
            if (query.error) {
                errMsg = query.error;
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
                if (query instanceof ExternalQuery && !$npm.utils.isNull(values)) {
                    query.values = values;
                }
            }
        }
    }

    if (!errMsg) {
        if (!pgFormatting && !$npm.utils.isText(query)) {
            errMsg = isFunc ? "Invalid function name." : "Invalid query format.";
        }
        if (query instanceof ExternalQuery) {
            var qp = query.parse();
            if (qp instanceof Error) {
                errMsg = qp;
            } else {
                query = qp;
            }
        }
    }

    if (!errMsg && !isResult) {
        if ($npm.utils.isNull(qrm)) {
            qrm = $npm.result.any; // default query result;
        } else {
            if (qrm !== parseInt(qrm) || (qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
                errMsg = "Invalid Query Result Mask specified.";
            }
        }
    }

    if (!errMsg && (!pgFormatting || isFunc)) {
        try {
            // use 'pg-promise' implementation of values formatting;
            if (isFunc) {
                query = $npm.formatting.formatFunction(query, values, capSQL);
            } else {
                query = $npm.formatting.formatQuery(query, values);
            }
        } catch (e) {
            if (isFunc) {
                var prefix = capSQL ? 'SELECT * FROM' : 'select * from';
                query = prefix + ' ' + query + '(...)';
            }
            errMsg = e;
            params = values;
        }
    }

    return $p(function (resolve, reject) {

        if (notifyReject()) {
            return;
        }
        errMsg = $npm.events.query(opt, getContext());
        if (notifyReject()) {
            return;
        }
        var start = Date.now();
        try {
            ctx.db.client.query(query, params, function (err, result) {
                var data;
                if (!err) {
                    $npm.utils.addReadProp(result, 'duration', Date.now() - start);
                    $npm.utils.addReadProp(result.rows, 'duration', result.duration, true);
                    if (result.rows.length) {
                        err = $npm.events.receive(opt, result.rows, result, getContext());
                        err = err || errMsg;
                    }
                }
                if (err) {
                    errMsg = err;
                } else {
                    if (isResult) {
                        data = result; // raw object requested (Result type);
                    } else {
                        data = result.rows;
                        var len = data.length;
                        if (len) {
                            if (len > 1 && qrm & $npm.result.one) {
                                // one row was expected, but returned multiple;
                                errMsg = new QueryResultError(qrec.multiple, result, query, params);
                            } else {
                                if (!(qrm & ($npm.result.one | $npm.result.many))) {
                                    // no data should have been returned;
                                    errMsg = new QueryResultError(qrec.notEmpty, result, query, params);
                                } else {
                                    if (!(qrm & $npm.result.many)) {
                                        data = data[0];
                                    }
                                }
                            }
                        } else {
                            // no data returned;
                            if (qrm & $npm.result.none) {
                                if (qrm & $npm.result.one) {
                                    data = null;
                                } else {
                                    data = qrm & $npm.result.many ? data : undefined;
                                }
                            } else {
                                errMsg = new QueryResultError(qrec.noData, result, query, params);
                            }
                        }
                    }
                }
                if (!notifyReject()) {
                    resolve(data);
                }
            });
        } catch (e) {
            // can only happen when pgFormatting = true;
            errMsg = e;
        }

        function getContext() {
            var client;
            if (ctx.db) {
                client = ctx.db.client;
            } else {
                errMsg = "Loose request outside an expired connection.";
            }
            return {
                client: client,
                dc: ctx.dc,
                query: query,
                params: params,
                ctx: ctx.ctx
            };
        }

        notifyReject();

        function notifyReject() {
            var context = getContext();
            if (errMsg !== undefined) {
                if (errMsg instanceof InternalError) {
                    errMsg = errMsg.message;
                }
                $npm.events.error(opt, errMsg, context);
                reject(errMsg);
                return true;
            }
        }
    });
}

module.exports = function (config) {
    return function (ctx, query, values, qrm) {
        return $query.call(this, ctx, query, values, qrm, config);
    };
};
