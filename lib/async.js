/////////////////////////////////
// Generator-to-Promise adapter;
function async(generator) {

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

        try {
            return handle(g.next());
        } catch (ex) {
            return $p.reject(ex);
        }
    }
}

var $p;

module.exports = function (p) {
    $p = p;
    return async;
};
