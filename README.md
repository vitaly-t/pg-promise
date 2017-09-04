pg-promise
===========

[Promises/A+] interface for PostgreSQL.

[![Build Status](https://travis-ci.org/vitaly-t/pg-promise.svg?branch=master)](https://travis-ci.org/vitaly-t/pg-promise)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/pg-promise/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/pg-promise?branch=master)
[![Package Quality](http://npm.packagequality.com/shield/pg-promise.svg)](http://packagequality.com/#?package=pg-promise)
[![Join the chat at https://gitter.im/vitaly-t/pg-promise](https://img.shields.io/gitter/room/vitaly-t/pg-promise.svg)](https://gitter.im/vitaly-t/pg-promise?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

---
<a href="https://promisesaplus.com/"><img align="right" width="190" height="190" src="http://s8.postimg.org/k7dtue8lx/pg_promise.jpg"></a>

* Supporting [Promise], [Bluebird], [When], [Q], etc.
* Transactions, functions, flexible query formatting;
* Automatic database connections;
* Strict query result filters.

<a href='https://pledgie.com/campaigns/32367'><img alt='Click here to lend your support to: pg-promise and make a donation at pledgie.com !' src='https://pledgie.com/campaigns/32367.png?skin_name=chrome' border='0' ></a> <a href='https://www.paypal.me/VitalyTomilov'><img alt='Click here to lend your support to: pg-promise and make a donation at PayPal.com !' src='https://github.com/vitaly-t/pg-promise/raw/master/jsdoc/paypal.png' border='0' ></a>

---

* [About](#about)
* [Documentation](#documentation)  
* [Testing](#testing)    
* [Usage](#usage)
  - [Queries and Parameters](#queries-and-parameters)
    - [SQL Names](#sql-names)  
    - [Raw Text](#raw-text)  
    - [Open Values](#open-values)        
  - [Query Result Mask](#query-result-mask)    
  - [Named Parameters](#named-parameters)
  - [Conversion Helpers](#conversion-helpers)
  - [Custom Type Formatting](#custom-type-formatting)  
  - [Query Files](#query-files)    
  - [Tasks](#tasks)    
  - [Transactions](#transactions)
    - [Nested Transactions](#nested-transactions)
    - [Synchronous Transactions](#synchronous-transactions)    
    - [Configurable Transactions](#configurable-transactions)
  - [Generators](#generators)
* [Advanced](#advanced)
  - [Initialization Options](#initialization-options)
  - [Library de-initialization](#library-de-initialization)
* [History](#history)
* [License](#license)

---

# About

Built on top of [node-postgres] and its connection pool, this library enhances the callback interface with promises,
while extending the protocol to a higher level, with automated connections and transactions management.

In addition, the library provides:

* its own, more flexible query formatting
* events reporting for connectivity, errors, queries, etc.
* support for all popular promise libraries + ES6 generators
* declarative approach to controlling query results
* extensive support for external SQL files

# Documentation

See the [Official Documentation] to get started.

Much of the documentation on this page below is either detailing some of the larger aspects of using the library,
or the older API documentation, due to be refactored out. You should use the [Official Documentation] as the
most up-to-date source.

# Testing

See [Testing](https://github.com/vitaly-t/pg-promise/wiki/Testing) wiki for instructions on how to test this library.

# Usage

## Queries and Parameters

Every connection context of the library shares the same query protocol, starting with generic method [query],
defined as shown below:

```js
function query(query, values, qrm){}
```

* `query` (required) - a string with support for three types of formatting, depending on the `values` passed:
   - format `$1` (single variable), if `values` is of type `string`, `boolean`, `number`, `Date`, `function`, `null` or [QueryFile];
   - format `$1, $2, etc..`, if `values` is an array;
   - format `$*propName*`, if `values` is an object (not `null` and not `Date`), where `*` is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`;
* `values` (optional) - value/array/object to replace the variables in the query;
* `qrm` - (optional) *Query Result Mask*, as explained below. When not passed, it defaults to `pgp.queryResult.any`.

When a value/property inside array/object is an array, it is treated as a [PostgreSQL Array Type](http://www.postgresql.org/docs/9.4/static/arrays.html),
converted into the array constructor format of `array[]`, the same as calling method `pgp.as.array()`.

When a value/property inside array/object is of type `object` (except for `null`, `Date` or `Buffer`), it is automatically
serialized into JSON, the same as calling method `pgp.as.json()`, except the latter would convert anything to JSON.

For the latest SQL formatting support see the API: methods [query] and [as.format].

### SQL Names

When a variable ends with `~` (tilde) or `:name`, it represents an SQL name or identifier, which must be a text
string of at least 1 character long. Such name is then properly escaped and wrapped in double quotes.

```js
query('INSERT INTO $1~($2~) VALUES(...)', ['Table Name', 'Column Name']);
//=> INSERT INTO "Table Name"("Column Name") VALUES(...)

// A mixed example for a dynamic column list:
const columns = ['id', 'message'];
query('SELECT ${columns^} FROM ${table~}', {
    columns: columns.map(pgp.as.name).join(),
    table: 'Table Name'
});
//=> SELECT "id","message" FROM "Table Name"
```

Version 5.2.1 and later supports extended syntax for `${this~}` and for method [as.name]:

```js
const obj = {
    one: 1,
    two: 2
};

format('INSERT INTO table(${this~}) VALUES(${one}, ${two})', obj);
//=>INSERT INTO table("one","two") VALUES(1, 2)
```

Relying on this type of formatting for sql names and identifiers, along with regular variable formatting
makes your application impervious to sql injection.

See method [as.name] for the latest API.

**Version 5.9.0** added explicit support for SQL aliases, to keep them separate from the generic SQL Names,
as they only allow a simple syntax. See method [as.alias].

The formatting engine was extended with modifier `:alias`, which automatically calls method [as.alias].

### Raw Text

Raw-text values can be injected by ending the variable name with `^` or `:raw`:
`$1^, $2^, etc...`, `$*varName^*`, where `*` is any of the supported open-close pairs: `{}`, `()`, `<>`, `[]`, `//`

Raw text is injected without any pre-processing, which means:

* No proper escaping (replacing each single-quote symbol `'` with two);
* No wrapping text into single quotes.

Unlike regular variables, value for raw-text variables cannot be `null` or `undefined`, because of the ambiguous meaning
in this case. If such values are passed in, the formatter will throw error `Values null/undefined cannot be used as raw text.` 

Special syntax `this^` within the [Named Parameters](#named-parameters) refers to the formatting object itself, to be injected
as a raw-text JSON-formatted string.

For the latest SQL formatting support see method [as.format]

### Open Values

Open values simplify concatenation of string values within a query, primarily for such special cases as `LIKE`/`ILIKE` filters.

Names for open-value variables end with either `:value` or symbol `#`, and it means that such a value is to be properly
formatted and escaped, but not to be wrapped in quotes when it is a text.

Similar to [raw-text](#raw-text) variables, open-value variables are also not allowed to be `null` or `undefined`, or they will throw
error `Open values cannot be null or undefined.` And the difference is that [raw-text](#raw-text) variables are not escaped, while
open-value variables are properly escaped.

Below is an example of formatting `LIKE` filter that ends with a second name: 

```js
// using $1# or $1:value syntax:
query('...WHERE name LIKE \'%$1#\'', 'O\'Connor');
query('...WHERE name LIKE \'%$1:value\'', 'O\'Connor');
//=> ...WHERE name LIKE '%O''Connor'

// using ${propName#} or ${propName:value} syntax:
query('...WHERE name LIKE \'%${filter#}\'', {filter: 'O\'Connor'});
query('...WHERE name LIKE \'%${filter:value}\'', {filter: 'O\'Connor'});
//=> ...WHERE name LIKE '%O''Connor'
```

See also: method [as.value].

## Query Result Mask

In order to eliminate the chances of unexpected query results and thus make the code more robust,
method [query] uses parameter `qrm` (Query Result Mask):

```js
///////////////////////////////////////////////////////
// Query Result Mask flags;
//
// Any combination is supported, except for one + many.
const queryResult = {
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

```js
db.query('select * from users');
```

which is equivalent to making one of the following calls:

```js
const qrm = pgp.queryResult;
db.query('SELECT * FROM users', undefined, qrm.many | qrm.none);
db.query('SELECT * FROM users', undefined, qrm.any);
db.manyOrNone('SELECT * FROM users');
db.any('SELECT * FROM users');
```

This usage pattern is facilitated through result-specific methods that can be used instead of the generic query:

```js
db.many(query, values); // expects one or more rows
db.one(query, values); // expects a single row
db.none(query, values); // expects no rows
db.any(query, values); // expects anything, same as `manyOrNone`
db.oneOrNone(query, values); // expects 1 or 0 rows
db.manyOrNone(query, values); // expects anything, same as `any`
```

There is however one specific method [result](http://vitaly-t.github.io/pg-promise/Database.html#result) to bypass any result verification, and instead resolve
with the original [Result] object passed from the [PG] library.

You can also add your own methods and properties to this protocol via the [extend] event.  

Each query function resolves its **data** according to the `qrm` that was used:

* `none` - **data** is `null`. If the query returns any kind of data, it is rejected.
* `one` - **data** is a single object. If the query returns no data or more than one row of data, it is rejected.
* `many` - **data** is an array of objects. If the query returns no rows, it is rejected.
* `one`|`none` - **data** is `null`, if no data was returned; or a single object, if one row was returned.
    If the query returns more than one row of data, the query is rejected.
* `many`|`none` - **data** is an array of objects. When no rows are returned, **data** is an empty array.

If you try to specify `one`|`many` in the same query, such query will be rejected without executing it, telling you that such mask is invalid.

If `qrm` is not specified when calling generic [query] method, it is assumed to be `many`|`none` = `any`, i.e. any kind of data expected.

> This is all about writing robust code, when the client specifies what kind of data it is ready to handle on the declarative level,
leaving the burden of all extra checks to the library.

## Named Parameters

The library supports named parameters in query formatting, with the syntax of `$*propName*`, where `*` is any of the following open-close
pairs: `{}`, `()`, `<>`, `[]`, `//`

```js
db.query('SELECT * FROM users WHERE name=${name} AND active=$/active/', {
    name: 'John',
    active: true
});
```

The same goes for all types of query methods as well as method [as.format], where `values` can also be an object whose properties can be
referred to by name from within the query.

A valid property name consists of any combination of letters, digits, underscores or `$`, and they are case-sensitive.
Leading and trailing spaces around property names are ignored.

It is important to know that while property values `null` and `undefined` are both formatted as `null`,
an error is thrown when the property doesn't exist at all (except for `partial` replacements - see below).

You can also use `partial` replacements within method [as.format], to ignore variables that do not exist in the formatting object.

#### `this` reference

Property `this` is a reference to the formatting object itself, so it can be inserted as a JSON-formatted string, alongside its properties.

* `${this}` - inserts the object itself as a JSON-formatted string;
* `${this^}` - inserts the object itself as a raw-text JSON-formatted string.

**example:**

```js
const doc = {
    id: 123,
    body: 'some text'
};

db.none('INSERT INTO documents(id, doc) VALUES(${id}, ${this})', doc)
    .then(() => {
        // success;
    })
    .catch(error => {
        // error;
    });
```    

which will execute:
```sql
INSERT INTO documents(id, doc) VALUES(123, '{"id":123,"body":"some text"}')
```

Modifier `:json` is an alternative to formatting the value as a JSON string.

**NOTE:** Technically, it is possible in javascript, though not recommended, for an object to contain a property
with name `this`. And in such cases the property's value will be used instead.

## Functions and Procedures

In PostgreSQL stored procedures are just functions that usually do not return anything.

Suppose we want to call function **findAudit** to find audit records by `user_id` and maximum timestamp.
We can make such call as shown below:

```js
db.func('findAudit', [123, new Date()])
    .then(data => {
        console.log(data); // printing the data returned
    })
    .catch(error => {
        console.log(error); // printing the error
    });
```

We passed it `user_id = 123`, plus current Date/Time as the timestamp. We assume that the function signature matches
the parameters that we passed. All values passed are serialized automatically to comply with PostgreSQL type formats.

Method `func` accepts optional third parameter - `qrm` (Query Result Mask), the same as method [query].

And when you are not expecting any return results, call `db.proc` instead. Both methods return a [Promise] object,
but `db.proc` doesn't take a `qrm` parameter, always assuming it is `one`|`none`.

Summary for supporting procedures and functions:

* `func(query, values, qrm)` - expects the result according to `qrm`
* `proc(query, values)` - calls `func(query, values, qrm.one | qrm.none)`

## Conversion Helpers

The library provides several helper functions to convert javascript types into their proper PostgreSQL presentation that can be passed
directly into queries or functions as parameters. All of such helper functions are located within namespace [pgp.as], and each function
returns a formatted string when successful or throws an error when it fails.

## Custom Type Formatting

**IMPORTANT:** Support for this feature changed in [v6.5.0](https://github.com/vitaly-t/pg-promise/releases/tag/v.6.5.0).

---

Any value/object that has function `toPostgres` makes use of the _Custom Type Formatting_.

Query-formatting engine then calls `toPostgres` to get the actual value, passing it the object via `this`, and as a single parameter
(in case `toPostgres` is an ES6 arrow function):

```js
const obj = {
    toPostgres: function(self) {
        // self = this = obj
        
        // must return the actual value here
    }
}
```

The actual value returned from `toPostgres` is formatted/escaped according to its JavaScript type, unless the object contains
property `_rawType` set to a truthy value, in which case the returned value is assumed to be pre-formatted, and thus injected directly,
as a raw value.

Example below implements a class that auto-formats `ST_MakePoint` from coordinates:

```js
function STPoint(x, y) {
    this._rawType = true; // do not escape the value from toPostgres()
    this.toPostgres = () => pgp.as.format('ST_MakePoint($1, $2)', [x, y]);
}
```

With this class you can use `new STPoint(12, 34)` as a formatting value that will be injected correctly.  

You can also use _Custom Type Formatting_ to override any standard type:

```js
Date.prototype.toPostgres = a => a.getTime();
```

Function `toPostgres` can return anything, including:

* instance of another object that implements its own `toPostgres`
* instance of a regular object, one without `toPostgres` in it
* another function, with recursion of any depth

## Query Files
  
Use of external SQL files (via [QueryFile]) offers many advantages:

* Much cleaner JavaScript code, with all SQL kept in external files;
* Much easier to write large and well-formatted SQL, with comments and whole revisions;
* Changes in external SQL can be automatically re-loaded (option `debug`), without restarting the app;
* Pre-formatting SQL upon loading (option `params`), making a two-step SQL formatting very easy;
* Parsing and minifying SQL (options `minify`/`compress`), for early error detection and smaller queries.

Example:

```js
const path = require('path');

// Helper for linking to external query files:
function sql(file) {
    const fullPath = path.join(__dirname, file);
    return new pgp.QueryFile(fullPath, {minify: true});
}

// Create a QueryFile globally, once per file:
const sqlFindUser = sql('./sql/findUser.sql');

db.one(sqlFindUser, {id: 123})
    .then(user=> {
        console.log(user);
    })
    .catch(error=> {
        if (error instanceof pgp.errors.QueryFileError) {
            // => the error is related to our QueryFile
        }
    });
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

Every query method of the library can accept type [QueryFile] as its `query` parameter.
The type never throws any error, leaving it for query methods to reject with [QueryFileError].

**IMPORTANT**

You should only create a single reusable instance of [QueryFile] per file, in order to avoid
repeated file reads, as the IO is a very expensive resource.

Notable features of [QueryFile]:

* `debug` mode, to make every query request check if the file has changed since it was last read, and if so - read it afresh.
  This way you can write sql queries and see immediate updates without having to restart your application.
* Option `params` is for static SQL pre-formatting, to inject certain values only once, like a schema name or a
  configurable table name.

In version 5.2.0, support for type [QueryFile] was also integrated into the query formatting engine. See method [as.format].

## Tasks

A [task] represents a shared connection to be used within a callback function:

```js
db.task(t => {
    // execute a chain of queries;
})
    .then(data => {
        // success;
    })
    .catch(error => {
        // failed;    
    });
```

The purpose of tasks is to provide a shared connection context for its callback function, and to be released when finished.

## Transactions

A transaction (method [tx]) is a special type of [task] that automatically executes `BEGIN` + `COMMIT`/`ROLLBACK`:

```js
db.tx(t => {
    // creating a sequence of transaction queries:
    const q1 = t.none('UPDATE users SET active=$1 WHERE id=$2', [true, 123]);
    const q2 = t.one('INSERT INTO audit(entity, id) VALUES($1, $2) RETURNING id',
        ['users', 123]);

    // returning a promise that determines a successful transaction:
    return t.batch([q1, q2]); // all of the queries are to be resolved;
})
    .then(data => {
        console.log(data); // printing successful transaction output;
    })
    .catch(error => {
        console.log(error); // printing the error;
    });
```

### Nested Transactions

Nested transactions automatically share the connection between all levels.
This library sets no limitation as to the depth (nesting levels) of transactions supported.

Example:

```js
db.tx(t => {
    const queries = [
        t.none('DROP TABLE users;'),
        t.none('CREATE TABLE users(id SERIAL NOT NULL, name TEXT NOT NULL)')
    ];
    for (let i = 1; i <= 100; i++) {
        queries.push(t.none('INSERT INTO users(name) VALUES($1)', 'name-' + i));
    }
    queries.push(
        t.tx(t1 => {
            return t1.tx(t2 => {
                return t2.one('SELECT count(*) FROM users');
            });
        }));
    return t.batch(queries);
})
    .then(data => {
        console.log(data); // printing transaction result;
    })
    .catch(error => {
        console.log(error); // printing the error;
    });
```

### Implementation details

It is important to know that PostgreSQL doesn't have proper support for nested transactions, but it
supports [savepoints](http://www.postgresql.org/docs/9.4/static/sql-savepoint.html) inside
transactions. Nested transactions and save-points are two ways to deal with *partial rollbacks*.
Save-points are more general and allow this library to offer you nested transactions as an
abstraction.

Save-points allow you to rollback to any previous state since the beginning of the (only) top-level
transaction. Nested transactions allow you to only rollback to the state at the beginning of
the current transaction. Proper support for nested transactions means that the result of a
successful sub-transaction or query is rolled back when its parent transaction is rolled back.

From a practical point of view, it means that when using nested transactions, a rollback knows
automatically which state to restore but when using save-points you must specify which previous
save-point to use.
This library tracks the save-points for you so you can work as if nested transactions were
supported by Postgres.

It is important to note that when using either save-points or "real" nested transactions (which are
tools for partial rollbacks), data is finally written only when the top level transaction is
committed.

Also, Postgres uses `BEGIN` amd `COMMIT / ROLLBACK` for the top transaction and `SAVEPOINT pointName`
and `ROLLBACK TO pointName` for inner save-points. This library automatically provides a transaction
on the top level, and save-points for all sub-transactions.

### Limitations

This implementation of nested transactions has the following transactions
- The `txMode` property of sub-transactions is ignored. The transaction mode is only applied for
  `BEGIN` statements, so only for top-level transactions.
- `SET TRANSACTION` statements are only effective if they are called before any query of the
  real Postgres transaction. This means that once any nested transaction does a query, the
  transaction mode is locked for the whole transaction tree.

See the implementation details above for more information.

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
            return this.query('SELECT 0');
        case 1:
            return this.query('SELECT 1');
        case 2:
            return this.query('SELECT 2');
    }
    // returning or resolving with undefined ends the sequence;
    // throwing an error will result in a reject;
}

db.tx(t => {
    return t.sequence(source);
})
    .then(data => {
        console.log(data); // print result;
    })
    .catch(error => {
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
without your control, or so it was until [Transaction Mode] type was added (read further).

---  

[Transaction Mode] extends the `BEGIN` command in your transaction with a complete set of configuration parameters.

```js
const TransactionMode = pgp.txMode.TransactionMode;
const isolationLevel = pgp.txMode.isolationLevel;
 
// Create a reusable transaction mode (serializable + read-only + deferrable):
const tmSRD = new TransactionMode({
    tiLevel: isolationLevel.serializable,
    readOnly: true,
    deferrable: true
});

function myTransaction() {
    return this.query('SELECT * FROM table');
}

myTransaction.txMode = tmSRD; // assign transaction mode;

db.tx(myTransaction)
    .then(() => {
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

If you prefer writing asynchronous code in a synchronous manner, you can implement your tasks and transactions as generators. 

```js
function * getUser(t) {
    let user = yield t.oneOrNone('SELECT * FROM users WHERE id = $1', 123);
    return yield user || t.one('INSERT INTO users(name) VALUES($1) RETURNING *', 'John');
}

db.task(getUser)
    .then(user => {
        // success;
    })
    .catch(error => {
        // error;
    });
```

The library verifies whether the callback function is a generator, and executes it accordingly.

# Advanced

## Initialization Options

When initializing the library, you can pass object `options` with a set of global properties.
See [API / options](http://vitaly-t.github.io/pg-promise/module-pg-promise.html) for complete list of supported options.

---
#### pgFormatting

By default, **pg-promise** provides its own implementation of the query formatting,
as explained in [Queries and Parameters](#queries-and-parameters).

If, however, you want your queries formatted by the [PG] library, set parameter `pgFormatting`
to be `true` when initializing the library, and every query formatting will redirect to the [PG]'s implementation.

Although this has a huge implication to the library's functionality, it is not within the scope of this project to detail.
For any further reference you should use documentation of the [PG] library.

Below is just some of the query-formatting features implemented by [pg-promise] that are not in [node-postgres]:

* [Custom Type Formatting](#custom-type-formatting)
* Single-value formatting: [pg-promise] doesn't require use of an array when passing a single value;
* [Raw-Text](https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#raw-text) support: injecting raw/pre-formatted text values into the query;
* Functions as formatting parameters, with the actual values returned from the callbacks;
* [PostgreSQL Array Constructors](http://www.postgresql.org/docs/9.1/static/arrays.html#ARRAYS-INPUT) are used when formatting arrays,
not the old string syntax;
* Automatic conversion of numeric `NaN`, `+Infinity` and `-Infinity` into their string presentation;
* Support for [this reference](#this-reference);
* Automatic [QueryFile] support

**NOTE:** Formatting parameters for calling functions (methods `func` and `proc`) is not affected by this override.
When needed, use the generic [query] instead to invoke functions with redirected query formatting.

---
#### promiseLib

By default, **pg-promise** uses ES6 Promise. If your version of NodeJS doesn't support ES6 Promise,
or you want a different promise library to be used, set this property to the library's instance.

Example of switching over to [Bluebird]:

```js
const promise = require('bluebird');
const options = {
    promiseLib: promise
};
const pgp = require('pg-promise')(options);
```

[Promises/A+] libraries that implement a recognizable promise signature and work automatically:

* **ES6 Promise** - used by default, though it doesn't have `done()` or `finally()`.
* [Bluebird] - best alternative all around, which includes the very important [Long Stack Traces](http://bluebirdjs.com/docs/api/promise.longstacktraces.html); 
* [Promise] - very solid library;
* [When] - quite old, not the best support;
* [Q] - most widely used;
* [RSVP] - doesn't have `done()`, use `finally/catch` instead
* [Lie] - doesn't have `done()`. 

If you pass in a library that doesn't implement a recognizable promise signature, **pg-promise** will
throw error `Invalid promise library specified.` during initialization.

For such libraries you can use [Promise Adapter] to make them compatible with **pg-promise**,
mostly needed by smaller and simplified [Conformant Implementations](https://promisesaplus.com/implementations). 

## Library de-initialization

When exiting your application, you can optionally call [pgp.end]:

```js
pgp.end(); // shuts down all connection pools
```

This will release all connection pools, to make sure the process can terminate without any delay.
If you do not call it, your process may be waiting for 30 seconds (default for [poolIdleTimeout](https://github.com/brianc/node-postgres/blob/master/lib/defaults.js#L44)),
waiting for all connections to expire in every pool.

If, however you normally exit your application by killing the NodeJS process, then you don't need to use it.

# History

For the list of all changes see the [CHANGELOG](CHANGELOG.md).

# License

Copyright (c) 2017 Vitaly Tomilov (vitaly.tomilov@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

[extent]:http://vitaly-t.github.io/pg-promise/global.html#event:extend
[Configuration Object]:https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax#configuration-object
[Connection String]:https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax#connection-string
[query]:http://vitaly-t.github.io/pg-promise/Database.html#query
[each]:http://vitaly-t.github.io/pg-promise/Database.html#each
[map]:http://vitaly-t.github.io/pg-promise/Database.html#map
[task]:http://vitaly-t.github.io/pg-promise/Database.html#task
[tx]:http://vitaly-t.github.io/pg-promise/Database.html#tx
[Connection Syntax]:https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax
[helpers]:http://vitaly-t.github.io/pg-promise/helpers.html
[QueryFile]:http://vitaly-t.github.io/pg-promise/QueryFile.html
[QueryFileError]:http://vitaly-t.github.io/pg-promise/QueryFileError.html
[PreparedStatement]:http://vitaly-t.github.io/pg-promise/PreparedStatement.html
[ParameterizedQuery]:http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
[Database]:http://vitaly-t.github.io/pg-promise/Database.html
[QueryResultError]:http://vitaly-t.github.io/pg-promise/QueryResultError.html
[Native Bindings]:https://node-postgres.com/features/native
[Initialization Options]:#advanced
[pgp.end]:http://vitaly-t.github.io/pg-promise/module-pg-promise.html#~end
[pgp.as]:http://vitaly-t.github.io/pg-promise/formatting.html
[as.value]:http://vitaly-t.github.io/pg-promise/formatting.html#.value
[as.format]:http://vitaly-t.github.io/pg-promise/formatting.html#.format
[as.alias]:http://vitaly-t.github.io/pg-promise/formatting.html#.alias
[as.name]:http://vitaly-t.github.io/pg-promise/formatting.html#.name
[batch]:http://vitaly-t.github.io/pg-promise/Task.html#batch
[sequence]:http://vitaly-t.github.io/pg-promise/Task.html#sequence
[Protocol API]:http://vitaly-t.github.io/pg-promise/index.html
[API]:http://vitaly-t.github.io/pg-promise/index.html
[API Documentation]:http://vitaly-t.github.io/pg-promise/index.html
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
[spex.sequence]:http://vitaly-t.github.io/spex/global.html#sequence
[Result]:https://node-postgres.com/api/result
[Official Documentation]:http://vitaly-t.github.io/pg-promise/index.html
