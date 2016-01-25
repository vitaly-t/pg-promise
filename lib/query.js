'use strict';

var $npm = {
    utils: require('./utils'),
    special: require('./special'),
    queryFile: require('./queryFile'),
    formatting: require('./formatting'),
    result: require('./result'),
    errors: require('./errors'),
    events: require('./events')
};

var $p; // promise interface;

//////////////////////////////
// Generic query method;
function $query(ctx, query, values, qrm) {

    var isResult = false;
    if (qrm instanceof $npm.special.SpecialQuery) {
        if (qrm.isStream) {
            return $npm.stream.call(this, ctx, query, values);
        }
        isResult = qrm.isResult;
    }
    var errMsg, textErr,
        isFile = query instanceof $npm.queryFile,
        isFunc = !isFile && $npm.utils.isObject(query, ['funcName']), // function call;
        isPS = !isFile && $npm.utils.isObject(query, ['name', 'text']), // prepared statement;
        opt = ctx.options,
        pgFormatting = (opt && opt.pgFormatting) || isPS,
        params = pgFormatting ? values : undefined;

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
                textErr = isFunc ? "Function name" : "Query";
            }
            if (isPS) {
                if (!$npm.utils.isText(query.name)) {
                    textErr = "Property 'name' in prepared statement";
                } else {
                    if (!$npm.utils.isText(query.text)) {
                        textErr = "Property 'text' in prepared statement";
                    }
                }
            }
            if (textErr) {
                errMsg = textErr + " must be a non-empty text string.";
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
                    query = $npm.formatting.formatFunction(query, values);
                } else {
                    query = $npm.formatting.formatQuery(query, values);
                }
            } catch (e) {
                if (isFunc) {
                    query = "select * from " + query + "(...)";
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
        try {
            ctx.db.client.query(query, params, function (err, result) {
                var data;
                if (!err && result.rows.length) {
                    err = $npm.events.receive(opt, result.rows, result, getContext());
                    err = err || errMsg;
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
                                errMsg = "Multiple rows were not expected.";
                            } else {
                                if (!(qrm & ($npm.result.one | $npm.result.many))) {
                                    // no data should have been returned;
                                    errMsg = "No return data was expected.";
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
                                    data = qrm & $npm.result.many ? [] : undefined;
                                }
                            } else {
                                errMsg = "No data returned from the query.";
                            }
                        }
                        if (errMsg) {
                            errMsg = new $npm.errors.QueryResultError(errMsg);
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

module.exports = function (p) {
    $p = p;
    $npm.stream = require('./stream')(p);
    return $query;
};
