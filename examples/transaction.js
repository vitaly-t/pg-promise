'use strict';

///////////////////////////////////////////////
// This is to show a complete test application;
///////////////////////////////////////////////

var promise = require('bluebird'); // or any other Promise/A+ compatible library;

var options = {
    promiseLib: promise // overriding the default (ES6 Promise);
};

var pgp = require('pg-promise')(options);
// See also: https://github.com/vitaly-t/pg-promise#initialization-options

// Database connection details;
var cn = {
    host: 'localhost', // 'localhost' is the default;
    port: 5432, // 5432 is the default;
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};
// You can check for all default values in:
// https://github.com/brianc/node-postgres/blob/master/lib/defaults.js

var db = pgp(cn); // database instance;

// NOTE: The default ES6 Promise doesn't have methods `.spread` and `.finally`,
// but they are available within Bluebird library used here as an example.

db.tx(function (t) {
    // t = this;
    return this.batch([
        this.one("insert into users(name) values($1) returning id", "John"),
        this.one("insert into events(code) values($1) returning id", 123)
    ]);
})
    .spread(function (user, event) {
        // print new user id + new event id;
        console.log("DATA:", user.id, event.id);
    })
    .catch(function (error) {
        console.log("ERROR:", error); // print the error;
    })
    .finally(function () {
        // If we do not close the connection pool when exiting the application,
        // it may take 30 seconds (poolIdleTimeout) before the process terminates,
        // waiting for the connection to expire in the pool.

        // But if you normally just kill the process, then it doesn't matter.

        pgp.end(); // for immediate app exit, closing the connection pool.

        // See also:
        // https://github.com/vitaly-t/pg-promise#library-de-initialization
    });
