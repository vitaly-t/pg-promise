'use strict';

var $npm = {
    pg: require('pg'),
    utils: require('./utils'),
    events: require('./events')
};

var $p; // promise interface;

///////////////////////////////////////////////
// Acquires and resolves with a new connection
// object from the connection pool;
function connect(ctx) {
    return $p(function (resolve, reject) {
        $npm.pg.connect(ctx.cn, function (err, client, done) {
            if (err) {
                $npm.events.error(ctx.options, err, {
                    cn: $npm.utils.getSafeConnection(ctx.cn)
                });
                reject(err);
            } else {
                resolve({
                    client: client,
                    done: function () {
                        done();
                        $npm.events.disconnect(ctx.options, client);
                    }
                });
                $npm.events.connect(ctx.options, client);
            }
        });
    });
}

module.exports = function (p) {
    $p = p;
    return connect;
};
