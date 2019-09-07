### Release History

* 9.0.0 Major update of just about everything. Lots of breaking changes. Released: July 27, 2019.
* 8.4.0 Replacing `isFresh` with `useCount` everywhere. Released: April 18, 2018.
* 8.3.0 Adding initialization option `schema` for dynamic schema change. Released: April 17, 2018.
* 8.2.0 Adding [Conditional Tasks], plus query callbacks. Released: March 10, 2018.
* 8.1.0 Adding new method [utils.taskArgs]. Released: Feb 26, 2018
* 8.0.0 Major changes for task and transaction interfaces. Released: Feb 24, 2018
* 7.5.2 Makes Symbolic CTF within [Custom Type Formatting] global. Released: Feb 12, 2018
* 7.5.1 Added alias `:list` to [CSV Filter]. Released: Feb 12, 2018
* 7.5.0 Extending [CSV Filter]. Released: Feb 12, 2018
* 7.4.1 Added `inTransaction` flag into [TaskContext]. Released: Jan 26, 2018
* 7.4.0 This project is now sponsored by [Lisk]. Released: Jan 20, 2018
* 7.3.0 Updating [as.alias] method, adding method [ColumnSet.assignColumns]. Released: Nov 05, 2017.
* 7.2.0 Renaming `_rawType` into `rawType` within [Custom Type Formatting]. Released: Oct 30, 2017.
* 7.1.0 Adding support for symbols within [Custom Type Formatting]. Released: Oct 29, 2017.
* 7.0.0 Adding methods [multi] and [multiResult] to support multi-query results. Released: Oct 08, 2017.
* 6.10.0 Initial support for [Nested Named Parameters]. Released: Sept 27, 2017
* 6.9.0 Upgrading to [spex] v2.0.0, with the updated protocol. Released: Sept 21, 2017
* 6.8.0 Upgrading [QueryStream] support to use version 1.1.x or later. Released: Sept 20, 2017
* 6.7.0 Upgrading driver [node-postgres] to version 7.x. Released: Sept 17, 2017 
* 6.5.0 [Custom Type Formatting] has been refactored (breaking change). Released: Aug 18, 2017.
* 6.4.0 Adding methods `batch`, `page` and `sequence` to post-`connect` state. Released: Aug 15, 2017.
* 6.3.0 Major re-work on handling connectivity issues. Released: July 01, 2017
* 6.2.0 Extending Task/Transaction context with properties `duration`, `level` and `txLevel`. Released: June 28, 2017.
* 6.1.0 Switching over to the latest 6.4.0 `node-postgres` driver and its new connection pool. Released: June 25, 2017.
* 5.9.0 Added support SQL aliases, plus method `ColumnSet.assign`. Released: June 05, 2017.
* 5.8.0 Added support for warnings to class [QueryFile]. Released: May 29, 2017.
* 5.7.0 Major query formatting overhaul for passing in the calling context. Released: May 15, 2017
* 5.6.0 Removed support for legacy Node.js versions, now requiring 4.x and higher. Released: Feb 25, 2017
* 5.5.5 Extended type `ColumnSet` with new properties `names` and `variables`. Released: Jan 30, 2017
* 5.5.0 Changed the diagnostics for invalid initialization + warnings. Released: Dec 09, 2016
* 5.4.3 Major changes for supporting TypeScript 2.0 (no code changes). Released: Nov 20, 2016.
* 5.4.1 Now forwarding `Date` formatting into the `node-postgres` driver. Released: Nov 20, 2016.
* 5.4.0 Breaking changes: improvements in the [helpers] namespace for the event handlers. Released: Nov 20, 2016.
* 5.2.0 Integrating type [QueryFile] directly into the query-formatting engine. Released: July 15, 2016.
* 5.0.0 Change over to the new version of [spex] 1.0, with new rejection protocol. Released: June 26, 2016.

[Nested Named Parameters]:https://github.com/vitaly-t/pg-promise#nested-named-parameters
[QueryStream]:https://github.com/brianc/node-pg-query-stream
[spex]:https://github.com/vitaly-t/spex
[each]:http://vitaly-t.github.io/pg-promise/Database.html#each
[map]:http://vitaly-t.github.io/pg-promise/Database.html#map
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
[pgp.as]:http://vitaly-t.github.io/pg-promise/formatting.html
[as.value]:http://vitaly-t.github.io/pg-promise/formatting.html#.value
[as.format]:http://vitaly-t.github.io/pg-promise/formatting.html#.format
[as.name]:http://vitaly-t.github.io/pg-promise/formatting.html#.name
[as.alias]:http://vitaly-t.github.io/pg-promise/formatting.html#.alias
[batch]:http://vitaly-t.github.io/pg-promise/Task.html#batch
[sequence]:http://vitaly-t.github.io/pg-promise/Task.html#sequence
[API]:http://vitaly-t.github.io/pg-promise/Database.html
[API Documentation]:http://vitaly-t.github.io/pg-promise/Database.html
[pg-minify]:https://github.com/vitaly-t/pg-minify
[pg-monitor]:https://github.com/vitaly-t/pg-monitor
[pg-promise]:https://github.com/vitaly-t/pg-promise
[PG]:https://github.com/brianc/node-postgres
[pg]:https://github.com/brianc/node-postgres
[node-postgres]:https://github.com/brianc/node-postgres
[Promise]:https://github.com/then/promise
[Learn by Example]:https://github.com/vitaly-t/pg-promise/wiki/Learn-by-Example
[Promise Adapter]:https://github.com/vitaly-t/pg-promise/wiki/Promise-Adapter
[Result]:https://node-postgres.com/api/result
[Custom Type Formatting]:https://github.com/vitaly-t/pg-promise#custom-type-formatting
[multi]:http://vitaly-t.github.io/pg-promise/Database.html#multi
[multiResult]:http://vitaly-t.github.io/pg-promise/Database.html#multiResult
[ColumnSet.assignColumns]:http://vitaly-t.github.io/pg-promise/helpers.ColumnSet.html#assignColumns
[Lisk]:https://lisk.io/
[TaskContext]:http://vitaly-t.github.io/pg-promise/global.html#TaskContext
[CSV Filter]:https://github.com/vitaly-t/pg-promise#csv-filter
[utils.taskArgs]:http://vitaly-t.github.io/pg-promise/utils.html#.taskArgs
[Conditional Tasks]:https://github.com/vitaly-t/pg-promise#conditional-tasks
