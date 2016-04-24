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
    PS: require('./prepared')
};

var QueryResultError = $npm.errors.QueryResultError,
    qrec = $npm.errors.queryResultErrorCode;

//////////////////////////////
// Generic query method;
function $query(ctx, query, values, qrm, config) {

    var isResult = false, $p = config.promise;

    if (qrm instanceof $npm.special.SpecialQuery) {
        if (qrm.isStream) {
            return $npm.stream.call(this, ctx, query, values, config);
        }
        isResult = qrm.isResult;
    }

    var errMsg,
        isFile = query instanceof $npm.queryFile,
        isFunc = !isFile && $npm.utils.isObject(query, ['funcName']), // function call;
        opt = ctx.options,
        pgFormatting = opt && opt.pgFormatting,
        capSQL = (opt && opt.capSQL),
        params = pgFormatting ? values : undefined;

    if (!isFile && !(query instanceof $npm.PS) && $npm.utils.isObject(query, ['name', 'text'])) {
        query = new $npm.PS(query);
    }

    if (query instanceof $npm.PS) {
        pgFormatting = true;
    }

    return $p(function (resolve, reject) {

        if (isFunc) {
            query = query.funcName; // query is a function name;
        }

        if (isFile) {
            query.prepare();
            if (query.error) {
                errMsg = query.error;
                query = query.file;
            } else {
                query = query.query;
            }
        }

        if (!errMsg) {
            if (!pgFormatting && !$npm.utils.isText(query)) {
                errMsg = isFunc ? "Invalid function name." : "Invalid query format.";
            }
            if (query instanceof $npm.PS) {
                var ps = query.parse();
                if (ps instanceof $npm.errors.PreparedStatementError) {
                    errMsg = ps;
                } else {
                    query = ps;
                }
            }
        }

        if (!errMsg && !isResult) {
            if ($npm.utils.isNull(qrm)) {
                qrm = $npm.result.any; // default query result;
            } else {
                var badMask = $npm.result.one | $npm.result.many; // the combination isn't supported;
                var isInteger = typeof qrm === 'number' && isFinite(qrm) && Math.floor(qrm) === qrm;
                if (!isInteger || (qrm & badMask) === badMask || qrm < 1 || qrm > 6) {
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
                if (errMsg instanceof $npm.utils.InternalError) {
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
