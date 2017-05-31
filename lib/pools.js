'use strict';

var $npm = {
    ConnectionParameters: require('pg/lib/connection-parameters'),
    events: require('./events'),
    utils: require('./utils')
};

var pools = {};

function getPool(cn, pg) {
    var poolName, cp = new $npm.ConnectionParameters(cn);
    poolName = cp.host + '/' + cp.port + '/' + cp.database;
    if (poolName in pools) {
        return pools[poolName];
    }
    var pool = new pg.Pool(cn);
    pool.on('error', onError);
    pools[poolName] = pool;
    return pool;
}

function shutDown() {
    for (var p in pools) {
        pools[p].removeListener('error', onError);
        pools[p].end();
    }
    pools = {};
}

function onError(err) {
    var ctx = err.client.$ctx;
    $npm.events.error(ctx.options, err, {
        cn: $npm.utils.getSafeConnection(ctx.cn),
        dc: ctx.dc
    });
}

module.exports = {
    getPool, shutDown
};
