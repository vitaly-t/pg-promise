pg-promise
===========

Complete access layer to [node-postgres] via [Promises/A+].

[![Build Status](https://travis-ci.org/vitaly-t/pg-promise.svg?branch=master)](https://travis-ci.org/vitaly-t/pg-promise)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/pg-promise/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/pg-promise?branch=master)

---
<a href="https://promisesaplus.com/"><img align="right" width="190" height="190" src="http://s8.postimg.org/k7dtue8lx/pg_promise.jpg"></a>

* Supporting [Promise], [Bluebird], [When], [Q], etc.
* Transactions, functions, flexible query formatting;
* Automatic database connections;
* Strict query result filters.

---

* [About](#about)
* [Installing](#installing)
* [Testing](#testing)
* [Getting started](#getting-started)
  - [Initializing](#initializing)
  - [Connecting](#connecting)
  - [Learn by Example](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example)  
* [Usage](#usage)
  - [Queries and Parameters](#queries-and-parameters)
    - [Query Result Mask](#query-result-mask)
    - [Custom Type Conversion](#custom-type-conversion)
  - [Named Parameters](#named-parameters)
  - [Conversion Helpers](#conversion-helpers)
  - [Connections](#connections)  
    - [Detached Connections](#detached-connections)
    - [Shared Connections](#shared-connections)
    - [Tasks](#tasks)    
  - [Transactions](#transactions)
    - [Detached Transactions](#detached-transactions)
    - [Shared-connection Transactions](#shared-connection-transactions)
    - [Nested Transactions](#nested-transactions)
    - [Transactions with SAVEPOINT](#transactions-with-savepoint)
    - [Synchronous Transactions](#synchronous-transactions)    
    - [Sequence Benchmark](#sequence-benchmark) 
* [Advanced](#advanced)
  - [Initialization Options](#initialization-options)
    - [pgFormatting](#pgformatting)
    - [promiseLib](#promiselib)
    - [connect](#connect)
    - [query](#query)
    - [error](#error)
    - [task](#task)    
    - [transact](#transact)
    - [extend](#extend)
  - [Library de-initialization](#library-de-initialization)
* [History](#history)
* [License](#license)

---

# About

Built on top of [node-postgres] and its connection pool, this library translates their callback interface into one based on [Promises/A+],
while extending the protocol to a higher level, with automated connections and transactions management.

In addition, the library provides:

* its own, more flexible query formatting;
* event reporting for connectivity, errors, queries and transactions;
* declarative approach to controlling query results;
* support for all popular promise libraries.

# Installing
```
$ npm install pg-promise
```

# Testing
* Install the library's dependencies:
```
$ npm install
```
* Make sure all tests can connect to your local test database, using the connection details in
[test/db/header.js](https://github.com/vitaly-t/pg-promise/blob/master/test/db/header.js).
Either set up your test database accordingly or change the connection details in that file.

* Initialize the database with some test data:
```
$ node test/db/init.js
```
* To run all tests with coverage:
```
$ npm run coverage
```
* To run all tests without coverage:
```
$ npm run test-only
```
NOTE: The default `npm test` is used for updating [coveralls.ie](http://coveralls.io/r/vitaly-t/pg-promise) with the coverage results,
and it is not for local usage.

# Getting started

## Initializing

```javascript
// Loading and initializing the library:
var pgp = require('pg-promise')(/*options*/);
```
You can pass `options` parameter when initializing the library (see chapter [Initialization Options](#advanced)).

## Connecting

Use one of the two ways to specify database connection details:
* Configuration Object:
```javascript
var cn = {
    host: 'localhost', // server name or IP address;
    port: 5432,
    database: 'my_db_name',
    user: 'user_name',
    password: 'user_password'
};
```
* Connection String:
```javascript
var cn = "postgres://username:password@host:port/database";
```

This library doesn't use any of the connection's details, it simply passes them on to [PG] when opening a connection.
For more details see pg connection parameters in [WiKi](https://github.com/brianc/node-postgres/wiki/pg#parameters) and
[implementation](https://github.com/brianc/node-postgres/blob/master/lib/connection-parameters.js).

Create a new database instance from the connection details:
```javascript
var db = pgp(cn);
```
There can be multiple database objects in the application for different connections.

To get started quickly, see our [Learn by Example](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example) tutorial. 

# Usage

## Queries and Parameters

Every connection context of the library shares the same query protocol, starting with generic method `query`,
defined as shown below:

```javascript
function query(query, values, qrm);
```
* `query` (required) - a string with support for three types of formatting, depending on the `values` passed:
   - format `$1` (single variable), if `values` is of type `string`, `boolean`, `number`, `Date`, `function` or `null`;
   - format `$1, $2, etc..`, if `values` is an array;
   - format `$*propName*`, if `values` is an object (not `null` and not `Date`), where `*` is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`;
* `values` (optional) - value/array/object to replace the variables in the query;
* `qrm` - (optional) *Query Result Mask*, as explained below. When not passed, it defaults to `queryResult.any`.

When a value/property inside array/object is an array, it is treated as a [PostgreSQL Array Type](http://www.postgresql.org/docs/9.4/static/arrays.html),
converted into the array constructor format of `array[]`, the same as calling method `as.array()`.

Examples:
```javascript
console.log(pgp.as.array([[1, 2, 3], [4, 5, null]]));
// will print: array[[1,2,3],[4,5,null]]

console.log(pgp.as.array([['one', 'two'], [undefined, 'four']]));
// will print: array[['one','two'],[null,'four']]

console.log(pgp.as.array([[1, 2], ['three', 'four']]));
// will print: array[[1,2],['three','four']],
// but executing it within a query will throw an error
// due to heterogeneous data type in the array.
```

When a value/property inside array/object is of type `object` (except for `null` and `Date`), it is automatically
serialized into JSON, the same as calling method `as.json()`, except the latter would convert anything to JSON.

Raw-text values can be injected by appending the variable name with symbol `^`:
`$1^, $2^, etc...`, `$*varName^*`, where `*` is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

Raw text is injected without any pre-processing, which means:
* No replacing each single-quote symbol `'` with two;
* No wrapping text into single quotes.

This is to allow for special-case variable formatting, like in the following examples:

```javascript
// injecting "John" name without quotes:
query("...WHERE name LIKE '%$1^%'", "John");

// injecting value of property 'name' without quotes:
query("...WHERE name LIKE '%${name^}%'", {name: "John"});

// injecting a CSV-formatted text without quotes:
query("...WHERE id IN($1^)", pgp.as.csv([1,2,3,4])); 
```

### Query Result Mask

In order to eliminate the chances of unexpected query results and thus make the code more robust,
method `query` uses parameter `qrm` (Query Result Mask):
```javascript
///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one + many.
queryResult = {
    one: 1,     // single-row result is expected;
    many: 2,    // multi-row result is expected;
    none: 4,    // no rows expected;
    any: 6      // (default) = many|none = any result.
};
```

In the following generic-query example we indicate that the call can return anything:
```javascript
db.query("select * from users");
```
which is equivalent to making one of the following calls:
```javascript
db.query("select * from users", undefined, queryResult.many | queryResult.none);
db.query("select * from users", undefined, queryResult.any);
db.manyOrNone("select * from users");
db.any("select * from users");
```

This usage pattern is facilitated through result-specific methods that can be used instead of the generic query:
```javascript
db.many(query, values); // expects one or more rows
db.one(query, values); // expects a single row
db.none(query, values); // expects no rows
db.any(query, values); // expects anything, same as `manyOrNone`
db.oneOrNone(query, values); // expects 1 or 0 rows
db.manyOrNone(query, values); // expects anything, same as `any`
```

There is however one specific method `queryRaw(query, values)`, with aliases `raw` and `result` to instruct the library
that any result verification is to be bypassed, and instead it must resolve with the original
[Result](https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6) object passed from the [PG] library.

You can also add your own methods and properties to this protocol via the [extend](#extend) event.  

Each query function resolves its **data** object according to the `qrm` that was used:

* `none` - **data** is `undefined`. If the query returns any kind of data, it is rejected.
* `one` - **data** is a single object. If the query returns no data or more than one row of data, it is rejected.
* `many` - **data** is an array of objects. If the query returns no rows, it is rejected.
* `one`|`none` - **data** is `null`, if no data was returned; or a single object, if there was one row of data returned. If the query returns more than one row of data,
the query is rejected.
* `many`|`none` - **data** is an array of objects. When no rows are returned, **data** is an empty array.

If you try to specify `one`|`many` in the same query, such query will be rejected without executing it, telling you that such mask is invalid.

If `qrm` is not specified when calling generic `query` method, it is assumed to be `many`|`none` = `any`, i.e. any kind of data expected.

> This is all about writing robust code, when the client specifies what kind of data it is ready to handle on the declarative level,
leaving the burden of all extra checks to the library.

### Custom Type Conversion

Version 1.9.3 adds support for custom type conversion.

When we pass `values` as a single parameter or inside an array, it is verified to support
function `formatDBType` as either its own or inherited. And if the function exists, it overrides
both the actual value and the formatting meaning of `values`.

This allows use of your own custom types as formatting parameters for the queries, as well as
overriding any of the standard types.

Examples:

**your own type formatting**
```javascript
function Money(m) {
    this.amount = m;
    this.formatDBType = function () {
        return this.amount.toFixed(2);
    }
}
```

**overriding standard types**
```javascript
Date.prototype.formatDBType = function () {
    return this.getTime(); // format Date as a local timestamp;
};
```

Function `formatDBType` is allowed to return absolutely anything, including:
* instance of another object that supports its own custom formatting;
* instance of another object that doesn't have its own custom formatting;
* another function, with recursion of any depth;

Please note that the return result from `formatDBType` may affect even the meaning of
formatting, i.e. the expected formatting syntax.
If you pass `values` as a single parameter, which has function `formatDBType`, then if that function eventually
returns an array, your `query` is expected to use the `$1, $2` type of formatting.
And if `formatDBType` in that case returns a custom-type object that doesn't support custom formatting,
then `query` will be expected to use the `$*propName*` type of formatting.


## Named Parameters

The library supports named parameters in query formatting, with the syntax of `$*propName*`,
where `*` is any of the following open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

```javascript
db.query("select * from users where name=${name} and active=$/active/", {
    name: 'John',
    active: true
});
```

The same goes for all types of query methods as well as method `as.format(query, values)`, where `values`
now can also be an object whose properties can be referred to by name from within the query.

A valid property name consists of any combination of letters, digits, underscores or `$`, and they are case-sensitive.
Leading and trailing spaces around property names are ignored.

It is important to know that while property values `null` and `undefined` are both formatted as `null`,
an error is thrown when the property doesn't exist at all.

## Functions and Procedures

In PostgreSQL stored procedures are just functions that usually do not return anything.

Suppose we want to call function **findAudit** to find audit records by **user id** and maximum timestamp.
We can make such call as shown below:

```javascript
db.func('findAudit', [123, new Date()])
    .then(function(data){
        console.log(data); // printing the data returned
    }, function(reason){
        console.log(reason); // printing the reason why the call was rejected
    });
```

We passed it **user id** = 123, plus current Date/Time as the timestamp. We assume that the function signature matches
the parameters that we passed. All values passed are serialized automatically to comply with PostgreSQL type formats.

Method `func` accepts optional third parameter - `qrm` (Query Result Mask), the same as method `query`.

And when you are not expecting any return results, call `db.proc` instead. Both methods return a [Promise] object,
but `db.proc` doesn't take a `qrm` parameter, always assuming it is `one`|`none`.

Summary for supporting procedures and functions:

```javascript
db.func(query, values, qrm); // expects the result according to `qrm`
db.proc(query, values); // calls db.func(query, values, queryResult.one | queryResult.none)
```

## Conversion Helpers

The library provides several helper functions to convert javascript types into their proper PostgreSQL presentation that can be passed
directly into queries or functions as parameters. All of such helper functions are located within namespace `pgp.as`, and each function
returns a formatted string when successful or throws an error when it fails.

```javascript
pgp.as.bool(value); // converts value into PostgreSQL boolean presentation;

pgp.as.number(value);
                    // converts value into PostgreSQL number presentation,
                    // with support for NaN, +Infinity and -Infinity;

pgp.as.text(value, raw);
                    // converts value into PostgreSQL text presentation,
                    // fixing single-quote symbols and wrapping the result
                    // in quotes (unless flag 'raw' is set);

pgp.as.date(value, raw);
                    // converts value into PostgreSQL date/time presentation,
                    // wrapped in quotes (unless flag 'raw' is set);

pgp.as.json(value, raw);
                    // converts any value into JSON (using JSON.stringify),
                    // then fixes single-quote symbols and wraps it up in
                    // single quotes (unless flag 'raw' is set);

pgp.as.array(value); // converts value-array into PostgreSQL Array Type constructor
                     // string: array[]

pgp.as.csv(value);  // returns a CSV string with values formatted according
                    // to their type, using the above methods;

pgp.as.func(func, raw, obj);
                    // calls the function to get the actual value, and then
                    // formats it according to the returned type + 'raw' flag;
                    // obj - optional, 'this' context for the function. 

pgp.as.format(query, values);
            // replaces variables in the query with their 'values' as specified;
            // 'values' can be a single value, an array or an object.
```

Version 1.4.1 extended methods `bool`, `number`, `text`, `date`, `json`, `array`
and `csv` to accept the value-parameter as a function to be called for resolving
the actual value.

For methods which take optional flag `raw` it is to indicate that the
return text is to be without any pre-processing:
* No replacing each single-quote symbol `'` with two;
* No wrapping text into single quotes;
* Throwing an error when the variable value is `null` or `undefined`.

This adheres to the query formatting, as well as method `as.format` when variable
names are appended with symbol `^`: `$1^, $2^, etc...` or `$*varName^*`, where `*`
is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

As none of these helpers are associated with any database, they can be used from anywhere.

There are some cases where you might want to use a combination of these methods instead
of the implicit parameter formatting through query methods. For example, if you want to
generate a filter string to be used where applicable, you might use a code like this:

```javascript
function createFilter(filter){
    var cnd = []; // conditions;
    if(filter.start){
        // add start date condition;
        cnd.push(pgp.as.format("start >= $1::date", filter.start));
    }
    if(filter.end){
        // add end date condition;
        cnd.push(pgp.as.format("end <= $1::date", filter.end));
    }
    if(filter.active !== undefined){
        // add active flag;
        cnd.push(pgp.as.format("active = $1", filter.active));
    }
    if(filter.name){
        // add name-like condition with a raw-text variable
        // by appending '^' to its name;
        cnd.push(pgp.format("name like '%$1^%'", filter.name));
    }
    return cnd.join(" and "); // returning the complete filter string;
}
```

## Connections

The library supports promise-chained queries on shared and detached connections.
Choosing which one to use depends on the situation and personal preferences.

### Detached Connections

Queries in a detached promise chain maintain connection independently, they each acquire a connection from the pool,
execute the query and then release the connection back to the pool.
```javascript
db.one("select * from users where id=$1", 123) // find the user from id;
    .then(function(data){
        // find 'login' records for the user found:
        return db.query("select * from audit where event=$1 and userId=$2",
            ["login", data.id]);
    })
    .then(function(data){
        // display found audit records;
        console.log(data);
    }, function(reason){
        console.log(reason); // display reason why the call failed;
    })
```
In a situation where a single request is to be made against the database, a detached chain is the only one that makes sense.
And even if you intend to execute multiple queries in a chain, keep in mind that even though each will use its own connection,
such will be used from a connection pool, so effectively you end up with the same connection, without any performance penalty.

### Shared Connections

A promise chain with a shared connection starts with `connect()`, which acquires a connection from the pool to be shared
with all the queries down the promise chain. The connection must be released back to the pool when no longer needed.

```javascript
var sco; // shared connection object;
db.connect()
    .then(function(obj) {
        sco = obj; // save the connection object;
        // find active users created before today:
        return sco.query("select * from users where active=$1 and created < $2",
            [true, new Date()]);
    })
    .then(function(data) {
        console.log(data); // display all the user details;
    }, function(reason) {
        console.log(reason); // display reason why the call failed;
    })
    .done(function() {
        if(sco) {
            sco.done(); // release the connection, if it was successful;
        }
    });
```
Shared-connection chaining is when you want absolute control over the connection, either because you want to execute lots of queries in one go,
or because you like squeezing every bit of performance out of your code. Other than that, the author hasn't seen any performance difference
from the detached-connection chaining. And besides, any long sequence of queries normally resides inside a transaction, which always
uses shared-connection chaining automatically.

**UPDATE:** With [Tasks](#tasks) added below, shared connections become even easier to use.

### Tasks

Version 1.9.0 introduced support for tasks, also replacing the engine for transactions, i.e.
a transaction is now just a special case of a task.

```javascript
db.task(function (t) {
    // this = t;
    // execute a chain of queries and return a promise;
})
    .then(function (data) {
        // success;
    }, function (reason) {
        // failed;
    });
```

Tasks and transactions work in the same way, except a task doesn't execute any of the transaction commands - `BEGIN`/`COMMIT`/`ROLLBACK`.

The purpose of tasks is simply to provide a shared connection context within the callback function to execute and return
a promise chain, and then automatically release the connection.

In other words, it is to simplify the use of [shared connections](#shared-connections), so instead of calling `connect` in the beginning
and `done` in the end (if it was connected successfully), one can call `db.task` instead, execute all queries within
the callback and return the result.

As tasks and transactions share the same engine, they are considered equally important. Therefore, tasks have received
their own [task event](#task) to be notified when a task is being executed. 
 
## Transactions

Transactions can be executed within both shared and detached promise chains in the same way, performing the following actions:

1. Acquires a new connection (detached chains only);
2. Executes `BEGIN` command;
3. Invokes your callback function with the connection object;
4. Executes `COMMIT`, if the callback resolves, or `ROLLBACK`, if the callback rejects;
5. Releases the connection (detached chains only);
6. Resolves with the callback result, if success; rejects with the reason, if failed.

### Detached Transactions

```javascript
var promise = require('promise'); // or any other supported promise library;
db.tx(function(){

    // creating a sequence of transaction queries:
    var q1 = this.none("update users set active=$1 where id=$2", [true, 123]);
    var q2 = this.one("insert into audit(entity, id) values($1, $2) returning id",
        ['users', 123]);

    // returning a promise that determines a successful transaction:
    return promise.all([q1, q2]); // all of the queries are to be resolved

}).then(function(data){
    console.log(data); // printing successful transaction output
}, function(reason){
    console.log(reason); // printing the reason why the transaction was rejected
});
```

A detached transaction acquires a connection and exposes object `t` to let all containing queries execute on the same connection.

### Shared-connection Transactions

When executing a transaction within a shared connection chain, parameter `t` represents the same connection as `sco` from opening a shared connection,
so either one can be used inside such a transaction interchangeably.

```javascript
var promise = require('promise'); // or any other supported promise library;
var sco; // shared connection object;
db.connect()
    .then(function(obj){
        sco = obj;
        return sco.oneOrNone("select * from users where active=$1 and id=$1", [true, 123]);
    })
    .then(function(data){
        return sco.tx(function(t){

            // Since it is a transaction within a shared chain, it doesn't matter whether
            // the two calls below use object `t` or `sco`, as they are exactly the same:
            var q1 = t.none("update users set active=$1 where id=$2", [false, data.id]);
            var q2 = sco.one("insert into audit(entity, id) values($1, $2) returning id",
                ['users', 123]);

            // returning a promise that determines a successful transaction:
            return promise.all([q1, q2]); // all of the queries are to be resolved;
        });
    }, function(reason){
        console.log(reason); // printing the reason why the transaction was rejected;
    })
    .done(function(){
        if(sco){
            sco.done(); // release the connection, if it was successful;
        }
    });
```
If you need to execute just one transaction, the detached transaction pattern is all you need.
But even if you need to combine it with other queries in a detached chain, it will work the same.
As stated earlier, choosing a shared chain over a detached one is mostly a matter of special requirements
and/or personal preference.

### Nested Transactions

Similar to the shared-connection transactions, nested transactions automatically share the connection between all levels.
This library sets no limitation as to the depth (nesting levels) of transactions supported.

Example:

```javascript
db.tx(function () {
    var queries = [
        this.none("drop table users;"),
        this.none("create table users(id serial not null, name text not null)")
    ];
    for (var i = 1; i <= 100; i++) {
        queries.push(this.none("insert into users(name) values($1)", "name-" + i));
    }
    queries.push(
        this.tx(function () {
            return this.tx(function(){
                return this.one("select count(*) from users");
            });
        }));
    return promise.all(queries);
})
.then(function (data) {
    console.log(data); // printing transaction result;
}, function (reason) {
    console.log(reason); // printing why the transaction failed;
})
```

Things to note from the example above:
* Sub-transactions do not declare a context parameter in their callback. It is not because
they don't receive one, they all do, but they don't care in such situation because of the shared connection
chain that will result in the same `t` object as for the main callback, so they just reuse it from the parent,
for simplicity;
* A nested transaction cannot be disconnected from its container, i.e. it must get into the container's promise chain,
 or it will result in an attempt to execute against an unknown connection;
* As expected, a failure on any level in a nested transaction will `ROLLBACK` and `reject` the entire chain.

### Transactions with SAVEPOINT

`SAVEPOINT` in PostgreSQL caters for advanced transaction scenarios where partial `ROLLBACK` can be executed,
depending on the logic of the transaction.

Unfortunately, this doesn't go along with the [Promises/A+] architecture that doesn't support partial `reject`.

The only work-around via promises is to strip a transaction into individual commands and execute them as a promise
chain within a shared connection. The example below shows how this can be done.

```javascript
var sco; // shared connection object;
var txErr; // transaction error;
var txData; // transaction data;
db.connect()
    .then(function (obj) {
        sco = obj; // save the connection object;
        return promise.all([
            sco.none('begin'),
            sco.none('update users set name=$1 where id=$2', ['changed1', 1]),
            sco.none('savepoint first'), // creating savepoint;
            sco.none('update users set name=$1 where id=$2', ['changed2', 2]),
            sco.none('rollback to first') // reverting to the savepoint;
        ])
            .then(function (data) {
                txData = data; // save the transaction output data;
                return sco.none('commit'); // persist changes;
            }, function (reason) {
                txErr = reason; // save the transaction failure reason;
                return sco.none('rollback'); // revert changes;
            });
    })
    .then(function () {
        if (txErr) {
            console.log('Rollback Reason: ' + txErr);
        } else {
            console.log(txData); // successful transaction output;
        }
    }, function (reason) {
        console.log(reason); // connection issue;
    })
    .done(function () {
        if (sco) {
            sco.done(); // release the connection, if it was successful;
        }
    });
```

The issue with stripping out a transaction like this and injecting `SAVEPOINT` - it gets much more
complicated to control the result of individual commands within a transaction, you may need to check every
result and change the following commands accordingly. This is why it makes much more sense to do such
transactions inside SQL functions, and not in JavaScript.

### Synchronous Transactions

A regular transaction with a set of independent queries relies on generic method
`promise.all([...])` to resolve all queries asynchronously.

However, when it comes to executing a significant number of such queries during a bulk insert,
such approach is no longer practical. For one thing, it implies that all requests have been
created as promise objects, which isn't possible when dealing with a huge number if queries,
due to memory limitations imposed by NodeJS. And for another, when one query fails, the rest
will continue trying to execute, due to their promise nature, as being asynchronous. The latter
will result in many errors generated by failed queries, which by no means breaks the transaction
logic, just fills your error log with lots of query failures that are in fact of no consequence.

This is why within each transaction we have method `sequence`, with alias `queue`, to be able to
execute a strict sequence of queries inside your transaction, one by one, and if one fails -
the rest won't try to execute.

In the promise architecture this is achieved by using a promise factory.

```javascript
function factory(idx, t) {
// must create and return a promise object dynamically,
// based on the index of the sequence (parameter idx);
    switch (idx) {
        case 0:
            return t.query("select 0");
        case 1:
            return t.query("select 1");
        case 2:
            return t.query("select 2");
    }
// returning nothing or null indicates the end of the sequence;
// throwing an error will result in a reject;
}

db.tx(function (t) {
    // same as calling t.queue(factory);
    return t.sequence(factory);
})
    .then(function (data) {
        console.log(data); // print result;
    }, function (reason) {
        console.log(reason); // print error;
    });
```

A simpler example, using in-line implementation and `this` context:

```javascript
db.tx(function () {
    return this.sequence(function (idx) {
        switch (idx) {
            case 0:
                return this.query("select 0");
            case 1:
                return this.query("select 1");
            case 2:
                return this.query("select 2");
        }
    });
})
    .then(function (data) {
        console.log(data); // print result;
    }, function (reason) {
        console.log(reason); // print error;
    });
```

By default, method `sequence` resolves with an array of resolved results from each
query created by the factory. However, if you have too many requests in your sequence,
such array may quickly grow out of proportion.

To prevent this from happening, method `sequence` has been extended in version 1.7.2
to the following syntax:
```javascript
sequence(factory, empty);
```
Optional flag `empty` (default is `false`) can now be passed to indicate that the
resolve sequence is not to be tracked, i.e. to remain empty, and the method is to
resolve with just an integer - total number of queries that have been resolved.

Parameter `empty` can have a significant impact on memory consumption, depending
on how many requests are in the sequence and the size of data they resolve with,
and it should be used:
* whenever the individual results from the sequence are not needed;
* when executing super-massive transactions (north of 100,000 queries).

#### Sequence Benchmark

Below is a benchmark conducted on a home PC, so that you know what to expect
in terms of the performance.

A home PC was used for the test, with the following configuration:

* CPU - i7-4770K @ 4GHz, Memory - 32GB;
* Windows 8.1, with PostgreSQL 9.4 on a 256GB Samsung 840 Pro.

The test was executing a single transaction with a sequence that contained 10 million inserts.
[Bluebird] was used as the promise library of choice, with long-stack traces switched off.

It took 15 minutes to execute such transaction, with CPU staying at 15% load, while
the Node JS (0.12.5, 64-bit) process maintained stable at 70-75MB of overall memory usage. 

This translates in nicely throttled inserts at 11,000 records a second. 

The test executed `sequence` with parameter `empty` = `true`. And when executing the same test
without parameter `empty` set, the test could barely pass 1m inserts, consuming way too much memory.

**Conclusion**

* The library is almost infinitely scalable when executing transactions with use of `sequence`
* You should not execute a sequence larger than 100,000 queries without passing `empty = true` 

# Advanced

## Initialization Options

When initializing the library, you can pass object `options` with a set of global properties:
```javascript
var options = {
    // pgFormatting - redirects query formatting to PG;
    // promiseLib - overrides default promise library;
    // connect - database 'connect' notification;
    // disconnect - database 'disconnect' notification;
    // query - query execution notification;
    // task - task notification;
    // transact - transaction notification;
    // error - error notification;
    // extend - protocol extension event;
};
var pgp = require('pg-promise')(options);
```

If you want to get the most out the query-related events, you should use [pg-monitor].

---
#### pgFormatting

By default, **pg-promise** provides its own implementation of the query formatting,
as explained in [Queries and Parameters](#queries-and-parameters).

If, however, you want to use query formatting that's implemented by the [PG] library, set parameter `pgFormatting`
to be `true` when initializing the library, and every query formatting will redirect to the [PG]'s implementation.

Although this has a huge implication for the library's functionality, it is not within the scope of this project to detail.
For any further reference you should use documentation of the [PG] library.

Note the following formatting features implemented by [pg-promise] that are not in [node-postgres]:
* Single-value formatting: [pg-promise] doesn't require use of an array when passing a single value;
* [Raw-Text](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#raw-text) support: injecting raw/pre-formatted text values into the query;
* Functions as formatting parameters, with the actual values returned from the callbacks;
* [PostgreSQL Array Constructors](http://www.postgresql.org/docs/9.1/static/arrays.html#ARRAYS-INPUT) are used when formatting arrays,
not the old string syntax;
* Automatic conversion of numeric `NaN`, `+Infinity` and `-Infinity` into their string presentation;

**NOTE:** Formatting parameters for calling functions (methods `func` and `proc`) is not affected by this override.
When needed, use the generic `query` instead to invoke functions with redirected query formatting.

---
#### promiseLib

Set this property to an alternative promise library compliant with the [Promises/A+] standard.

By default, **pg-promise** uses version of [Promises/A+] provided by [Promise]. If you want to override
this and force the library to use a different implementation of the standard, just set this parameter
to the library's instance.

Example of switching over to [Bluebird]:
```javascript
var promise = require('bluebird');
var options = {
    promiseLib: promise
};
var pgp = require('pg-promise')(options);
```

And if you want to use the ES6/native `Promise`, set the parameter to the main function:

```javascript
var options = {
    promiseLib: Promise
};
var pgp = require('pg-promise')(options);
```
Please note that the library makes no assumption about the level of support for the native `Promise`
by your Node JS environment, expecting only that the basic `resolve` and `reject` are working in
accordance with the [Promises/A+] standard.

[Promises/A+] libraries that passed our compatibility test and are currently supported:

* [Promise] - very solid, used by default;
* [Bluebird] - best alternative all around;
* [When] - quite old, not the best support;
* [Q] - most widely used;
* [RSVP] - doesn't have `done()`, use `finally/catch` instead
* [Lie] - doesn't have `done()`. Not recommended due to poor support. 
* **ES6 Promise** - doesn't have `done()` or `finally()`. Not recommended, due to being slow and functionally limited (as of this writing). 

Compatibility with other [Promises/A+] libraries though possible, is an unknown.

---
#### connect

Global notification function of acquiring a new database connection.
```javascript
var options = {
    connect: function(client){
        var cp = client.connectionParameters;
        console.log("Connected to database '" + cp.database + "'");
    }
};
```

The function takes only one parameter - `client` object from the [PG] library that represents connection
with the database.

The library will suppress any error thrown by the handler and write it into the console.

**NOTE:** The library will throw an error instead of making the call, if `options.connect` is set to
a non-empty value other than a function.

---
#### disconnect

Global notification function of releasing a database connection.
```javascript
var options = {
    disconnect: function(client){
        var cp = client.connectionParameters;
        console.log("Disconnecting from database '" + cp.database + "'");
    }
};
```

The function takes only one parameter - `client` object from the [PG] library that represents the connection
that's being released.

The library will suppress any error thrown by the handler and write it into the console.

**NOTE:** The library will throw an error instead of making the call, if `options.disconnect` is set to
a non-empty value other than a function.

---
#### query

Global notification of a query that's being executed.
```javascript
var options = {
    query: function (e) {
        console.log("Query:", e.query);
        if (e.ctx) {
            // this query is executing inside a task or transaction,
            if (e.ctx.isTX) {
                // this query is inside a transaction;
            } else {
                // this query is inside a task;
            }

        }
    }
};
```

Notification happens just before the query execution. And if the handler throws
an error, the query execution will be rejected with that error.

Parameter `e` is the event's context object that shares its format between events
`query`, `error`, `task` and `transact`. It supports the following properties, all of which
are optional:

* `cn` - connection details, passed only with a connection-related `error` event.
* `client` - object from the [PG] library that represents the connection;
* `query` - input query string;
* `params` - input query parameters;
* `ctx` - task/transaction context object;

A task/transaction context object (`ctx`) supports the following properties:
* `isTX` - set when `ctx` is a transaction context, as opposed to just a task;
* `start` - start time of the task/transaction;
* `finish` - optional; finish time of the task/transaction, if it has finished;
* `tag` - optional; tag object/value passed into the task/transaction, if any;
* `success` - optional; indicates success for a finished task/transaction;
* `result` - optional; task/transaction result, if finished: data resolved by the task/transaction,
 if `success` is `true`, otherwise it is set to the `reason` that was passed
 when rejecting the task/transaction.

A task/transaction can be tagged when it is called using the following syntax:
```javascript
// for tasks:
db.task(tag, cb);

// for transactions:
db.tx(tag, cb);
// or
db.transact(tag, cb);
```
i.e. in front of the callback function you can inject a value or object that
tags the task/transaction, so it can be used as a reference when handling events.

All properties of `ctx` marked as optional are not set, unless they are relevant
to the event.

**NOTE:** The library will throw an error instead of making the call, if `options.query` is set to
a non-empty value other than a function.

---
#### error

Global notification of an error during connection, query or transaction.
```javascript
var options = {
    error: function (err, e) {
        console.log("Error: " + err);
        if (e.cn) {
            // this is a connection-related error;
            // cn = connection details that were used.
        }
        if (e.query) {
            console.log("Query:", e.query);
            if (e.params) {
                console.log("Parameters:", e.params);
            }
        }
        if (e.ctx) {
            // print transaction details;
        }
    }
};
```
For parameter `e` see documentation of the `query` event earlier.

The library will suppress any error thrown by the handler and write it into the console.

**NOTE:** The library will throw an error instead of making the call,
if `options.error` is set to a non-empty value other than a function.

---
#### task

Global notification of a task start / finish events (introduced in v1.9.0).
```javascript
var options = {
    task: function (e) {
        console.log("Start Time: " + e.ctx.start);
        if (e.ctx.finish) {
            // this is a task `finish` event;
            console.log("Finish Time: " + e.ctx.finish);
            if (e.ctx.success) {
                // e.ctx.result = the data resolved;
            } else {
                // e.ctx.result = the rejection reason;
            }
        } else {
            // this is a task `start` event;
        }
    }
};
```

For parameter `e` see documentation of the `query` event earlier.

The library will suppress any error thrown by the handler and write it into the console.

---
#### transact

Global notification of a transaction start / finish events.
```javascript
var options = {
    transact: function (e) {
        console.log("Start Time: " + e.ctx.start);
        if (e.ctx.finish) {
            // this is a transaction `finish` event;
            console.log("Finish Time: " + e.ctx.finish);
            if (e.ctx.success) {
                // e.ctx.result = the data resolved;
            } else {
                // e.ctx.result = the rejection reason;
            }
        } else {
            // this is a transaction `start` event;
        }
    }
};
```

For parameter `e` see documentation of the `query` event earlier.

The library will suppress any error thrown by the handler and write it into the console.

**NOTE:** The library will throw an error instead of making the call, if `options.transact` is set to
a non-empty value other than a function.

---
#### extend

Override this event to extend the existing access layer with your own functions
and properties best suited for your application.

The extension thus becomes available across all access layers:

* Within the root/default database protocol;
* Inside transactions, including nested ones;
* Inside tasks, including nested ones.

In the example below we extend the protocol with function `addImage` that will insert
one binary image and resolve with the new record id:
```javascript
var options = {
    extend: function (obj) {
        // obj = this
        obj.addImage = function (data) {
            return obj.one("insert into images(data) values($1) returning id",
                '\\x' + data);
        }
    }
};
```

IMPORTANT: Do not override any of the predefined functions or properties in the protocol,
as it may break your access object.

It is best to extend the protocol by adding whole entity repositories to it as shown
in the following example.

```javascript
// Users repository;
function repUsers(obj) {
    return {
        add: function (name, active) {
            return obj.none("insert into users values($1, $2)", [name, active]);
        },
        delete: function (id) {
            return obj.none("delete from users where id=$1", id);
        }
    }
}

// Overriding 'extend' event;
var options = {
    extend: function (obj) {
        // obj = this
        this.users = repUsers(this);
    }
};

// Usage example:
db.users.add("John", true)
    .then(function () {
        // user added successfully;
    }, function (reason) {
        // error occurred;
    });
```

The library will suppress any error thrown by the handler and write it into the console.

**NOTE:** The library will throw an error instead of making the call, if `options.extend` is set to
a non-empty value other than a function.

## Library de-initialization

When exiting your application, you can make the following call:
```javascript
pgp.end();
```
This will release [pg] connection pool globally and make sure that the process terminates without any delay.
If you do not call it, your process may be waiting for 30 seconds (default for [poolIdleTimeout](https://github.com/brianc/node-postgres/blob/master/lib/defaults.js#L31)),
waiting for the connection to expire in the pool.

If, however you normally exit your application by killing the NodeJS process, then you don't need to use it.

# History

* Version 1.9.3 added support for [Custom Type Conversion](#custom-type-conversion). Released: August 30, 2015.
* Version 1.9.0 added support for [Tasks](#tasks) + initial [jsDoc](https://github.com/jsdoc3/jsdoc) support. Released: August 21, 2015.
* Version 1.8.2 added support for [Prepared Statements](https://github.com/brianc/node-postgres/wiki/Prepared-Statements). Released: August 01, 2015.
* Version 1.8.0 added support for Query Streaming via [node-pg-query-stream](https://github.com/brianc/node-pg-query-stream). Released: July 23, 2015.
* Version 1.7.2 significant code refactoring and optimizations; added support for super-massive transactions. Released: June 27, 2015.
* Version 1.6.0 major update for the test platform + adding coverage. Released: June 19, 2015.
* Version 1.5.0 major changes in architecture and query formatting. Released: June 14, 2015.
* Version 1.4.0 added `this` context to all callbacks where applicable. Released: May 31, 2015.
* Version 1.3.1 extended [Named Parameters](#named-parameters) syntax to support `{}`,`()`,`[]`,`<>` and `//`. Released: May 24, 2015.
* Version 1.3.0 much improved error handling and reporting. Released: May 23, 2015.
* Version 1.2.0 extended [Named Parameters](#named-parameters) syntax with `$(varName)`. Released: May 16, 2015.
* Version 1.1.0 added support for functions as parameters. Released: April 3, 2015.
* Version 1.0.5 added strict query sequencing for transactions. Released: April 26, 2015.
* Version 1.0.3 added method `queryRaw(query, values)`. Released: April 19, 2015.
* Version 1.0.1 improved error reporting for queries. Released: April 18, 2015.
* Version 1.0.0 official release milestone. Released: April 17, 2015.
* Version 0.9.8 added native json support, extended numeric support for `NaN`, `+Infinity` and `-Infinity`. Released: April 16, 2015.
* Version 0.9.7 received support for protocol extensibility. Released: April 15, 2015.
* Version 0.9.5 received support for raw-text variables. Released: April 12, 2015.
* Version 0.9.2 received support for PostgreSQL Array Types. Released: April 8, 2015.
* Version 0.9.0 changed the notification protocol. Released: April 7, 2015.
* Version 0.8.4 added support for error notifications. Released: April 6, 2015.
* Version 0.8.0 added support for named-parameter formatting. Released: April 3, 2015.
* Version 0.7.0 fixes the way `as.format` works (breaking change). Released: April 2, 2015.
* Version 0.6.2 has good database test coverage. Released: March 28, 2015.
* Version 0.5.6 introduces support for nested transaction. Released: March 22, 2015.
* Version 0.5.3 - minor changes; March 14, 2015.
* Version 0.5.1 included wider support for alternative promise libraries. Released: March 12, 2015.
* Version 0.5.0 introduces many new features and fixes, such as properties **pgFormatting** and **promiseLib**. Released on March 11, 2015.
* Version 0.4.9 represents a solid code base, backed up by comprehensive testing. Released on March 10, 2015.
* Version 0.4.0 is a complete rewrite of most of the library, made first available on March 8, 2015.
* Version 0.2.0 introduced on March 6th, 2015, supporting multiple databases.
* A refined version 0.1.4 released on March 5th, 2015.
* First solid Beta, 0.1.2 on March 4th, 2015.
* It reached first Beta version 0.1.0 on March 4th, 2015.
* The first draft v0.0.1 was published on March 3rd, 2015, and then rapidly incremented due to many initial changes that had to come in, mostly documentation.

# License

Copyright (c) 2015 Vitaly Tomilov (vitaly.tomilov@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

[pg-monitor]:https://github.com/vitaly-t/pg-monitor
[pg-promise]:https://github.com/vitaly-t/pg-promise
[PG]:https://github.com/brianc/node-postgres
[pg]:https://github.com/brianc/node-postgres
[node-postgres]:https://github.com/brianc/node-postgres
[Promises/A+]:https://promisesaplus.com/
[Promise]:https://github.com/then/promise
[Bluebird]:https://github.com/petkaantonov/bluebird
[When]:https://github.com/cujojs/when
[Q]:https://github.com/kriskowal/q
[RSVP]:https://github.com/tildeio/rsvp.js
[Lie]:https://github.com/calvinmetcalf/lie
