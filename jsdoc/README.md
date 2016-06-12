# API

For additional information see the project's [main page] and [WiKi pages].

[main page]:https://github.com/vitaly-t/pg-promise
[WiKi pages]:https://github.com/vitaly-t/pg-promise/wiki

### Main Types
 
* [Database] - database-level methods and properties
* [Task](http://vitaly-t.github.io/pg-promise/Task.html) - task-level methods and properties

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
[TransactionMode]:http://vitaly-t.github.io/pg-promise/TransactionMode.html
[PromiseAdapter]:http://vitaly-t.github.io/pg-promise/PromiseAdapter.html
[Prepared Statements]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#prepared-statements
[Parameterized Queries]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example#parameterized-queries

### Namespaces

* [formatting] - the library's query formatting engine
* [helpers] - to automatically generate `INSERT` and `UPDATE` queries
* [utils] - to simplify the use of external SQL files
* [errors] - custom error types supported by the library

[formatting]:http://vitaly-t.github.io/pg-promise/formatting.html
[helpers]:http://vitaly-t.github.io/pg-promise/helpers.html
[utils]:http://vitaly-t.github.io/pg-promise/utils.html
[errors]:http://vitaly-t.github.io/pg-promise/errors.html

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
