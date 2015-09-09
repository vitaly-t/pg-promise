'use strict';

// documented in index.js
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
            while (item instanceof Function) {
                item = item.call(self, self);
            }
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
        });
        function check() {
            if (!--remaining) {
                if (errors.length) {
                    for (var i = 0; i < result.length; i++) {
                        if (errors.indexOf(i) < 0) {
                            result[i] = {success: true, result: result[i]};
                        }
                    }
                    reject(result);
                } else {
                    resolve(result);
                }
            }
        }
    });
}

// documented in index.js
function $sequence(factory, noTracking, cb) {

    var self = this;

    if (typeof factory !== 'function') {
        // TODO: Review why i'm not throwing an error here instead;
        return $p.reject("Invalid factory function specified.");
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

////////////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === null || value === undefined;
}

var $p;

module.exports = function (promise) {
    $p = promise;
    return {
        batch: $batch,
        sequence: $sequence
    };
};
