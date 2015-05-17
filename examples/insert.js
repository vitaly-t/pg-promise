///////////////////////////////////////////////////////////
// This is to show a complete example of using the library;
///////////////////////////////////////////////////////////

// Loading and initializing the library without any options:
var pgp = require('pg-promise')();

// Database connection details:
var cn = {
    host: 'localhost',
    port: 5432,
    database: 'myDatabase',
    user: 'myUser',
    password: 'myPassword'
};

var db = pgp(cn); // database instance;

db.query("select * from users where active=$1", true)
    .then(function (data) {
        console.log(data); // print data;
    }, function (reason) {
        console.log(reason); // print error;
    })
    .done(function () {
        // If we do not close the connection pool when exiting the application,
        // it may take 30 seconds or so before the process terminates, waiting
        // for the connection pool to expire.

        pgp.end(); // closing the connection pool;
    });
