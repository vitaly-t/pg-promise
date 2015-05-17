///////////////////////////////////////////////////////////
// This is to show a complete example of using the library;
///////////////////////////////////////////////////////////

// Loading and initializing the library without any options:
var pgp = require('pg-promise')();

var promise = require('bluebird'); // or any other Promise/A+ compatible library;

// Database connection details:
var cn = {
    host: 'localhost',
    port: 5432,
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};

var db = pgp(cn); // database instance;

db.tx(function (t) {
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
        // it may take 30 seconds or so before the process terminates, waiting
        // for the connection pool to expire.

        pgp.end(); // closing the connection pool;
    });
