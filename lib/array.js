'use strict';

// Number of times it is faster than the standard 'map', by Node.js versions:
// 0.10.44: ~2.8
// 0.11.16: ~3.8
// 0.12.13: ~3.8
// 4.4.4: ~1.38
// 5.11.0: ~1.44
// 6.1.0: ~8.25
function map(arr, cb, obj) {
    var res = new Array(arr.length);
    if (obj) {
        for (var i = 0; i < arr.length; i++) {
            res[i] = cb.call(obj, arr[i], i, arr);
        }
    } else {
        for (var k = 0; k < arr.length; k++) {
            res[k] = cb(arr[k], k, arr);
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
function filter(arr, cb, obj) {
    var res = [];
    if (obj) {
        for (var i = 0; i < arr.length; i++) {
            if (cb.call(obj, arr[i], i, arr)) {
                res.push(arr[i]);
            }
        }
    } else {
        for (var k = 0; k < arr.length; k++) {
            if (cb(arr[k], k, arr)) {
                res.push(arr[k]);
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
function forEach(arr, cb, obj) {
    if (obj) {
        for (var i = 0; i < arr.length; i++) {
            cb.call(obj, arr[i], i, arr);
        }
    } else {
        for (var k = 0; k < arr.length; k++) {
            cb(arr[k], k, arr);
        }
    }
}

//////////////////////////
// Custom Methods
//////////////////////////

// Counts elements based on a condition;
function countIf(arr, cb, obj) {
    var count = 0;
    if (obj) {
        for (var i = 0; i < arr.length; i++) {
            count += cb.call(obj, arr[i], i, arr) ? 1 : 0;
        }
    } else {
        for (var k = 0; k < arr.length; k++) {
            count += cb(arr[k], k, arr) ? 1 : 0;
        }
    }
    return count;
}

module.exports = {
    map: map,
    filter: filter,
    forEach: forEach,
    countIf: countIf
};

Object.freeze(module.exports);
