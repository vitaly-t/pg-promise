'use strict';

/**
 * ES6 generators
 * @module async
 * @author Vitaly Tomilov
 * @private
 */
module.exports = config => {

    /////////////////////////////////
    // Generator-to-Promise adapter;
    //
    // Based on: https://www.promisejs.org/generators/#both
    return generator => {
        var $p = config.promise;
        return function () {
            var g = generator.apply(this, arguments);

            var handle = result => {
                if (result.done) {
                    return $p.resolve(result.value);
                }
                return $p.resolve(result.value)
                    .then(data => handle(g.next(data)))
                    .catch(err => handle(g.throw(err)));
            };

            return handle(g.next());
        };
    };

};
