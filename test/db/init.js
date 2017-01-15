////////////////////////////////////////////////
// Initialization scripts for the test database;
////////////////////////////////////////////////

'use strict';

var dbHeader = require('./header');
var promise = dbHeader.defPromise;
var header = dbHeader({
    query: function (e) {
        console.log(e.query); // print all of the queries being executed;
    },
    promiseLib: promise
});

var pgp = header.pgp;
var db = header.db;

(function () {

    db.tx(function (t) {
        return t.batch([

            // drop all functions;
            t.none("drop function if exists findUser(int)"),
            t.none("drop function if exists getUsers()"),

            // drop all tables;
            t.none("drop table if exists audit"),
            t.none("drop table if exists person"),
            t.none("drop table if exists users"),
            t.none("drop table if exists images"),

            // create all tables;
            t.none("create table audit(id serial, event text, created timestamptz, ref int)"),
            t.none("create table person(id serial, name text, dob date)"),
            t.none("create table users(id serial, login text, active boolean)"),
            t.none("create table images(id serial, name text, data bytea)"),

            // insert records into 'users';
            t.none("insert into users(login, active) values($1, $2)", ['user-1', true]),
            t.none("insert into users(login, active) values($1, $2)", ['user-2', true]),
            t.none("insert into users(login, active) values($1, $2)", ['user-3', false]),
            t.none("insert into users(login, active) values($1, $2)", ['user-4', false]),

            // insert records into 'person';
            t.none("insert into person(name, dob) values($1, $2)", ['David', new Date(1995, 8, 7)]),
            t.none("insert into person(name, dob) values($1, $2)", ['John', new Date(1980, 3, 20)]),
            t.none("insert into person(name, dob) values($1, $2)", ['Mark', new Date(1973, 5, 12)]),
            t.none("insert into person(name, dob) values($1, $2)", ['Peter', new Date(1992, 11, 3)]),

            // adding functions;
            t.none("create or replace function findUser(userId int) returns setof users as $$ select * from users where id = userId $$ language 'sql'"),
            t.none("create or replace function getUsers() returns setof users as $$ select * from users $$ language 'sql'")
        ]);
    })
        .then(function () {
            console.log("*** SUCCESS ***");
        })
        .catch(function (error) {
            console.log("FAILED:", error);
        })
        .finally(pgp.end);
}());
