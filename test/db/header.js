//////////////////////////////////////////////////
// Database connection header used in every test;
//////////////////////////////////////////////////

'use strict';

const pgpLib = require('../../lib/index');
const defPromise = require('bluebird'); // default promise library;

defPromise.config({
    warnings: false
});

// Either match your local database configuration according to the details below,
// or the other way round - change the details to match your local configuration.
const cn = {
    host: 'localhost', // server name or IP address;
    port: 5432, // default port;
    database: 'pg_promise_test', // local database name for testing;
    user: 'postgres' // user name;
    // password: - add password, if needed;
};

pgpLib.suppressErrors = true; // suppress console output for error messages;

function main(options, dc) {
    const pgNative = eval(process.env.PG_NATIVE);
    if (pgNative) {
        if (options && typeof options === 'object') {
            if (!('pgNative' in options)) {
                options.pgNative = true;
            }
        } else {
            if (!options) {
                options = {
                    pgNative: true
                };
            }
        }
    }
    const result = {
        pgpLib, cn,
        pgp: pgpLib(options)
    };
    result.db = result.pgp(cn, dc);
    return result;
}

main.defPromise = defPromise;

module.exports = main;
