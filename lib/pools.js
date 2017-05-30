'use strict';

var ConnectionParameters = require('pg/lib/connection-parameters');

var pools = {};

function getPool(cn, pg) {
    var poolName, cp = new ConnectionParameters(cn);
    poolName = cp.host + '/' + cp.port + '/' + cp.database;
    if (poolName in pools) {
        return pools[poolName];
    }
    var pool = new pg.Pool(cn);
    pools[poolName] = pool;
    return pool;
}

function shutDown() {
    for (var p in pools) {
        pools[p].end();
    }
    pools = {};
}

module.exports = {
    getPool, shutDown
};
