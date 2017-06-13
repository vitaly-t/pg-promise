'use strict';

/*eslint-disable */

///////////////////////////////////////////////
// This is to show a complete test application;
///////////////////////////////////////////////

const promise = require('bluebird'); // or any other Promise/A+ compatible library;

const options = {
    promiseLib: promise // overriding the default (ES6 Promise);
};

const pgp = require('pg-promise')(options);
// See also: https://github.com/vitaly-t/pg-promise#initialization-options

// Database connection details;
const cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};
// You can check for all default values in:
// https://github.com/brianc/node-postgres/blob/master/lib/defaults.js

const db = pgp(cn); // database instance;

// NOTE: The default ES6 Promise doesn't have method `.finally`, but it is
// available within Bluebird library used here as an example.

db.any('select * from users where active = $1', [true])
    .then(data => {
        console.log('DATA:', data); // print data;
    })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    })
    .finally(() => {
        // If we do not close the connection pool when exiting the application,
        // it may take 30 seconds (poolIdleTimeout) before the process terminates,
        // waiting for the connection to expire in the pool.

        // But if you normally just kill the process, then it doesn't matter.

        pgp.end(); // for immediate app exit, closing the connection pool.

        // See also:
        // https://github.com/vitaly-t/pg-promise#library-de-initialization
    });
