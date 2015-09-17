////////////////////////////////////////////////////
// This is a complete test application, which shows
// how to use the following options:
// a) override the default promise library;
// b) use pg-monitor to output all the query events;
// c) change the default theme for pg-monitor.
//
// Packages used: pg-promise, pg-monitor, bluebird.
////////////////////////////////////////////////////

var promise = require('bluebird');

var options = {
    promiseLib: promise // default promise override;
};
// See all options: https://github.com/vitaly-t/pg-promise#initialization-options

var pgp = require('pg-promise')(options);

var monitor = require('pg-monitor');
monitor.setTheme('matrix'); // change the default theme;

monitor.attach(options); // attach to all query events;
// Method API: https://github.com/vitaly-t/pg-monitor#attachoptions-events-override

// Database connection details;
var cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};

var db = pgp(cn); // database instance;

db.query("select * from users where active=$1", true)
    .then(function (data) {
        console.log("DATA:", data);
    }, function (reason) {
        console.log("REASON:", reason);
    })
    .done(pgp.end); // closes the connection pool, for immediate exit.
