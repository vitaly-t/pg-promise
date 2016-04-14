'use strict';

var $npm = {
    utils: require('./utils'),
    events: require('./events')
};

module.exports = function (config) {

    // Acquires and resolves with a new connection object from the connection pool;
    return function (ctx) {
        return config.promise(function (resolve, reject) {
            config.pg.connect(ctx.cn, function (err, client, done) {
                if (err) {
                    $npm.events.error(ctx.options, err, {
                        cn: $npm.utils.getSafeConnection(ctx.cn),
                        dc: ctx.dc
                    });
                    reject(err);
                } else {
                    resolve({
                        client: client,
                        done: function () {
                            done();
                            $npm.events.disconnect(ctx, client);
                        }
                    });
                    $npm.events.connect(ctx, client);
                }
            });
        });
    }
};
