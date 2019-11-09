////////////////////////////////////////////////
// Initialization scripts for the test database;
////////////////////////////////////////////////

const con = require('manakin').global;
const dbHeader = require('./header');
const promise = dbHeader.defPromise;

const header = dbHeader({
    query: e => {
        // eslint-disable-next-line no-console
        console.info(e.query); // print all of the queries being executed;
    },
    promiseLib: promise,
    capSQL: true
});

con.success.bright = true;
con.error.bright = true;

const pgp = header.pgp;
const db = header.db;

(async function () {

    let serverHighVer; // PostgreSQL Server Version

    await db.connect()
        .then(c => {
            serverHighVer = +c.client.version.split('.')[0];
            c.done();
        });

    await db.tx(async t => {

        // drop all functions;
        await t.none('DROP FUNCTION IF EXISTS "findUser"(int)');
        await t.none('DROP FUNCTION IF EXISTS get_users()');

        // drop all tables;
        await t.none('DROP TABLE IF EXISTS audit');
        await t.none('DROP TABLE IF EXISTS person');
        await t.none('DROP TABLE IF EXISTS users');
        await t.none('DROP TABLE IF EXISTS images');

        // create all tables;
        await t.none('CREATE TABLE audit(id serial, event text, created timestamptz, ref int)');
        await t.none('CREATE TABLE person(id serial, name text, dob date)');
        await t.none('CREATE TABLE users(id serial, login text, active boolean)');
        await t.none('CREATE TABLE images(id serial, name text, data bytea)');

        // insert records into 'users';
        await t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-1', true]);
        await t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-2', true]);
        await t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-3', false]);
        await t.none('INSERT INTO users(login, active) VALUES($1, $2)', ['user-4', false]);

        // insert records into 'person';
        await t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['David', new Date(1995, 8, 7)]);
        await t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['John', new Date(1980, 3, 20)]);
        await t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['Mark', new Date(1973, 5, 12)]);
        await t.none('INSERT INTO person(name, dob) VALUES($1, $2)', ['Peter', new Date(1992, 11, 3)]);

        // adding functions & procedures;
        await t.none('CREATE OR REPLACE FUNCTION "findUser"(userId int) RETURNS SETOF users AS $$ SELECT * FROM users WHERE id = userId $$ language \'sql\'');
        await t.none('CREATE OR REPLACE FUNCTION get_users() RETURNS SETOF users AS $$ SELECT * FROM users $$ language \'sql\'');

        if (serverHighVer >= 11) {
            // Stored procedures require PostgreSQL v11 or later:
            await t.none('CREATE OR REPLACE PROCEDURE test_proc() LANGUAGE SQL AS $$ $$;');
        }
    })
        .then(() => {
            // eslint-disable-next-line no-console
            console.success('*** SUCCESS ***');
        })
        .catch(error => {
            // eslint-disable-next-line no-console
            console.error('FAILED:', error);
        })
        .finally(pgp.end);
}());
