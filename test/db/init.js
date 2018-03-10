////////////////////////////////////////////////
// Initialization scripts for the test database;
////////////////////////////////////////////////

'use strict';

const con = require('manakin').global;
const dbHeader = require('./header');
const promise = dbHeader.defPromise;
const header = dbHeader({
    query: e => {
        // eslint-disable-next-line
        console.info(e.query); // print all of the queries being executed;
    },
    promiseLib: promise,
    capSQL: true
});

con.success.bright = true;
con.error.bright = true;

const pgp = header.pgp;
const db = header.db;

(function () {

    db.tx('', function* (t) {

        // drop all functions;
        yield t.none('DROP FUNCTION IF EXISTS findUser(int)');
        yield t.none('DROP FUNCTION IF EXISTS getUsers()');

        // drop all tables;
        yield t.none('DROP TABLE IF EXISTS audit');
        yield t.none('DROP TABLE IF EXISTS person');
        yield t.none('DROP TABLE IF EXISTS users');
        yield t.none('DROP TABLE IF EXISTS images');

        // create all tables;
        yield t.none('CREATE TABLE audit(id serial, event text, created timestamptz, ref int)');
        yield t.none('CREATE TABLE person(id serial, name text, dob date)');
        yield t.none('CREATE TABLE users(id serial, login text, active boolean)');
        yield t.none('CREATE TABLE images(id serial, name text, data bytea)');

        // insert records into 'users';
        yield t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-1', true]);
        yield t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-2', true]);
        yield t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-3', false]);
        yield t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-4', false]);

        // insert records into 'person';
        yield t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['David', new Date(1995, 8, 7)]);
        yield t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['John', new Date(1980, 3, 20)]);
        yield t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['Mark', new Date(1973, 5, 12)]);
        yield t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['Peter', new Date(1992, 11, 3)]);

        // adding functions;
        yield t.none('CREATE OR REPLACE FUNCTION findUser(userId int) RETURNS SETOF users AS $$ SELECT * FROM users WHERE id = userId $$ language \'sql\'');
        yield t.none('CREATE OR REPLACE FUNCTION getUsers() RETURNS SETOF users AS $$ SELECT * FROM users $$ language \'sql\'');
    })
        .then(() => {
            // eslint-disable-next-line
            console.success('*** SUCCESS ***');
        })
        .catch(error => {
            // eslint-disable-next-line
            console.error('FAILED:', error);
        })
        .finally(pgp.end);
}());
