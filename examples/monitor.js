'use strict';

////////////////////////////////////////////////////
// This is a complete test application, which shows
// how to use the following options:
//
// a) override the default promise library;
// b) use pg-monitor to output all the query events;
// c) change the default theme for pg-monitor.
// d) add log handler to pg-monitor, to log events
//    into a file or elsewhere.
//
// Packages used: pg-promise, pg-monitor, bluebird.
////////////////////////////////////////////////////

var promise = require('bluebird'); // or any other Promise/A+ compatible library;

var options = {
    promiseLib: promise // overriding the default (ES6 Promise);
};

var pgp = require('pg-promise')(options);
// See all options: https://github.com/vitaly-t/pg-promise#initialization-options

var monitor = require('pg-monitor');

monitor.attach(options); // attach to all query events;
// See API: https://github.com/vitaly-t/pg-monitor#attachoptions-events-override

monitor.setTheme('matrix'); // change the default theme;
// Other themes: https://github.com/vitaly-t/pg-monitor/wiki/Color-Themes

monitor.log = function (msg, info) {
    // save the screen messages into your own log file;
};
// See API: https://github.com/vitaly-t/pg-monitor#log

// Database connection details;
var cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};

var db = pgp(cn); // database instance;

// NOTE: The default ES6 Promise doesn't have method `.finally`, but it is
// available within Bluebird library used here as an example.

db.any("select * from users where active=$1", [true])
    .then(function (data) {
        console.log("DATA:", data);
    })
    .catch(function (error) {
        console.log("ERROR:", error);
    })
    .finally(pgp.end); // for immediate app exit, closing the connection pool.
