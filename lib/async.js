'use strict';

var $p; // promise interface;

/////////////////////////////////
// Generator-to-Promise adapter;
//
// Based on: https://www.promisejs.org/generators/#both
function asyncAdapter(generator) {
    return function () {
        var g = generator.apply(this, arguments);

        function handle(result) {
            if (result.done) {
                return $p.resolve(result.value);
            }
            return $p.resolve(result.value)
                .then(function (res) {
                    return handle(g.next(res));
                }, function (err) {
                    return handle(g.throw(err));
                });
        }

        return handle(g.next());
    }
}

/**
 * ES6 generators
 * @module async
 * @author Vitaly Tomilov
 * @private
 */
module.exports = function (p) {
    $p = p;
    return asyncAdapter;
};
