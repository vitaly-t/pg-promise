'use strict';

//////////////////////////////////////////////////////
// Attempts to resolve every value in the input array.
//
// See detailed documentation in index.js
function $batch(values) {
    if (!Array.isArray(values)) {
        throw new Error("Array of values is required to execute a batch.");
    }
    if (!values.length) {
        return $p.resolve([]);
    }
    var self = this;
    return $p(function (resolve, reject) {
        var errors = [], remaining = values.length,
            result = new Array(remaining);
        values.forEach(function (item, i) {
            var err;
            while (item instanceof Function) {
                try {
                    item = item.call(self, self);
                } catch (e) {
                    err = e;
                    break;
                }
            }
            if (err) {
                result[i] = {success: false, result: err};
                errors.push(i);
                check();
            } else {
                if (isNull(item) || typeof item.then !== 'function') {
                    result[i] = item;
                    check();
                } else {
                    item
                        .then(function (data) {
                            result[i] = data;
                            check();
                        }, function (reason) {
                            result[i] = {success: false, result: reason};
                            errors.push(i);
                            check();
                        });
                }
            }
        });
        function check() {
            if (!--remaining) {
                if (errors.length) {
                    if (errors.length < result.length) {
                        errors.sort();
                        for (var i = 0, k = 0; i < result.length; i++) {
                            if (i === errors[k]) {
                                k++;
                            } else {
                                result[i] = {success: true, result: result[i]};
                            }
                        }
                    }
                    result.getErrors = function () {
                        var err = new Array(errors.length);
                        for (var i = 0; i < errors.length; i++) {
                            err[i] = result[errors[i]].result;
                        }
                        return err;
                    };
                    reject(result);
                } else {
                    resolve(result);
                }
            }
        }
    });
}

////////////////////////////////////////////////////////////////////////
// Sequentially resolves dynamic promises returned by a promise factory.
//
// See detailed documentation in index.js
function $sequence(factory, noTracking, cb) {

    var self = this;

    if (typeof factory !== 'function') {
        throw new Error("Invalid factory function specified.");
    }
    var idx = 0, result = [];

    function loop() {
        var obj;
        try {
            obj = factory.call(self, idx, self); // get next promise;
        } catch (e) {
            return $p.reject(e);
        }
        if (isNull(obj)) {
            // no more promises left in the sequence;
            return $p.resolve(noTracking ? idx : result);
        }
        if (typeof obj.then !== 'function') {
            // the result is not a promise;
            return $p.reject("Invalid promise returned by factory for index " + idx);
        }
        return obj
            .then(function (data) {
                if (!noTracking) {
                    result.push(data); // accumulate resolved data;
                }
                if (cb instanceof Function) {
                    try {
                        cb(idx, data);
                    } catch (err) {
                        return $p.reject(err);
                    }
                }
                idx++;
                return loop();
            });
    }

    return loop();
}

/////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === null || value === undefined;
}

var $p; // promise wrapper;

module.exports = function (promise) {
    $p = promise;
    return {
        batch: $batch,
        sequence: $sequence
    };
};
