//////////////////////////////////////////////////
// Database connection header used in every test;
//////////////////////////////////////////////////

var pgpLib = require('../../lib/index');

// Either match your local database configuration according to the details below,
// or the other way round - change the details to match your local configuration.
var cn = {
    host: 'localhost',  // server name or IP address;
    port: 5432,         // default port;
    database: 'pg_promise_test', // local database name for testing;
    user: 'postgres'    // user name;
    // password: - add password, if needed;
};

module.exports = function (options) {
    var result = {
        pgp: pgpLib(options)
    };
    result.db = result.pgp(cn);
    return result;
};
