'use strict';

var $npm = {
    ConnectionParameters: require('pg/lib/connection-parameters'),
    events: require('./events'),
    utils: require('./utils')
};

var pools = {}; // global list of pools

function getPool(ctx, pg) {

    var cp = new $npm.ConnectionParameters(ctx.cn),
        ps = ctx.options.poolStrategy;

    if ($npm.utils.isNull(ps)) {
        ps = 'database'; // default pool strategy
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
        return pools[poolName];
    }

    var p = new pg.Pool(ctx.cn);
    p.on('error', onError);
    pools[poolName] = p;
    return p;
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

/**
 * @typedef PoolStrategy
 * @description
 * ** This is a $[6.x] feature. **
 *
 * This type defines string values supported by property `poolStrategy` (see {@link module:pg-promise Initialization Options}).
 *
 * You can override the default `database` value with one of these, to select a different
 * strategy for allocating new connection pools.
 *
 * @property {string} single
 * Maintain a single pool regardless of the connection parameters.
 *
 * @property {string} machine
 * Create a separate pool for each machine hosting a database server.
 *
 * @property {string} server
 * Create a separate pool for each virtual server (machine + port).
 *
 * @property {string} database
 * **DEFAULT:** Create a separate pool for every database being accessed.
 *
 * @property {string} user
 * Create a separate pool for each database user.
 *
 */
