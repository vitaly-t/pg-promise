// Initialization scripts for the test database;

var promise = require('bluebird');
var dbHeader = require('./dbHeader')({
    query: function (client, query) {
        console.log(query); // print all of the queries;
    }
});

var pgp = dbHeader.pgp;
var db = dbHeader.db;

(function () {

    db.tx(function (ctx) {
        return promise.all([
            ctx.none("drop table if exists audit"),
            ctx.none("drop table if exists person"),
            ctx.none("drop table if exists users"),
            ctx.none("drop table if exists images"),

            ctx.none("create table audit(id serial, event text, created timestamptz, ref int)"),
            ctx.none("create table person(id serial, name text, dob date)"),
            ctx.none("create table users(id serial, login text, active boolean)"),
            ctx.none("create table images(id serial, name text, data bytea)")
        ]);
    })
        .then(function () {
            return db.tx(function (ctx) {
                return promise.all([
                    ctx.none("insert into users(login, active) values($1,$2)", ['user-1', true]),
                    ctx.none("insert into users(login, active) values($1,$2)", ['user-2', true]),
                    ctx.none("insert into users(login, active) values($1,$2)", ['user-3', false]),

                    ctx.none("insert into person(name, dob) values($1,$2::date)", ['John', new Date(1980, 03, 20)]),
                    ctx.none("insert into person(name, dob) values($1,$2::date)", ['Mark', new Date(1973, 05, 12)]),
                    ctx.none("insert into person(name, dob) values($1,$2::date)", ['Peter', new Date(1992, 11, 3)])
                ]);
            });
        })
        .done(function () {
            pgp.end();
        });
}());
