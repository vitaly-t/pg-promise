'use strict';

/*eslint-disable */

////////////////////////////////////////////////////
// This is a complete test application, which shows
// how to use the following options:
//
// a) override the default promise library;
// b) use pg-monitor to output all the query events;
// c) change the default theme for pg-monitor;
// d) add log handler to pg-monitor, to log events into a file or elsewhere.
//
// Packages used: pg-promise, pg-monitor, bluebird.
////////////////////////////////////////////////////

const promise = require('bluebird'); // or any other Promise/A+ compatible library;

const initOptions = {
    promiseLib: promise // overriding the default (ES6 Promise);
};

const pgp = require('pg-promise')(initOptions);
// See all options: http://vitaly-t.github.io/pg-promise/module-pg-promise.html

const monitor = require('pg-monitor');

monitor.attach(initOptions); // attach to all query events;
// See API: https://github.com/vitaly-t/pg-monitor#attachoptions-events-override

monitor.setTheme('matrix'); // change the default theme;
// Other themes: https://github.com/vitaly-t/pg-monitor/wiki/Color-Themes

monitor.setLog((msg, info) => {
    // save the screen messages into your own log file;
});
// See API: https://github.com/vitaly-t/pg-monitor#log

// Database connection details;
const cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};

const db = pgp(cn); // database instance;

// NOTE: The default ES6 Promise doesn't have method `.finally`, but it is
// available within Bluebird library used here as an example.

db.any('select * from users where active = $1', [true])
    .then(data => {
        console.log('DATA:', data);
    })
    .catch(error => {
        console.log('ERROR:', error);
    })
    .finally(db.$pool.end); // For immediate app exit, shutting down the connection pool
// For details see: https://github.com/vitaly-t/pg-promise#library-de-initialization