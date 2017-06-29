## PG-PROMISE API

See also resources outside of the API:

* [The library's Main Page](https://github.com/vitaly-t/pg-promise)
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
* [helpers] - for automatic query generation
* [utils] - simplifies the use of external SQL files
* [errors] - custom error types supported by the library
* [txMode] - types for configuring a transaction

[formatting]:http://vitaly-t.github.io/pg-promise/formatting.html
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
