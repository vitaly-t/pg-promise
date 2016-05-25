'use strict';

// Number of times it is faster than the standard 'map', by Node.js versions:
// 0.10.44: ~2.8
// 0.11.16: ~3.8
// 0.12.13: ~3.8
// 4.4.4: ~1.38
// 5.11.0: ~1.44
// 6.1.0: ~8.25
function map(cb, obj) {
    var res = new Array(this.length);
    if (obj) {
        for (var i = 0; i < this.length; i++) {
            res[i] = cb.call(obj, this[i], i, this);
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            res[i] = cb(this[i], i, this);
        }
    }
    return res;
}

// Number of times it is faster than the standard 'filter', by Node.js versions:
// 0.10.44: ~2.42
// 0.11.16: ~2.83
// 0.12.13: ~2.78
// 4.4.4: ~1.12
// 5.11.0: ~1.14
// 6.1.0: ~7.54
function filter(cb, obj) {
    var res = [];
    if (obj) {
        for (var i = 0; i < this.length; i++) {
            if (cb.call(obj, this[i], i, this)) {
                res.push(this[i]);
            }
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            if (cb(this[i], i, this)) {
                res.push(this[i]);
            }
        }
    }
    return res;
}

// Number of times it is faster than the standard 'forEach', by Node.js versions:
// 0.10.44: ~3.11
// 0.11.16: ~4.6
// 0.12.13: ~4.4
// 4.4.4: ~1.55
// 5.11.0: ~1.54
// 6.1.0: ~1.21
function forEach(cb, obj) {
    if (obj) {
        for (var i = 0; i < this.length; i++) {
            cb.call(obj, this[i], i, this);
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            cb(this[i], i, this);
        }
    }
}

//////////////////////////
// Custom Methods
//////////////////////////

// Counts elements based on a condition;
function countIf(cb, obj) {
    var count = 0;
    if (obj) {
        for (var i = 0; i < this.length; i++) {
            count += cb.call(obj, this[i], i, this) ? 1 : 0;
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            count += cb(this[i], i, this) ? 1 : 0;
        }
    }
    return count;
}

(function () {
    var prefix = '$';
    var methods = [map, filter, forEach, countIf];
    forEach.call(methods, function (m) {
        Object.defineProperty(Array.prototype, prefix + m.name, {
            enumerable: false,
            value: m
        });
    });
})();

module.exports = {
    map: map,
    filter: filter,
    forEach: forEach,
    countIf: countIf
};
