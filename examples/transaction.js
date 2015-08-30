///////////////////////////////////////////////
// This is to show a complete test application;
///////////////////////////////////////////////

// Loading and initializing the library without options;
// See also: https://github.com/vitaly-t/pg-promise#initialization-options
var pgp = require('pg-promise')(/*options*/);

var promise = require('bluebird'); // or any other Promise/A+ compatible library;

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

db.tx(function (t) {
    // t = this
    return promise.all([
        t.one("insert into users(name) values($1) returning id", "John"),
        t.one("insert into events(code) values($1) returning id", 123)
    ]);
})
    .then(function (data) {
        console.log(data[0].id); // print new user id;
        console.log(data[1].id); // print new event id;
    }, function (reason) {
        console.log(reason); // print error;
    })
    .done(function () {
        // If we do not close the connection pool when exiting the application,
        // it may take 30 seconds (poolIdleTimeout) before the process terminates,
        // waiting for the connection to expire in the pool.

        // But if you normally just kill the process, then it doesn't matter.

        pgp.end(); // closing the connection pool, to exit immediately.

        // See also:
        // https://github.com/vitaly-t/pg-promise#library-de-initialization
    });
