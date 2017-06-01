'use strict';

var $npm = {
    ConnectionParameters: require('pg/lib/connection-parameters'),
    events: require('./events'),
    utils: require('./utils')
};

var pools = {}; // global list of pools

function getPool(ctx, pg, db) {

    var cp = new $npm.ConnectionParameters(ctx.cn),
        ps = ctx.options.poolStrategy;

    if ($npm.utils.isNull(ps)) {
        ps = 'server'; // default pool strategy
    }

    var poolName = 'global';

    switch (ps) {
        case 'single':
            // maintain a single pool regardless of the connection parameters
            break;
        case 'machine':
            // create a separate pool for each machine hosting a database server
            poolName = cp.host;
            break;
        case 'server':
            // create a separate pool for each virtual server (machine + port)
            poolName = cp.host + '/' + cp.port;
            break;
        case 'database':
            // create a separate pool for every database being accessed
            poolName = cp.host + '/' + cp.port + '/' + cp.database;
            break;
        case 'user':
            // create a separate pool for each database user
            poolName = cp.host + '/' + cp.port + '/' + cp.database + '/' + cp.user;
            break;
        default:
            throw new TypeError('Invalid value for \'poolStrategy\' specified: ' + JSON.stringify(ps));
    }

    if (poolName in pools) {
        return pools[poolName].pool;
    }

    var p = new pg.Pool(ctx.cn);
    p.on('error', onError);
    pools[poolName] = {
        pool: p, db
    };
    return p;
}

function shutDown() {
    for (var p in pools) {
        pools[p].db.$pool = null;
        pools[p].pool.removeListener('error', onError);
        pools[p].pool.end(); // Mr. Dead Pool :)
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

// This is for tests and diagnostics:
function getAllPools() {
    var res = {};
    for (var p in pools) {
        res[p] = pools[p].pool;
    }
    return res;
}

module.exports = {
    getPool,
    getAllPools,
    shutDown
};

/**
 * @typedef PoolStrategy
 * @description
 * ** This is a $[6.x] feature. **
 *
 * This type defines string values supported by property `poolStrategy` (see {@link module:pg-promise Initialization Options}).
 *
 * You can override the default (`server`) value with one of these, to select a different
 * strategy for allocating new connection pools (see $[pg-pool]).
 *
 * @property {string} single
 * Maintains a single pool regardless of the connection parameters.
 *
 * This singleton pattern makes sure that only one connection pool is used throughout the process.
 *
 * @property {string} machine
 * Creates a separate pool for each machine hosting a database server.
 *
 * A new pool is created for each unique `host` parameter in the connection.
 *
 * @property {string} server
 * **DEFAULT:** Creates a separate pool for each virtual server (machine + port).
 *
 * Each unique pair of `host` + `port` in the connection is allocated a separate connection pool.
 *
 * @property {string} database
 * Creates a separate pool for every database being accessed.
 *
 * Each unique combination of `host` + `port` + `database` in the connection is allocated a separate connection pool.
 *
 * @property {string} user
 * Creates a separate pool for each database user.
 *
 * Each unique combination of `host` + `port` + `database` + `user` in the connection is allocated a separate connection pool.
 *
 */
