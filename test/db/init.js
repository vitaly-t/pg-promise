////////////////////////////////////////////////
// Initialization scripts for the test database;
////////////////////////////////////////////////

'use strict';

var dbHeader = require('./header');
var promise = dbHeader.promise;
var header = dbHeader({
    query: function (e) {
        console.log(e.query); // print all of the queries;
    },
    promiseLib: promise
});

var pgp = header.pgp;
var db = header.db;

(function () {

    db.tx(function () {
        return promise.all([

            // drop all functions;
            this.none("drop function if exists findUser(int)"),
            this.none("drop function if exists getUsers()"),

            // drop all tables;
            this.none("drop table if exists audit"),
            this.none("drop table if exists person"),
            this.none("drop table if exists users"),
            this.none("drop table if exists images"),

            // create all tables;
            this.none("create table audit(id serial, event text, created timestamptz, ref int)"),
            this.none("create table person(id serial, name text, dob date)"),
            this.none("create table users(id serial, login text, active boolean)"),
            this.none("create table images(id serial, name text, data bytea)"),

            // insert records into 'users';
            this.none("insert into users(login, active) values($1,$2)", ['user-1', true]),
            this.none("insert into users(login, active) values($1,$2)", ['user-2', true]),
            this.none("insert into users(login, active) values($1,$2)", ['user-3', false]),
            this.none("insert into users(login, active) values($1,$2)", ['user-4', false]),

            // insert records into 'person';
            this.none("insert into person(name, dob) values($1,$2::date)", ['David', new Date(1995, 8, 7)]),
            this.none("insert into person(name, dob) values($1,$2::date)", ['John', new Date(1980, 3, 20)]),
            this.none("insert into person(name, dob) values($1,$2::date)", ['Mark', new Date(1973, 5, 12)]),
            this.none("insert into person(name, dob) values($1,$2::date)", ['Peter', new Date(1992, 11, 3)]),

            // adding functions;
            this.none("create or replace function findUser(userId int) returns setof users as $$ select * from users where id = userId $$ language 'sql';"),
            this.none("create or replace function getUsers() returns setof users as $$ select * from users $$ language 'sql';")
        ]);
    })
        .then(function () {
            console.log("*** SUCCESS ***");
        }, function (reason) {
            console.log("FAILED:", reason);
        })
        .done(function () {
            pgp.end();
        });
}());
