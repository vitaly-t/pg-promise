////////////////////////////////////////////////
// Initialization scripts for the test database;
////////////////////////////////////////////////

var promise = require('bluebird');

var dbHeader = require('./header')({
    query: function (e) {
        console.log(e.query); // print all of the queries;
    }
});

var pgp = dbHeader.pgp;
var db = dbHeader.db;

(function () {

    db.tx(function (t) {
        return promise.all([

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
            t.none("insert into users(login, active) values($1,$2)", ['user-1', true]),
            t.none("insert into users(login, active) values($1,$2)", ['user-2', true]),
            t.none("insert into users(login, active) values($1,$2)", ['user-3', false]),
            t.none("insert into users(login, active) values($1,$2)", ['user-4', false]),

            // insert records into 'person';
            t.none("insert into person(name, dob) values($1,$2::date)", ['David', new Date(1995, 08, 7)]),
            t.none("insert into person(name, dob) values($1,$2::date)", ['John', new Date(1980, 03, 20)]),
            t.none("insert into person(name, dob) values($1,$2::date)", ['Mark', new Date(1973, 05, 12)]),
            t.none("insert into person(name, dob) values($1,$2::date)", ['Peter', new Date(1992, 11, 3)])
        ]);
    })
        .then(function () {
            console.log("\r\n*** SUCCESS ***");
        }, function (reason) {
            console.log("\r\n*** FAILED: " + reason);
        })
        .done(function () {
            pgp.end();
        });
}());
