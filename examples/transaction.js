'use strict';

/*eslint-disable */

///////////////////////////////////////////////
// This is to show a complete test application;
///////////////////////////////////////////////

const promise = require('bluebird'); // or any other Promise/A+ compatible library;

const initOptions = {
    promiseLib: promise // overriding the default (ES6 Promise);
};

const pgp = require('pg-promise')(initOptions);
// See also: http://vitaly-t.github.io/pg-promise/module-pg-promise.html

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

// NOTE: The default ES6 Promise doesn't have methods `.spread` and `.finally`,
// but they are available within Bluebird library used here as an example.

db.tx(t => {
    return t.batch([
        t.one('insert into users(name) values($1) returning id', 'John'),
        t.one('insert into events(code) values($1) returning id', 123)
    ]);
})
    .spread((user, event) => {
        // print new user id + new event id;
        console.log('DATA:', user.id, event.id);
    })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    })
    .finally(db.$pool.end); // For immediate app exit, shutting down the connection pool
// For details see: https://github.com/vitaly-t/pg-promise#library-de-initialization
