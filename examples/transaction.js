/* eslint-disable */

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
    password: 'myPassword',

    // to auto-exit on idle, without having to shut down the pool;
    // see https://github.com/vitaly-t/pg-promise#library-de-initialization
    allowExitOnIdle: true
};
// You can check for all default values in:
// https://github.com/brianc/node-postgres/blob/master/packages/pg/lib/defaults.js

const db = pgp(cn); // database instance;

db.tx(async t => {
    const user = await t.one('INSERT INTO users(name) VALUES($1) RETURNING id', 'John');
    const event = await t.one('INSERT INTO events(code) VALUES($1) RETURNING id', 123);
    return {user, event};
})
    .then(({user, event}) => {
        // print new user id + new event id;
        console.log('DATA:', user.id, event.id);
    })
    .catch(error => {
        console.log('ERROR:', error); // print the error;
    });
