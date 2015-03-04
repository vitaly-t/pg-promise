# Introduction
This library unifies [Promise] and [PG] to help writing easy-to-read database code that relies on promises:
* Simplistic approach to organizing streamlined database code, thanks to full [Promise] integration;
* Database connections are managed automatically, in every usage case;
* Functions, Procedures and Transactions are all fully supported;
* Robust approach to handling results from every single query.

# Install
```
$ npm install pg-promise
```

# Getting started

### 1. Load the library
```javascript
var pgpLib = require('pg-promise');
```
### 2. Configure database connection
```javascript
var config = {
    host: 'localhost',
    port: 5432,
    database: 'my_db_name',
    user: 'postgres',
    password: 'bla-bla'
};
```
The library itself doesn't use this object at all, just passing it on to PG to interpret and use (see ```ConnectionParameters``` in [PG] package for details).
This also means that you can pass a connection string instead, it is up to [PG] then to figure what it is and process accordingly.

You can replace ```config``` with a connection string variable that uses the syntax as shown below, and it would work exactly the same.
```javascript
var conString = "postgres://username:password@host:port/database";
```

### 3. Initialize the library
```javascript
var pgp = pgpLib(config);
```
NOTE: Only one global instance should be used throughout the application.

Now you are ready to use it. See chapter Advanced for the use of parameter ```options``` during initialization.

# Usage
### The basics
In order to eliminate the chances of unexpected query results and make code more robust, each request is parametrized with the expected/supported
return result mask, using type ```queryResult``` as shown below:
```javascript
queryResult = {
    one: 1,     // single-row result is expected;
    many: 2,    // multi-row result is expected;
    none: 4     // no rows expected.
};
```
In the following generic-query example we indicate that the call must return either no records or multiple records:
```javascript
pgp.query("select * from users", queryResult.none | queryResult.many);
```
This usage pattern is facilitated through result-specific methods that can be used instead of the generic query:
```javascript
pgp.many("select * from users"); // one or more records are expected
pgp.one("select * from users limit 1"); // one record is expected
pgp.none("update users set active=TRUE where id=1"); // no records expected
```
There are also mixed-result methods, aptly named ```oneOrNone``` and ```manyOrNone```.

Each of the query calls returns a [Promise] object, as shown below, to be used in the standard way.
And when the expected and actual results do not match, the call will be rejected.
```javascript
pgp.many("select * from users").then(function(data){
    console.log(data); // printing the data received
},function(reason){
    console.log(reason); // printing the reason why the call was rejected
});
```
### Functions and Procedures
In PostgreSQL stored procedures are just functions that usually do not return anything.

Suppose we want to call a function to find audit records by user id and maximum timestamp. We can make the call as shown below:
```javascript
pgp.func('findAudit', [
    123,
    new Date()
]);
```
We passed it user Id = 123, plus current Date/Time as the timestamp. We assume that the function signature matches the parameters that we passed.
All values passed are serialized automatically to comply with PostgreSQL requirements.

And when you are not expecting any return results, call ```pgp.proc``` instead. Both methods return a promise object.

### Transactions
Every call shown in chapters above would acquire a new connection from the pool and release it when done. In order to execute a transaction on the same
connection, a transaction class is to be used.

Example:
```javascript
var promise = require('promise');

var tx = new pgp.tx(); // creating a new transaction object
tx.exec(function(){
    return promise.all([
        tx.none("update users set active=TRUE where id=123"),
        tx.one("insert into audit(entity, id) values('users', 123) returning id")
    ]);
}).then(function(data){
    console.log(data); // printing successful transaction output
}, function(reason){
    console.log(reason); // printing the reason why the transaction was rejected
});
```
In the example above we create a new transaction object and call its method ```exec```, passing it a call-back function that must do all the queries needed and return a [Promise] object. In the example we use ````promise.all```` to indicate that we want both queries inside the transaction to succeed to consider it a success; otherwise the transaction is to be rolled back.

<b>Notes</b>
1. While inside a transaction, we make calls to the same-named methods as outside of transactions, except we do it on the transaction object instance now, as opposed to the global ````pgp```` object, which gives us access to the shared connection object. The same goes for calling functions and procedures within transactions, using ````tx.func```` and ````tx.proc```` accordingly.
2. Just for flexibility, the transaction call-back function takes one parameter - client connection object.

### Type Helpers
The library provides several helper functions to convert basic javascript types into their proper PostgreSQL presentation that can be passed directly into
queries or functions as parameters. All of such helper functions are located within namespace ```pgp.as```:
```javascript
pgp.as.bool(value); // returns proper PostgreSQL boolean presentation

pgp.as.text(value); // returns proper PostgreSQL text presentation,
                    // fixing single-quote symbols, wrapped in quotes

pgp.as.date(value); // returns proper PostgreSQL date/time presentation,
                    // wrapped in quotes.
```
As these helpers are not associated with a connection, and thus can be called from anywhere.

# Advanced

### Initialization options
Initialization options are supported as shown in the example:
```javascript
var options = {
    connect: function(client){
        var cn = client.connectionParameters;
        console.log("Connected to database '" + cn.database + "'");
    },
    disconnect: function(client){
        var cn = client.connectionParameters;
        console.log("Disconnected from database '" + cn.database + "'");
    }
};
var pgp = pgpLib(config, options);
```
Two events supported at the moment - ```connect``` and ```disconnect```, to notify of virtual connections being established or released accordingly.
Each event takes parameter ```client```, which is the client connection object. These events are mostly for connection monitoring, while debugging your application.

### De-initialization
When exiting your application, make the following call:
```javascript
pgp.end();
```
This will release pg connection pool globally and make sure that the process terminates without delay.
If you do not call it, your process may be waiting for 30 seconds (default) or so, waiting for the pg connection pool to expire.

### Direct connection usage
The library exposes method ```connect``` in case of some unique reason that you may want to manage the connection yourself, as opposed to trusting the library
doing it for you automatically.

Usage example:
```javascript
pgp.connect().then(function(db){
    // connection was established successfully;

    // do stuff with the connection object (db.client) and/or queries;

    // when done with all the queries, call done():
    db.done();

}, function(reason){
    // failed to connect;
    console.log('Connection problem: ' + reason);
});
```
<b>NOTE:</b> When using the direct connection, events ```connect``` and ```disconnect``` won't be fired.

# History
* First solid Beta, 0.1.2 on March 4th, 2015.
* It reached first Beta version 0.1.0 on March 4th, 2015.
* The first draft v0.0.1 was published on March 3rd, 2015, and then rapidly incremented due to many initial changes that had to come in, mostly documentation.

[PG]:https://github.com/brianc/node-postgres
[Promise]:https://github.com/then/promise

# License

Copyright (c) 2014-2015 Vitaly Tomilov (vitaly.tomilov@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
