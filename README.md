pg-promise
===========

Advanced access layer to [node-postgres] via [Promises/A+].

[![Build Status](https://travis-ci.org/vitaly-t/pg-promise.svg?branch=master)](https://travis-ci.org/vitaly-t/pg-promise)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/pg-promise/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/pg-promise?branch=master)
[![Package Quality](http://npm.packagequality.com/shield/pg-promise.svg)](http://packagequality.com/#?package=pg-promise)

---
<a href="https://promisesaplus.com/"><img align="right" width="190" height="190" src="http://s8.postimg.org/k7dtue8lx/pg_promise.jpg"></a>

* Supporting [Promise], [Bluebird], [When], [Q], etc.
* Transactions, functions, flexible query formatting;
* Automatic database connections;
* Strict query result filters.

---

* [About](#about)
* [Installing](#installing)
* [Getting Started](#getting-started)
  - [Initializing](#initializing)
  - [Connecting](#connecting)
  - [Documentation](#documentation)  
* [Testing](#testing)    
* [Usage](#usage)
  - [Queries and Parameters](#queries-and-parameters)
    - [Raw Text](#raw-text)  
    - [SQL Names](#sql-names)    
  - [Query Result Mask](#query-result-mask)    
  - [Named Parameters](#named-parameters)
  - [Conversion Helpers](#conversion-helpers)
  - [Custom Type Formatting](#custom-type-formatting)  
    - [Raw Custom Types](#raw-custom-types)   
  - [Query Files](#query-files)    
  - [Connections](#connections)  
    - [Detached Connections](#detached-connections)
    - [Shared Connections](#shared-connections)
    - [Tasks](#tasks)    
  - [Transactions](#transactions)
    - [Detached Transactions](#detached-transactions)
    - [Shared-connection Transactions](#shared-connection-transactions)
    - [Nested Transactions](#nested-transactions)
    - [Synchronous Transactions](#synchronous-transactions)    
    - [Configurable Transactions](#configurable-transactions)
  - [Generators](#generators)
* [Advanced](#advanced)
  - [Initialization Options](#initialization-options)
    - [pgFormatting](#pgformatting)
    - [promiseLib](#promiselib)
    - [connect](#connect)
    - [disconnect](#disconnect)
    - [query](#query)
    - [receive](#receive)    
    - [error](#error)
    - [task](#task)    
    - [transact](#transact)
    - [extend](#extend)
    - [noLocking](#nolocking)    
    - [capTX](#captx)    
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
* support for all popular promise libraries + ES6 generators;
* declarative approach to controlling query results.

# Installing
```
$ npm install pg-promise
```

# Getting Started

## Initializing

```javascript
// Loading and initializing the library:
var pgp = require('pg-promise')({
    // Initialization Options
});
```
See also: [Initialization Options](#advanced).

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

Create a global/shared database instance from the connection details:

```javascript
var db = pgp(cn);
```

You need only one database instance per connection details.

A configuration object has the benefit of being changeable: it is used by the library directly,
and changing properties of the original object will cause immediate reconnection.

This library doesn't use any of the connection's details, it simply passes them on to [PG] when opening a connection.
For more details see pg connection parameters in [WiKi](https://github.com/brianc/node-postgres/wiki/pg#parameters) and
[implementation](https://github.com/brianc/node-postgres/blob/master/lib/connection-parameters.js).

## Documentation

[Learn by Example] is the quickest way to get started with this library, while the current
document details most of the basic functionality this library provides.

For the protocol see the [API Documentation], and for everything else - [Wiki pages](https://github.com/vitaly-t/pg-promise/wiki).

# Testing

* Clone the repository (or download, if you prefer):
```
$ git clone https://github.com/vitaly-t/pg-promise
```

* Install the library's DEV dependencies:
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

* To run all tests:
```
$ npm test
```

* To run all tests with coverage:
```
$ npm run coverage
```

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
* `qrm` - (optional) *Query Result Mask*, as explained below. When not passed, it defaults to `pgp.queryResult.any`.

When a value/property inside array/object is an array, it is treated as a [PostgreSQL Array Type](http://www.postgresql.org/docs/9.4/static/arrays.html),
converted into the array constructor format of `array[]`, the same as calling method `pgp.as.array()`.

When a value/property inside array/object is of type `object` (except for `null` and `Date`), it is automatically
serialized into JSON, the same as calling method `pgp.as.json()`, except the latter would convert anything to JSON.

For the most current SQL formatting support see method [as.format]

### Raw Text

Raw-text values can be injected by ending the variable name with `^` or `:raw`:
`$1^, $2^, etc...`, `$*varName^*`, where `*` is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

Raw text is injected without any pre-processing, which means:

* No proper escaping (replacing each single-quote symbol `'` with two);
* No wrapping text into single quotes.

Unlike regular variables, value for raw-text variables cannot be `null` or `undefined`,
because of the ambiguous meaning in this case. If such values are passed in, the formatter
will throw error `Values null/undefined cannot be used as raw text.` 

**usage examples:**

```js
// injecting name without quotes:
query("...WHERE name LIKE '%$1^%'", "John");

// injecting value of property 'name' without quotes:
query("...WHERE name LIKE '%${name^}%'", {name: "John"});

// injecting a CSV-formatted text without quotes:
query("...WHERE id IN($1^)", pgp.as.csv([1,2,3,4])); 
```

Special syntax `this^` within the [Named Parameters](#named-parameters) refers
to the formatting object itself, to be injected as a raw-text JSON-formatted string.

For the most current SQL formatting support see method [as.format]

### SQL Names

Introduced in version 3.1.0, this feature simplifies formatting for SQL names/identifiers.

When a variable ends with `~` (tilde) or `:name`, it represents an SQL name or identifier, which must be a text
string of at least 1 character long. Such name is then properly escaped and wrapped in double quotes.

```js
query('INSERT INTO $1~($2~) VALUES(...)', ['Table Name', 'Column Name']);
// => INSERT INTO "Table Name"("Column Name") VALUES(...)

query('SELECT ${column~} FROM ${table~}', {
    column: 'Column Name',
    table: 'Table Name'
});
// => SELECT "Column Name" FROM "Table Name"
```

Relying on this type of formatting for sql names and identifiers, along with regular variable formatting
makes your application impervious to sql injection.

See methods: [as.name], [as.format]

## Query Result Mask

In order to eliminate the chances of unexpected query results and thus make the code more robust,
method `query` uses parameter `qrm` (Query Result Mask):

```javascript
///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one + many.
var queryResult = {
    /** Single row is expected. */
    one: 1,
    /** One or more rows expected. */
    many: 2,
    /** Expecting no rows. */
    none: 4,
    /** many|none - any result is expected. */
    any: 6
};
```

In the following generic-query example we indicate that the call can return anything:
```javascript
db.query("select * from users");
```
which is equivalent to making one of the following calls:
```javascript
var qrm = pgp.queryResult;
db.query("select * from users", undefined, qrm.many | qrm.none);
db.query("select * from users", undefined, qrm.any);
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

There is however one specific method `result(query, values)` to bypass any result verification, and instead resolve
with the original [Result] object passed from the [PG] library.

You can also add your own methods and properties to this protocol via the [extend](#extend) event.  

Each query function resolves its **data** according to the `qrm` that was used:

* `none` - **data** is `undefined`. If the query returns any kind of data, it is rejected.
* `one` - **data** is a single object. If the query returns no data or more than one row of data, it is rejected.
* `many` - **data** is an array of objects. If the query returns no rows, it is rejected.
* `one`|`none` - **data** is `null`, if no data was returned; or a single object, if one row was returned.
    If the query returns more than one row of data, the query is rejected.
* `many`|`none` - **data** is an array of objects. When no rows are returned, **data** is an empty array.

If you try to specify `one`|`many` in the same query, such query will be rejected without executing it, telling you that such mask is invalid.

If `qrm` is not specified when calling generic `query` method, it is assumed to be `many`|`none` = `any`, i.e. any kind of data expected.

> This is all about writing robust code, when the client specifies what kind of data it is ready to handle on the declarative level,
leaving the burden of all extra checks to the library.

## Named Parameters

The library supports named parameters in query formatting, with the syntax of `$*propName*`,
where `*` is any of the following open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

```javascript
db.query("select * from users where name=${name} and active=$/active/", {
    name: 'John',
    active: true
});
```

The same goes for all types of query methods as well as method `pgp.as.format(query, values)`, where `values`
can also be an object whose properties can be referred to by name from within the query.

A valid property name consists of any combination of letters, digits, underscores or `$`, and they are case-sensitive.
Leading and trailing spaces around property names are ignored.

It is important to know that while property values `null` and `undefined` are both formatted as `null`,
an error is thrown when the property doesn't exist at all (except for `partial` replacements - see below).

Version 3.2.0 added support for `partial` replacements, which when used will simply ignore variables that do
not exist in the formatting object.

#### `this` reference

Version 2.3.0 added support for property `this`, as a reference to the formatting object itself,
so it can be inserted as a JSON-formatted string, alongside its properties.

* `${this}` - inserts the object itself as a JSON-formatted string;
* `${this^}` - inserts the object itself as a raw-text JSON-formatted string.

**example:**

```js
var doc = {
    id: 123,
    body: "some text"
};

db.none("INSERT INTO documents(id, doc) VALUES(${id}, ${this})", doc)
    .then(function () {
        // success;
    })
    .catch(function (error) {
        // error;
    });
```    

which will execute:
```
INSERT INTO documents(id, doc) VALUES(123, '{"id":123,"body":"some text"}')
```

Version 3.2.1 and later allows syntax `:json` as an alternative to formatting the value
as a JSON string.

**NOTE:** Technically, it is possible in javascript, though not recommended, for an object to contain a property
with name `this`. And in such cases the property's value will be used instead.

## Functions and Procedures

In PostgreSQL stored procedures are just functions that usually do not return anything.

Suppose we want to call function **findAudit** to find audit records by `user_id` and maximum timestamp.
We can make such call as shown below:

```javascript
db.func('findAudit', [123, new Date()])
    .then(function (data) {
        console.log(data); // printing the data returned
    })
    .catch(function (error) {
        console.log(error); // printing the error
    });
```

We passed it `user_id = 123`, plus current Date/Time as the timestamp. We assume that the function signature matches
the parameters that we passed. All values passed are serialized automatically to comply with PostgreSQL type formats.

Method `func` accepts optional third parameter - `qrm` (Query Result Mask), the same as method `query`.

And when you are not expecting any return results, call `db.proc` instead. Both methods return a [Promise] object,
but `db.proc` doesn't take a `qrm` parameter, always assuming it is `one`|`none`.

Summary for supporting procedures and functions:

* `func(query, values, qrm)` - expects the result according to `qrm`
* `proc(query, values)` - calls `func(query, values, qrm.one | qrm.none)`

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

pgp.as.name(value);
                    // converts value into PostgreSQL name/identifier,
                    // wrapped in double quotes.

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

Methods `bool`, `number`, `text`, `date`, `json`, `array` and `csv` accept the value-parameter
as a function to be called for resolving the actual value.

For methods which take optional flag `raw` it is to indicate that the return text is to be without
any pre-processing:

* No replacing each single-quote symbol `'` with two;
* No wrapping text into single quotes;
* Throwing an error when the variable value is `null` or `undefined`.

This adheres to the query formatting, as well as method `as.format` when variable
names are appended with symbol `^`: `$1^, $2^, etc...` or `$*varName^*`, where `*`
is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

As none of these helpers are associated with the database, they are synchronous, and can be used from anywhere.

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
        cnd.push(pgp.as.format("name like '%$1^%'", filter.name));
    }
    return cnd.join(" and "); // returning the complete filter string;
}
```

## Custom Type Formatting

When we pass `values` as a single parameter or inside an array, it is verified to be an object
that supports function `formatDBType`, as either its own or inherited. And if the function exists,
its return result overrides both the actual value and the formatting syntax for parameter `query`.

This allows use of your own custom types as formatting parameters for the queries, as well as
overriding formatting for standard object types, such as `Date` and `Array`.

**Example: your own type formatting**
```javascript
function Money(m) {
    this.amount = m;
    this.formatDBType = function () {
        // return a string with 2 decimal points;
        return this.amount.toFixed(2);
    }
}
```

**Example: overriding standard types**
```javascript
Date.prototype.formatDBType = function () {
    // format Date as a local timestamp;
    return this.getTime();
};
```

Function `formatDBType` is allowed to return absolutely anything, including:
* instance of another object that supports its own custom formatting;
* instance of another object that doesn't have its own custom formatting;
* another function, with recursion of any depth;

Please note that the return result from `formatDBType` may even affect the
formatting syntax expected within parameter `query`, as explained below.

If you pass in `values` as an object that has function `formatDBType`,
and that function returns an array, then your `query` is expected to use 
`$1, $2` as the formatting syntax.

And if `formatDBType` in that case returns a custom-type object that doesn't support
custom formatting, then `query` will be expected to use `$*propName*` as the formatting syntax.

### Raw Custom Types

This features allows overriding `raw` flag for the values returned from custom types.

Any custom type or standard type that implements function `formatDBType` can also set
property `_rawDBType = true` to force raw variable formatting on the returned value.

This makes the custom type formatting ultimately flexible, as there is no limitation
as to how a custom type can format its value.

For example, some special types, like UUID, do not have natural presentation in JavaScript,
so they have to be converted into text strings when passed into the query formatting.
For an array of UUID-s, for instance, you would have to explicitly cast the formatted value
with `::uuid[]` appended at the end of the variable.
  
You can implement your own presentation for UUID that does not require extra casting:

```javascript  
function UUID(value) {
    this.uuid = value;
    this._rawDBType = true; // force raw format on output;
    this.formatDBType = function () {
        // alternatively, you can set flag
        // _rawDBType during this call:
        // this._rawDBType = true;
        return this.uuid;
    };
}
``` 
  
When you chain one custom-formatting type to return another one, please note that
setting `_rawDBType` on any level will set the flag for the entire chain.

## Query Files
  
Version 2.9.0 introduced support for Query Files to increase productivity of developing
SQL queries. 

Example:

```js
// Create QueryFile globally, once per file:
var sqlFindUser = sql('./sql/findUser.sql');

db.one(sqlFindUser, {id: 123})
    .then(user=> {
        console.log(user);
    })
    .catch(error=> {
        if (error instanceof pgp.minify.SQLParsingError) {
            // => failed to parse the SQL file
        }
    });

function sql(file) {
    return new pgp.QueryFile(file, {debug: true, minify: true});
}
```
  
File `findUser.sql`:
```sql
/*
    multi-line comment
*/
SELECT name, dob -- single-line comment
FROM Users
WHERE id = ${id}
```

Every query method of the library recognizes type `QueryFile` as a query provider.

You should only create a single instance of `QueryFile` per file, and then use that
instance throughout the application.

Most useful features of class `QueryFile`:

* `debug` mode, to make every query request check if the file has changed since it was last read,
  and if so - read it afresh. This way you can write sql queries and see immediate updates without having
  to restart your application.
* Added in v3.2.0: `params` option for static SQL pre-formatting, to inject certain values only once,
  like a schema name or a configurable table name.

The query provider itself never throws any error, leaving it for query methods to reject with.

For detailed documentation see [QueryFile API].

## Connections

The library supports promise-chained queries on shared and detached connections.
Choosing which one to use depends on the situation and personal preferences.

### Detached Connections

Queries in a detached promise chain maintain connection independently, they each acquire
a connection from the pool, execute the query and then release the connection back to the pool.
```javascript
db.one("select * from users where id=$1", 123) // find the user from id;
    .then(function (data) {
        // find 'login' records for the user found:
        return db.query("select * from audit where event=$1 and userId=$2",
            ["login", data.id]);
    })
    .then(function (data) {
        console.log(data); // display found audit records;
    })
    .catch(function (error) {
        console.log(error); // display the error;
    });
```
In a situation where a single request is to be made against the database, a detached chain is the only one that makes sense.
And even if you intend to execute multiple queries in a chain, keep in mind that even though each will use its own connection,
such will be used from a connection pool, so effectively you end up with the same connection, without any performance penalty.

### Shared Connections

A promise chain with a shared connection starts with `connect()`, which acquires a connection from the pool to be shared
with all the queries down the promise chain. The connection must be released back to the pool when no longer needed.

**NOTE:** With the addition of [Tasks](#tasks), use of shared connections directly is no longer necessary.
It is recommended that you use [Tasks](#tasks) instead, as they are much easier to use.

```javascript
var sco; // shared connection object;
db.connect()
    .then(function (obj) {
        sco = obj; // save the connection object;
        // find active users created before today:
        return sco.query("select * from users where active=$1 and created < $2",
            [true, new Date()]);
    })
    .then(function (data) {
        console.log(data); // display all the user details;
    })
    .catch(function (error) {
        console.log(error); // display the error;
    })
    .finally(function () {
        if (sco) {
            sco.done(); // release the connection, if it was successful;
        }
    });
```
Shared-connection chaining is when you want absolute control over the connection, either because you want to execute lots of queries in one go,
or because you like squeezing every bit of performance out of your code. Other than that, the author hasn't seen any performance difference
from the detached-connection chaining. And besides, any long sequence of queries normally resides inside a transaction, which always
uses shared-connection chaining automatically.

### Tasks

A task represents a shared connection to be used within a callback function. The callback can be either
a regular function or an ES6 generator.

A transaction, for example, is just a special type of task, wrapped in `CONNECT->COMMIT/ROLLBACK`. 

```javascript
db.task(function (t) {
    // t = this;
    // execute a chain of queries;
})
    .then(function (data) {
        // success;
    })
    .catch(function (error) {
        // failed;    
    });
```

The purpose of tasks is simply to provide a shared connection context within the callback function to execute and return
a promise chain, and then automatically release the connection.

In other words, it is to simplify the use of [shared connections](#shared-connections), so instead of calling `connect` in the beginning
and `done` in the end (if it was connected successfully), one can call `db.task` instead, execute all queries within
the callback and return the result.

## Transactions

Transactions can be executed within both shared and detached promise chains in the same way, performing the following actions:

1. Acquires a new connection (detached chains only);
2. Executes `BEGIN` command;
3. Invokes your callback function (or generator) with the connection object;
4. Executes `COMMIT`, if the callback resolves, or `ROLLBACK`, if the callback rejects;
5. Releases the connection (detached chains only);
6. Resolves with the callback result, if success; rejects with the reason, if failed.

### Detached Transactions

```javascript
db.tx(function (t) {
    // t = this;
    // creating a sequence of transaction queries:
    var q1 = this.none("update users set active=$1 where id=$2", [true, 123]);
    var q2 = this.one("insert into audit(entity, id) values($1, $2) returning id",
        ['users', 123]);

    // returning a promise that determines a successful transaction:
    return this.batch([q1, q2]); // all of the queries are to be resolved;
})
    .then(function (data) {
        console.log(data); // printing successful transaction output;
    })
    .catch(function (error) {
        console.log(error); // printing the error;
    });
```

A detached transaction acquires a connection and exposes object `t`=`this` to let all containing queries
execute on the same connection.

### Shared-connection Transactions

**NOTE:** Use of shared-connection transactions is no longer necessary. When a transaction needs
to use the connection from its container, you should execute it inside a task instead.  

```javascript
var sco; // shared connection object;
db.connect()
    .then(function (obj) {
        sco = obj;
        return sco.oneOrNone("select * from users where active=$1 and id=$1", [true, 123]);
    })
    .then(function (data) {
        return sco.tx(function (t) {
            // t = this;
            var q1 = this.none("update users set active=$1 where id=$2", [false, data.id]);
            var q2 = this.one("insert into audit(entity, id) values($1, $2) returning id",
                ['users', 123]);

            // returning a promise that determines a successful transaction:
            return this.batch([q1, q2]); // all of the queries are to be resolved;
        });
    })
    .catch(function (error) {
        console.log(error); // printing the error;
    })
    .finally(function () {
        if (sco) {
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
db.tx(function (t) {
    // t = this;
    var queries = [
        this.none("drop table users;"),
        this.none("create table users(id serial not null, name text not null)")
    ];
    for (var i = 1; i <= 100; i++) {
        queries.push(this.none("insert into users(name) values($1)", "name-" + i));
    }
    queries.push(
        this.tx(function (t1) {
            // t1 = this != t;
            return this.tx(function (t2) {
                // t2 = this != t1 != t;
                return this.one("select count(*) from users");
            });
        }));
    return this.batch(queries);
})
    .then(function (data) {
        console.log(data); // printing transaction result;
    })
    .catch(function (error) {
        console.log(error); // printing the error;
    });
```

#### Limitations

It is important to know that PostgreSQL doesn't have proper support for nested transactions, it only
supports *partial rollbacks* via [savepoints](http://www.postgresql.org/docs/9.4/static/sql-savepoint.html) inside transactions.
The difference between the two techniques is huge, as explained further.

Proper support for nested transactions means that the result of a successful sub-transaction isn't rolled back
when its parent transaction is rolled back. But with PostgreSQL save-points, if you roll-back the top-level
transaction, the result of all inner save-points is also rolled back.

Save-points are only good for *partial rollbacks*, i.e. you can roll-back results of sub-transactions, with
yet successful *commit* for the top-level transaction. Using promises it is easy to construct your transaction
so it would utilize that logic. This library automatically provides a transaction on the top level, and
save-points for all sub-transactions.

### Synchronous Transactions

A regular task/transaction with a set of independent queries relies on method [batch] to resolve
all queries asynchronously.

However, when it comes to executing a significant number of queries during a bulk `INSERT` or `UPDATE`,
such approach is no longer practical. For one thing, it implies that all requests have been created as promise objects,
which isn't possible when dealing with a huge number of queries, due to memory limitations imposed by NodeJS.
And for another, when one query fails, the rest will continue trying to execute, due to their promise nature,
as being asynchronous.

This is why within each task/transaction we have method [sequence], to be able to execute a strict
sequence of queries one by one, and if one fails - the rest won't try to execute.

```js
function source(index, data, delay) {
    // must create and return a promise object dynamically,
    // based on the index of the sequence;
    switch (index) {
        case 0:
            return this.query("select 0");
        case 1:
            return this.query("select 1");
        case 2:
            return this.query("select 2");
    }
    // returning or resolving with undefined ends the sequence;
    // throwing an error will result in a reject;
}

db.tx(function (t) {
    // t = this;
    return this.sequence(source);
})
    .then(function (data) {
        console.log(data); // print result;
    })
    .catch(function (error) {
        console.log(error); // print the error;
    });
```

Sequence is based on implementation of [spex.sequence].

### Configurable Transactions

In order to be able to fine-tune database requests in a highly asynchronous environment,
PostgreSQL supports *Transaction Snapshots*, plus 3 ways of configuring a transaction:

* [SET TRANSACTION](http://www.postgresql.org/docs/9.4/static/sql-set-transaction.html), to configure the current transaction,
which your can execute as the very first query in your transaction function;
* `SET SESSION CHARACTERISTICS AS TRANSACTION` - setting default transaction properties for the entire session; 
* [BEGIN](http://www.postgresql.org/docs/9.4/static/sql-begin.html) + `Transaction Mode` - initiates a pre-configured transaction.

The first method is quite usable, but that means you have to start every transaction with
an initial query to configure the transaction, which can be a bit awkward.

The second approach isn't very usable within a database framework as this one, which relies
on a connection pool, so you don't really know when a new connection is created.

The last method is not usable, because transactions in this library are automatic, executing `BEGIN`
without your control, or so it was until version 2.5.0, which changed that, as explained further.

---  

Version 2.5.0 added support for [Transaction Mode], which can extend `BEGIN` in your transaction with
a complete set of configuration parameters.

```js
var TransactionMode = pgp.txMode.TransactionMode;
var isolationLevel = pgp.txMode.isolationLevel;
 
// Create a reusable transaction mode (serializable + read-only + deferrable):
var tmSRD = new TransactionMode({
    tiLevel: isolationLevel.serializable,
    readOnly: true,
    deferrable: true
});

function myTransaction() {
    return this.query("SELECT * FROM table");
}

myTransaction.txMode = tmSRD; // assign transaction mode;

db.tx(myTransaction)
    .then(function(){
        // success;
    });
```

Instead of the default `BEGIN`, such transaction will initiate with the following command:
```
BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE
```

Transaction Mode is set via property `txMode` on the transaction function.

This is the most efficient and best-performing way of configuring transactions. In combination with
*Transaction Snapshots* you can make the most out of transactions in terms of performance and concurrency.

## Generators

Version 2.6.0 added support for ES6 generators. If you prefer writing asynchronous code in a
synchronous manner, you can implement your tasks and transactions as generators. 

```js
function * getUser(t) {
    // t = this;
    let user = yield this.oneOrNone("select * from users where id=$1", 123);
    if (!user) {
        user = yield this.one("insert into users(name) values($1) returning *", "John");
    }
    return user;
}

db.task(getUser)
    .then(function (user) {
        // success;
    })
    .catch(function (error) {
        // error;
    });
```

The library verifies whether the callback function is a generator, and executes it accordingly.

# Advanced

## Initialization Options

When initializing the library, you can pass object `options` with a set of global properties.
See [API / options](http://vitaly-t.github.io/pg-promise/module-pg-promise.html).

---
#### pgFormatting

By default, **pg-promise** provides its own implementation of the query formatting,
as explained in [Queries and Parameters](#queries-and-parameters).

If, however, you want your queries formatted by the [PG] library, set parameter `pgFormatting`
to be `true` when initializing the library, and every query formatting will redirect to the [PG]'s implementation.

Although this has a huge implication to the library's functionality, it is not within the scope of this project to detail.
For any further reference you should use documentation of the [PG] library.

Note the following formatting features implemented by [pg-promise] that are not in [node-postgres]:
* [Custom Type Formatting](#custom-type-formatting)
* Single-value formatting: [pg-promise] doesn't require use of an array when passing a single value;
* [Raw-Text](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#raw-text) support: injecting raw/pre-formatted text values into the query;
* Functions as formatting parameters, with the actual values returned from the callbacks;
* [PostgreSQL Array Constructors](http://www.postgresql.org/docs/9.1/static/arrays.html#ARRAYS-INPUT) are used when formatting arrays,
not the old string syntax;
* Automatic conversion of numeric `NaN`, `+Infinity` and `-Infinity` into their string presentation;
* Support for [this reference](#this-reference);

**NOTE:** Formatting parameters for calling functions (methods `func` and `proc`) is not affected by this override.
When needed, use the generic `query` instead to invoke functions with redirected query formatting.

---
#### promiseLib

By default, **pg-promise** uses ES6 Promise. If your version of NodeJS doesn't support ES6 Promise,
or you want a different promise library to be used, set this property to the library's instance.

Example of switching over to [Bluebird]:
```javascript
var promise = require('bluebird');
var options = {
    promiseLib: promise
};
var pgp = require('pg-promise')(options);
```

[Promises/A+] libraries that implement a recognizable promise signature and work automatically:

* **ES6 Promise** - used by default, though it doesn't have `done()` or `finally()`.
* [Bluebird] - best alternative all around;
* [Promise] - very solid library;
* [When] - quite old, not the best support;
* [Q] - most widely used;
* [RSVP] - doesn't have `done()`, use `finally/catch` instead
* [Lie] - doesn't have `done()`. 

If you pass in a library that doesn't implement a recognizable promise signature, **pg-promise** will
throw error `Invalid promise library specified.` during initialization.

For such libraries you can use [Promise Adapter] to make them compatible with **pg-promise**,
mostly needed by smaller and simplified [Conformant Implementations](https://promisesaplus.com/implementations). 

---
#### connect

See [API / event `connect`](http://vitaly-t.github.io/pg-promise/global.html#event:connect).

---
#### disconnect

See [API / event `disconnect`](http://vitaly-t.github.io/pg-promise/global.html#event:disconnect).

---
#### query

See [API / event `query`](http://vitaly-t.github.io/pg-promise/global.html#event:query).

---
#### receive

See [API / event `receive`](http://vitaly-t.github.io/pg-promise/global.html#event:receive).

---
#### error

See [API / event `error`](http://vitaly-t.github.io/pg-promise/global.html#event:error).

---
#### task

See [API / event `task`](http://vitaly-t.github.io/pg-promise/global.html#event:task).

---
#### transact

See [API / event `transact`](http://vitaly-t.github.io/pg-promise/global.html#event:transact).

---
#### extend

See [API / event `extend`](http://vitaly-t.github.io/pg-promise/global.html#event:extend).

---
#### noLocking

See [API / `noLocking`](http://vitaly-t.github.io/pg-promise/module-pg-promise.html).

---
#### capTX

See [API / `capTX`](http://vitaly-t.github.io/pg-promise/module-pg-promise.html).

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

* 3.2.1 Adding support for formatting overrides: `:raw`, `:name`, `:json` and `:csv`. Released: February 22, 2016
* 3.2.0 Adding formatting options support, specifically option `partial`, add its use within [Query Files](#query-files). Released: February 20, 2016
* 3.1.0 Adding support for [SQL Names]. Released: January 27, 2016
* 3.0.3 Complete replacement of the API with GitHub-hosted one. Released: January 21, 2016
* 2.9.3 Replaced all SQL processing with [pg-minify] dependency. Released: January 20, 2016
* 2.9.1 added custom SQL parser for external files. Released: January 19, 2016
* 2.9.0 added support for [Query Files](#query-files). Released: January 18, 2016
* 2.8.0 added support for [event receive](#receive). Released: December 14, 2015
* 2.6.0 added support for [ES6 Generators](#generators). Released: November 30, 2015
* 2.5.0 added support for [Configurable Transactions](#configurable-transactions). Released: November 26, 2015
* 2.4.0 library re-organized for better documentation and easier maintenance. Released: November 24, 2015
* 2.2.0 major rework on the nested transactions support. Released: October 23, 2015
* 2.0.8 added all the [long-outstanding breaking changes](https://github.com/vitaly-t/pg-promise/wiki/2.0-Migration). Released: October 12, 2015
* 1.11.0 added [noLocking](#nolocking) initialization option. Released: September 30, 2015.
* 1.10.3 added enforced locks on every level of the library. Released: September 11, 2015.
* 1.10.0 added support for `batch` execution within tasks and transactions. Released: September 10, 2015.
* 1.9.5 added support for [Raw Custom Types](#raw-custom-types). Released: August 30, 2015.
* 1.9.3 added support for [Custom Type Formatting](#custom-type-formatting). Released: August 30, 2015.
* 1.9.0 added support for [Tasks](#tasks) + initial [jsDoc](https://github.com/jsdoc3/jsdoc) support. Released: August 21, 2015.
* 1.8.2 added support for [Prepared Statements](https://github.com/brianc/node-postgres/wiki/Prepared-Statements). Released: August 01, 2015.
* 1.8.0 added support for Query Streaming via [node-pg-query-stream](https://github.com/brianc/node-pg-query-stream). Released: July 23, 2015.
* 1.7.2 significant code refactoring and optimizations; added support for super-massive transactions. Released: June 27, 2015.
* 1.6.0 major update for the test platform + adding coverage. Released: June 19, 2015.
* 1.5.0 major changes in architecture and query formatting. Released: June 14, 2015.
* 1.4.0 added `this` context to all callbacks where applicable. Released: May 31, 2015.
* 1.3.1 extended [Named Parameters](#named-parameters) syntax to support `{}`,`()`,`[]`,`<>` and `//`. Released: May 24, 2015.
* 1.3.0 much improved error handling and reporting. Released: May 23, 2015.
* 1.2.0 extended [Named Parameters](#named-parameters) syntax with `$(varName)`. Released: May 16, 2015.
* 1.1.0 added support for functions as parameters. Released: April 3, 2015.
* 1.0.5 added strict query sequencing for transactions. Released: April 26, 2015.
* 1.0.3 added method `queryRaw(query, values)`. Released: April 19, 2015.
* 1.0.1 improved error reporting for queries. Released: April 18, 2015.
* 1.0.0 official release milestone. Released: April 17, 2015.
* 0.9.8 added native json support, extended numeric support for `NaN`, `+Infinity` and `-Infinity`. Released: April 16, 2015.
* 0.9.7 received support for protocol extensibility. Released: April 15, 2015.
* 0.9.5 received support for raw-text variables. Released: April 12, 2015.
* 0.9.2 received support for PostgreSQL Array Types. Released: April 8, 2015.
* 0.9.0 changed the notification protocol. Released: April 7, 2015.
* 0.8.4 added support for error notifications. Released: April 6, 2015.
* 0.8.0 added support for named-parameter formatting. Released: April 3, 2015.
* 0.7.0 fixes the way `as.format` works (breaking change). Released: April 2, 2015.
* 0.6.2 has good database test coverage. Released: March 28, 2015.
* 0.5.6 introduces support for nested transaction. Released: March 22, 2015.
* 0.5.3 - minor changes; March 14, 2015.
* 0.5.1 included wider support for alternative promise libraries. Released: March 12, 2015.
* 0.5.0 introduces many new features and fixes, such as properties **pgFormatting** and **promiseLib**. Released on March 11, 2015.
* 0.4.9 represents a solid code base, backed up by comprehensive testing. Released on March 10, 2015.
* 0.4.0 is a complete rewrite of most of the library, made first available on March 8, 2015.
* 0.2.0 introduced on March 6th, 2015, supporting multiple databases.
* 0.1.4 first release. March 5th, 2015.
* 0.0.1 initial draft. March 3rd, 2015.

# License

Copyright (c) 2016 Vitaly Tomilov (vitaly.tomilov@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

[as.format]:http://vitaly-t.github.io/pg-promise/formatting.html#.format
[as.name]:http://vitaly-t.github.io/pg-promise/formatting.html#.name
[batch]:http://vitaly-t.github.io/pg-promise/Task.html#.batch
[sequence]:http://vitaly-t.github.io/pg-promise/Task.html#.sequence
[API]:http://vitaly-t.github.io/pg-promise
[API Documentation]:http://vitaly-t.github.io/pg-promise
[QueryFile API]:http://vitaly-t.github.io/pg-promise/QueryFile.html
[Transaction Mode]:http://vitaly-t.github.io/pg-promise/txMode.TransactionMode.html
[pg-minify]:https://github.com/vitaly-t/pg-minify
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
[Learn by Example]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example
[Promise Adapter]:https://github.com/vitaly-t/pg-promise/wiki/Promise-Adapter
[spex.sequence]:https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md
[Result]:https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6
