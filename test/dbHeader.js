// Reusable database connection header;

var pgpLib = require('../lib/index');

var cn = {
    host: 'localhost',
    port: 5432,
    database: 'pg_promise_test',
    user: 'postgres'
};

module.exports = function (options) {
    var result = {
        pgp: pgpLib(options)
    };
    result.db = result.pgp(cn);
    return result;
};
