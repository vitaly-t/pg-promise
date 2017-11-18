pg-promise
==========

[Promises/A+] interface for PostgreSQL.

[![Build Status](https://travis-ci.org/vitaly-t/pg-promise.svg?branch=master)](https://travis-ci.org/vitaly-t/pg-promise)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/pg-promise/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/pg-promise?branch=master)
[![Package Quality](http://npm.packagequality.com/shield/pg-promise.svg)](http://packagequality.com/#?package=pg-promise)
[![Join the chat at https://gitter.im/vitaly-t/pg-promise](https://img.shields.io/gitter/room/vitaly-t/pg-promise.svg)](https://gitter.im/vitaly-t/pg-promise?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

---

<a href='https://pledgie.com/campaigns/32367'><img alt='Click here to lend your support to: pg-promise and make a donation at pledgie.com !' src='https://pledgie.com/campaigns/32367.png?skin_name=chrome' border='0' ></a> <a href='https://www.paypal.me/VitalyTomilov'><img alt='Click here to lend your support to: pg-promise and make a donation at PayPal.com !' src='https://github.com/vitaly-t/pg-promise/raw/master/jsdoc/paypal.png' border='0' ></a>

* [About](#about)
* [Documentation](#documentation)  
* [Contributing](#contributing)    
* [Usage]
  - [Methods](#methods)
  - [Query Formatting](#query-formatting)
    - [Index Variables]  
    - [Named Parameters]
      - [Nested Named Parameters]
  - [Formatting Filters](#formatting-filters)          
    - [SQL Names]  
      - [Alias Filter]    
    - [Raw Text]  
    - [Open Values]
    - [JSON Filter]
    - [CSV Filter]    
  - [Custom Type Formatting]
    - [Explicit CTF]
    - [Symbolic CTF]    
  - [Query Files](#query-files)    
  - [Tasks](#tasks)    
  - [Transactions](#transactions)
    - [Nested Transactions](#nested-transactions)   
    - [Configurable Transactions](#configurable-transactions)
  - [ES6 Generators](#es6-generators)
  - [Library de-initialization](#library-de-initialization)
* [History](#history)
* [License](#license)

---

# About

Built on top of [node-postgres], this library adds the following:

* Automatic connections
* Automatic transactions
* Powerful query-formatting engine
* Support for ES6 generators and ES7 `async/await`
* Declarative approach to handling query results
* Global events reporting for central handling
* Extensive support for external SQL files
* Support for all promise libraries

# Documentation

Chapter [Usage] below explains the basics you need to know, while the [Official Documentation]
gets you started, and provides links to all other resources.

# Contributing

Please read the [Contribution Notes](https://github.com/vitaly-t/pg-promise/blob/master/CONTRIBUTING.md) before opening any new issue or PR.

# Usage

Once you have created a [Database] object, according to the steps in the [Official Documentation],
you get access to the methods documented below. 

## Methods 

All query methods of the library are based off generic method [query].

You should normally use only the derived, result-specific methods for executing queries, all of which are named according
to how many rows of data the query is expected to return, so for each query you should pick the right method:
[none], [one], [oneOrNone], [many], [manyOrNone] = [any]. Do not confuse the method name for the number of rows
to be affected by the query, which is completely irrelevant.

By relying on the result-specific methods you protect your code from an unexpected number of data rows,
to be automatically rejected (treated as errors).  

There are also a few specific methods that you will often need:

* [result], [multi], [multiResult] - for verbose and/or multi-query results;
* [map], [each] - for simpler/inline result pre-processing/re-mapping;
* [func], [proc] - to simplify execution of SQL functions/procedures;
* [stream] - to access rows from a query via a read stream;
* [connect], [task] + [tx] - for shared connections + automatic transactions, each exposing a connected protocol that
  has additional methods [batch], [page] and [sequence].

The protocol is fully customizable / extendable via event [extend].

**IMPORTANT:**

The most important methods to understand from start are [task] and [tx]. As documented for method [query],
it acquires and releases the connection, which makes it a poor choice for executing multiple queries at once.
For this reason, [Chaining Queries] is an absolute must-read, to avoid writing the code that misuses connections.

[Learn by Example] is a beginner's tutorial based on examples.

## Query Formatting

This library comes with embedded query-formatting engine that offers high-performance value escaping,
flexibility and extensibility. It is used by default with all query methods, unless you opt out of it entirely
via option `pgFormatting` within [Initialization Options].  

All formatting methods used internally are available from the [formatting] namespace, so they can also be used
directly when needed. The main method there is [format], used by every query method to format the query. 

The formatting syntax for variables is decided from the type of `values` passed in:

* [Index Variables] when `values` is an array or a single basic type;
* [Named Parameters] when `values` is an object (other than `Array` or `null`).

**ATTENTION:** Never use ES6 template strings or manual concatenation to generate queries, as both
can easily result in broken queries! Only this library's formatting engine knows how to properly escape
variable values for PostgreSQL.

### Index Variables

The simplest (classic) formatting uses `$1, $2, ...` syntax to inject values into the query string,
based on their index (from `$1` to `$100000`) from the array of values: 

```js
db.any('SELECT * FROM product WHERE price BETWEEN $1 AND $2', [1, 10])
```

The formatting engine also supports single-value parametrization for queries that use only variable `$1`: 

```js
db.any('SELECT * FROM users WHERE name = $1', 'John')
```

This however works only for types `number`, `string`, `boolean`, `Date` and `null`, because types like `Array`
and `Object` change the way parameters are interpreted. That's why passing in index variables within an array
is advised as safer, to avoid ambiguities.

### Named Parameters

When a query method is parameterized with `values` as an object, the formatting engine expects the query to use
the Named Parameter syntax `$*propName*`, with `*` being any of the following open-close pairs: `{}`, `()`, `<>`, `[]`, `//`.

```js
db.any('SELECT * FROM users WHERE name = ${name} AND active = $/active/', {
    name: 'John',
    active: true
});
```

Valid variable names are limited to the syntax of open-name JavaScript variables. 

Keep in mind that while property values `null` and `undefined` are both formatted as `null`,
an error is thrown when the property does not exist.

**`this` reference**

Property `this` refers to the formatting object itself, to be inserted as a JSON-formatted string.

```js
db.none('INSERT INTO documents(id, doc) VALUES(${id}, ${this})', {
    id: 123,
    body: 'some text'    
})
//=> INSERT INTO documents(id, doc) VALUES(123, '{"id":123,"body":"some text"}')
```    

#### Nested Named Parameters

Starting from v6.10.0, the library supports _Nested Named Parameters_:

```js
const obj = {
    one: {
        two: {
            three: 123
        }
    }
};
db.any('SELECT ${one.two.three} FROM table', obj);
```

And the last name in the resolution (like `three` above) can also be a function that returns the actual value,
to be called with `this` + single parameter pointing at the containing object (`two` in the example), or it can be
a [Custom Type Formatting] object, and so on, i.e. any type, and of any depth of nesting.

Please note, however, that nested parameters are not supported within the [helpers] namespace.

## Formatting Filters

By default, all values are formatted according to their JavaScript type. Formatting filters (or modifiers),
change that, so the value is formatted differently. 

Filters use the same syntax for [Index Variables] and [Named Parameters], following immediately the variable name:

* For [Index Variables]

```js
db.any('SELECT $1:name FROM $2:name', ['price', 'products'])
//=> SELECT "price" FROM "products"
```

* For [Named Parameters]

```js
db.any('SELECT ${column:name} FROM ${table:name}', {
    column: 'price',
    table: 'products'    
});
//=> SELECT "price" FROM "products"
```

The following filters are supported:

* `:name` / `~` - [SQL Names]
  - `:alias` - [Alias Filter]
* `:raw` / `^` - [Raw Text]
* `:value` / `#` - [Open Values]
* `:json` - [JSON Filter]
* `:csv` - [CSV Filter]

### SQL Names

When a variable ends with `:name`, or shorter syntax `~` (tilde), it represents an SQL name or identifier,
to be escaped accordingly, and then wrapped in double quotes:

```js
db.query('INSERT INTO $1~($2~) VALUES(...)', ['Table Name', 'Column Name']);
//=> INSERT INTO "Table Name"("Column Name") VALUES(...)
```

Typically, an SQL name variable is a text string, which must be at least 1 character long.
However, `pg-promise` supports a variety of ways in which SQL names can be supplied:

* A string that contains only `*` (asterisks) is automatically recognized as _all columns_:

```js
db.query('SELECT $1:name FROM $2:name', ['*', 'table']);
//=> SELECT * FROM "table"
```

* An array of strings to represent column names:

```js
db.query('SELECT ${columns:name} FROM ${table:name}', {
    columns: ['column1', 'column2'],
    table: 'table'
});
//=> SELECT "column1","column2" FROM "table"
```

* Any object that's not an array gets its properties enumerated for column names:

```js
const obj = {
    one: 1,
    two: 2
};
db.query('SELECT $1:name FROM $2:name', [obj, 'table']);
//=> SELECT "one","two" FROM "table"
```

In addition, the syntax supports `this` to enumerate column names from the formatting object:
 
```js
const obj = {
    one: 1,
    two: 2
};
db.query('INSERT INTO table(${this:name}) VALUES(${one}, ${two})', obj);
//=> INSERT INTO table("one","two") VALUES(1, 2)
```

Relying on this type of formatting for sql names and identifiers, along with regular variable formatting
makes your application impervious to [SQL injection].

Method [as.name] implements the formatting.

#### Alias Filter

An alias is a lighter/simpler version of [SQL Names], which only supports a text string, and is used via the `:alias` filter.

For example, it will skip adding surrounding double quotes when the name is a same-case single word:

```js
db.any('SELECT full_name as $1:alias FROM $2:name', ['name', 'table']);
//=> SELECT full_name as name FROM "table"
```

For more details see method [as.alias] that implements the formatting.

### Raw Text

When a variable ends with `:raw`, or shorter syntax `^`, the value is to be injected as raw text, without escaping.

Such variables cannot be `null` or `undefined`, because of the ambiguous meaning in this case, and those values
will throw error `Values null/undefined cannot be used as raw text.`

```js
const where = pgp.as.format('WHERE price BETWEEN $1 AND $2', [5, 10]); // pre-format WHERE condition
db.any('SELECT * FROM products $1:raw', where);
//=> SELECT * FROM products WHERE price BETWEEN 5 AND 10
```

Special syntax `this:raw` / `this^` is supported, to inject the formatting object as raw JSON string.

### Open Values

When a variable ends with `:value`, or shorter syntax `#`, it is escaped as usual, except when its type is a string,
the trailing quotes are not added.

Open values are primarily to be able to compose complete `LIKE`/`ILIKE` dynamic statements in external SQL files,
without having to generate them in the code.

i.e. you can either generate a filter like this in your code:

```js
const name = 'John';
const filter = '%' + name + '%';
```

and then pass it in as a regular string variable, or you can pass in only `name`, and have your query use the
open-value syntax to add the extra search logic:

```sql
SELECT * FROM table WHERE name LIKE '%$1:value%')
```

Method [as.value] implements the formatting.

### JSON Filter

When a variable ends with `:json`, explicit JSON formatting is applied to the value.

By default, any object that's not `Date`, `Array`, `null` or Custom-Type (see [Custom Type Formatting]),
is automatically formatted as JSON.

Method [as.json] implements the formatting.

### CSV Filter

When a variable ends with `:csv`, it is formatted as a list of Comma-Separated Values, with each
value formatted according to its JavaScript type.
 
Typically, you would use this for a value that's an array. However, when it is not an array, the single value
is formatted as usual - like there is no filter specified. 

```js
const ids = [1, 2, 3];
db.any('SELECT * FROM table WHERE id IN ($1:csv)', [ids])
//=> SELECT * FROM table WHERE id IN (1,2,3)
```

Method [as.csv] implements the formatting.

## Custom Type Formatting

Starting from version 7.2.0, the library supports dual syntax for _CTF_ (Custom Type Formatting):

* [Explicit CTF] - extending the object/type directly, for ease of use, while changing its signature;
* [Symbolic CTF] - extending the object/type via [Symbol] properties, without changing its signature.

The library always first checks for the [Symbolic CTF], and if no such syntax is used, only then it checks for the [Explicit CTF].

### Explicit CTF

Any value/object that implements function `toPostgres` is treated as a custom formatting type. The function is then called to get the actual value,
passing it the value/object via `this` context, and plus as a single parameter (in case `toPostgres` is an ES6 arrow function):

```js
const obj = {
    toPostgres(self) {
        // self = this = obj
        
        // return a value that needs proper escaping
    }
}
```

Function `toPostgres` can return anything, including another object with its own `toPostgres` function, i.e. nested custom types are supported.

The value returned from `toPostgres` is escaped according to its JavaScript type, unless the object also contains property `rawType` set
to a truthy value, in which case the returned value is considered pre-formatted, and thus injected directly, as [Raw Text]:

```js
const obj = {
    toPostgres(self) {
        // self = this = obj
        
        // return a pre-formatted value that does not need escaping
    },
    rawType: true // use result from toPostgres directly, as Raw Text
}
```

Example below implements a class that auto-formats `ST_MakePoint` from coordinates:

```js
class STPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.rawType = true; // no escaping, because we return pre-formatted SQL
    }
    
    toPostgres(self) {
        return pgp.as.format('ST_MakePoint($1, $2)', [this.x, this.y]);
    }
}
```

And a classic syntax for such a class is even simpler:

```js
function STPoint(x, y){
    this.rawType = true; // no escaping, because we return pre-formatted SQL
    this.toPostgres = () => pgp.as.format('ST_MakePoint($1, $2)', [x, y]);
}
```

With this class you can use `new STPoint(12, 34)` as a formatting value that will be injected correctly.  

You can also use _CTF_ to override any standard type:

```js
Date.prototype.toPostgres = a => a.getTime();
```

### Symbolic CTF

The only difference from [Explicit CTF] is that we set `toPostgres` and `rawType` as ES6 [Symbol] properties,
defined in the [ctf] namespace: 

```js
const ctf = pgp.as.ctf; // CTF symbols

const obj = {
    [ctf.toPostgres](self) {
        // self = this = obj
        
        // return a pre-formatted value that does not need escaping
    },
    [ctf.rawType]: true // use result from toPostgres directly, as Raw Text
}
```

Other than that, it works exactly as the [Explicit CTF], but without changing the object's signature.

If you do not know what it means, you should read the ES6 [Symbol] API and its use for unique property names.
But in short, [Symbol] properties are not enumerated via `for(name in obj)`, i.e. they are not generally visible within
JavaScript, only through specific API such as `Object.getOwnPropertySymbols`.

## Query Files
  
Use of external SQL files (via [QueryFile]) offers many advantages:

* Much cleaner JavaScript code, with all SQL kept in external files;
* Much easier to write large and well-formatted SQL, with comments and whole revisions;
* Changes in external SQL can be automatically re-loaded (option `debug`), without restarting the app;
* Pre-formatting SQL upon loading (option `params`), making a two-step SQL formatting a breathe;
* Parsing and minifying SQL (options `minify`/`compress`), for early error detection and compact queries.

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
    .then(user => {
        console.log(user);
    })
    .catch(error => {
        if (error instanceof pgp.errors.QueryFileError) {
            // => the error is related to our QueryFile
        }
    });
```

File `findUser.sql`:

```sql
/*
    multi-line comments are supported
*/
SELECT name, dob -- single-line comments are supported
FROM Users
WHERE id = ${id}
```

Every query method of the library can accept type [QueryFile] as its `query` parameter.
The type never throws any error, leaving it for query methods to gracefully reject with [QueryFileError].

Use of [Named Parameters] withing external SQL files is recommended over the [Index Variables], because it makes the SQL
much easier to read and understand, and because it also allows [Nested Named Parameters], so variables in a large
and complex SQL file can be grouped in namespaces for even easier visual separation.

## Tasks

A [task] represents a shared connection for executing multiple queries:

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

Tasks provide a shared connection context for its callback function, to be released when finished.
See also [Chaining Queries] to understand the importance of using tasks.

## Transactions

Transaction method [tx] is like [task] that also executes `BEGIN` + `COMMIT`/`ROLLBACK` when needed:

```js
db.tx(t => {
    // creating a sequence of transaction queries:
    const q1 = t.none('UPDATE users SET active = $1 WHERE id = $2', [true, 123]);
    const q2 = t.one('INSERT INTO audit(entity, id) VALUES($1, $2) RETURNING id',
        ['users', 123]);

    // returning a promise that determines a successful transaction:
    return t.batch([q1, q2]); // all of the queries are to be resolved;
})
    .then(data => {
        console.log(data); // successful transaction output;
    })
    .catch(error => {
        console.log(error);
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

It is important to know that PostgreSQL does not support full/atomic nested transactions, it only
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

## ES6 Generators

If you prefer writing asynchronous code in a synchronous manner, you can implement your tasks and transactions as generators. 

```js
function * getUser(t) {
    const user = yield t.oneOrNone('SELECT * FROM users WHERE id = $1', 123);
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

## Library de-initialization

This library manages all database connections via the [connection pool], which internally caches them.

Connections in the cache expire due to inactivity after [idleTimeoutMillis] number of milliseconds, which you
can adjust when creating the [Database] object, or override the default via `pgp.pg.defaults.idleTimeoutMillis`
before creating the [Database] object. 

While there is a single open connection in the pool, the process cannot terminate by itself, only via `process.exit()`. 
If you want the process to finish by itself, without waiting for all connections in the pool to expire, you need
to force the pool to shut down all the connections it holds:

```js
db.$pool.end(); // shuts down the connection pool associated with the Database object
``` 

For example, if you are using the [Bluebird] library, you can chain the last promise in the process like this:

```js
.finally(db.$pool.end);
``` 

**IMPORTANT:** Note that if your app is an HTTP service, or generally an application that does not feature any exit point,
then you should not do any de-initialization at all. It is only if your app is a run-through process/utility, then you
might want to use it, so the process ends without delays.  

In applications that either use multiple databases or execute a multi-pool strategy for balanced query loads, you would end up
with multiple [Database] objects, each with its own connection pool. In this scenario, in order to exit the process normally,
at a particular point, you can call [pgp.end] to shut down all connection pools at once:

```js
pgp.end(); // shuts down all connection pools created in the process
```

or promise-chained to the last query block in the process:

```js
.finally(pgp.end);
``` 

Once you have shut down the pool associated with your [Database] object, you can longer use the object, and any of its query methods
will be rejecting with [Error] = `Connection pool of the database object has been destroyed`.

See the relevant API: [pgp.end], [Database.$pool]
 
# History

For the list of all changes see the [CHANGELOG](CHANGELOG.md).

# License

Copyright (c) 2017 Vitaly Tomilov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

<!-- Internal Menu Links -->

[Usage]:#usage
[Index Variables]:#index-variables  
[Named Parameters]:#named-parameters
[Nested Named Parameters]:#nested-named-parameters
[SQL Names]:#sql-names
[Raw Text]:#raw-text
[Open Values]:#open-values
[Alias Filter]:#alias-filter
[JSON Filter]:#json-filter
[CSV Filter]:#csv-filter
[Custom Type Formatting]:#custom-type-formatting
[Explicit CTF]:#explicit-ctf
[Symbolic CTF]:#symbolic-ctf

<!-- Method Links -->

[query]:http://vitaly-t.github.io/pg-promise/Database.html#query
[none]:http://vitaly-t.github.io/pg-promise/Database.html#none
[one]:http://vitaly-t.github.io/pg-promise/Database.html#one
[oneOrNone]:http://vitaly-t.github.io/pg-promise/Database.html#oneOrNone
[many]:http://vitaly-t.github.io/pg-promise/Database.html#many
[manyOrNone]:http://vitaly-t.github.io/pg-promise/Database.html#manyOrNone
[any]:http://vitaly-t.github.io/pg-promise/Database.html#any
[result]:http://vitaly-t.github.io/pg-promise/Database.html#result
[multi]:http://vitaly-t.github.io/pg-promise/Database.html#multi
[multiResult]:http://vitaly-t.github.io/pg-promise/Database.html#multiResult
[map]:http://vitaly-t.github.io/pg-promise/Database.html#map
[each]:http://vitaly-t.github.io/pg-promise/Database.html#each
[func]:http://vitaly-t.github.io/pg-promise/Database.html#func
[proc]:http://vitaly-t.github.io/pg-promise/Database.html#proc
[stream]:http://vitaly-t.github.io/pg-promise/Database.html#stream
[connect]:http://vitaly-t.github.io/pg-promise/Database.html#connect
[task]:http://vitaly-t.github.io/pg-promise/Database.html#task
[tx]:http://vitaly-t.github.io/pg-promise/Database.html#tx
[batch]:http://vitaly-t.github.io/pg-promise/Task.html#batch
[sequence]:http://vitaly-t.github.io/pg-promise/Task.html#sequence
[page]:http://vitaly-t.github.io/pg-promise/Task.html#page
[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend

<!-- API Links -->

[Official Documentation]:http://vitaly-t.github.io/pg-promise/index.html
[Initialization Options]:http://vitaly-t.github.io/pg-promise/module-pg-promise.html
[helpers]:http://vitaly-t.github.io/pg-promise/helpers.html
[QueryFile]:http://vitaly-t.github.io/pg-promise/QueryFile.html
[QueryFileError]:http://vitaly-t.github.io/pg-promise/QueryFileError.html
[Database]:http://vitaly-t.github.io/pg-promise/Database.html
[Database.$pool]:http://vitaly-t.github.io/pg-promise/Database.html#$pool
[pgp.end]:http://vitaly-t.github.io/pg-promise/module-pg-promise.html#~end
[formatting]:http://vitaly-t.github.io/pg-promise/formatting.html
[ctf]:http://vitaly-t.github.io/pg-promise/formatting.ctf.html
[as.format]:http://vitaly-t.github.io/pg-promise/formatting.html#.format
[format]:http://vitaly-t.github.io/pg-promise/formatting.html#.format
[as.value]:http://vitaly-t.github.io/pg-promise/formatting.html#.value
[as.csv]:http://vitaly-t.github.io/pg-promise/formatting.html#.csv
[as.json]:http://vitaly-t.github.io/pg-promise/formatting.html#.json
[as.name]:http://vitaly-t.github.io/pg-promise/formatting.html#.name
[as.alias]:http://vitaly-t.github.io/pg-promise/formatting.html#.alias
[Transaction Mode]:http://vitaly-t.github.io/pg-promise/txMode.TransactionMode.html

<!-- WiKi Links -->

[Learn by Example]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example
[Chaining Queries]:https://github.com/vitaly-t/pg-promise/wiki/Chaining-Queries

<!-- External Links -->

[node-postgres]:https://github.com/brianc/node-postgres
[Promises/A+]:https://promisesaplus.com/
[Bluebird]:https://github.com/petkaantonov/bluebird
[SQL injection]:https://en.wikipedia.org/wiki/SQL_injection
[Symbol]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
[idleTimeoutMillis]:https://github.com/brianc/node-postgres/blob/master/lib/defaults.js#L46
[connection pool]:https://github.com/brianc/node-pg-pool
[Error]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
