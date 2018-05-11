## Installing

```
$ npm install pg-promise
```

## Initialization

Loading and initializing the library with [Initialization Options]:

```js
const initOptions = {/* initialization options */};
const pgp = require('pg-promise')(initOptions);
```

&#8722; or without [Initialization Options]:

```js
const pgp = require('pg-promise')();
```

## Database

Create your [Database] object from the connection as `pgp(connection, [dc])`:

```js
const db = pgp(connection);
```

* The `connection` parameter is either a [Configuration Object] or a [Connection String].
* `dc` = Database Context - optional parameter (see [Database] constructor).

Object `db` represents the [Database] protocol with lazy connection, i.e. only the actual query methods acquire
and release the connection automatically. Therefore you should create only one global/shared `db` object per connection details.

It is best to initialize the library and create [Database] in its own module, see [Where should I initialize pg-promise].

## Usage

[Learn by Example] is the best quick-start tutorial. For everything else see the [WiKi] pages.

## References

### External Resources

* [The library's Main Page](https://github.com/vitaly-t/pg-promise)
* [TypeScript 2.x](https://github.com/vitaly-t/pg-promise/tree/master/typescript) declarations for the library
* [The library's WiKi Pages](https://github.com/vitaly-t/pg-promise/wiki)
* [Popular questions on StackOverflow](https://stackoverflow.com/questions/tagged/pg-promise?sort=votes&pageSize=50) 

### Main Types
 
* [Database] - database-level methods and properties
* [Task](http://vitaly-t.github.io/pg-promise/Task.html) - extends [Database] with task-level methods and properties

[Database]:http://vitaly-t.github.io/pg-promise/Database.html

### Special Types

* [QueryFile] - type for working with external SQL files
* [PreparedStatement] - type for working with [Prepared Statements]
* [ParameterizedQuery] - type for working with [Parameterized Queries]
* [TransactionMode] - transaction configuration type
* [PromiseAdapter] - adapter for using non-standard promise libraries

[QueryFile]:http://vitaly-t.github.io/pg-promise/QueryFile.html
[PreparedStatement]:http://vitaly-t.github.io/pg-promise/PreparedStatement.html
[ParameterizedQuery]:http://vitaly-t.github.io/pg-promise/ParameterizedQuery.html
[TransactionMode]:http://vitaly-t.github.io/pg-promise/txMode.TransactionMode.html
[PromiseAdapter]:http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
[Prepared Statements]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#prepared-statements
[Parameterized Queries]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#parameterized-queries

### Namespaces

* [formatting] - the library's query formatting engine
* [ctf] - ES6 symbols used by [Custom Type Formatting]
* [helpers] - for automatic query generation
* [utils] - simplifies the use of external SQL files
* [errors] - custom error types supported by the library
* [txMode] - types for configuring a transaction

[formatting]:http://vitaly-t.github.io/pg-promise/formatting.html
[ctf]:http://vitaly-t.github.io/pg-promise/formatting.ctf.html
[helpers]:http://vitaly-t.github.io/pg-promise/helpers.html
[utils]:http://vitaly-t.github.io/pg-promise/utils.html
[errors]:http://vitaly-t.github.io/pg-promise/errors.html
[txMode]:http://vitaly-t.github.io/pg-promise/txMode.html

### Events

* [connect] - connecting to the database
* [disconnect] - disconnecting from the database
* [query] - executing a query
* [task] - task start/end events
* [transact] - transaction start/end events
* [receive] - receiving data from a query
* [error] - global error handler
* [extend] - interface extension event

[connect]:http://vitaly-t.github.io/pg-promise/global.html#event:connect
[disconnect]:http://vitaly-t.github.io/pg-promise/global.html#event:disconnect
[query]:http://vitaly-t.github.io/pg-promise/global.html#event:query
[task]:http://vitaly-t.github.io/pg-promise/global.html#event:task
[transact]:http://vitaly-t.github.io/pg-promise/global.html#event:transact
[receive]:http://vitaly-t.github.io/pg-promise/global.html#event:receive
[error]:http://vitaly-t.github.io/pg-promise/global.html#event:error
[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend

[Configuration Object]:https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax#configuration-object
[Connection String]:https://github.com/vitaly-t/pg-promise/wiki/Connection-Syntax#connection-string
[Initialization Options]:http://vitaly-t.github.io/pg-promise/module-pg-promise.html
[Where should I initialize pg-promise]:https://stackoverflow.com/questions/34382796/where-should-i-initialize-pg-promise
[Learn by Example]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example
[WiKi]:https://github.com/vitaly-t/pg-promise/wiki
[Custom Type Formatting]:https://github.com/vitaly-t/pg-promise#custom-type-formatting

