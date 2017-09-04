### Release History

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
* 4.8.0 Major refactoring for the entire rejection mechanism to adhere to better promise standards. Released: June 23, 2016.
* 4.7.0 Added diagnostics for invalid use of the library. Released: June 18, 2016
* 4.6.0 Extending all single-result query methods, plus exposing the [spex] instance. Released: June 10, 2016
* 4.5.0 Removed support for Configuration Files, set pg dependency to 5.x. Released: June 8, 2016  
* 4.4.2 Added support for [Configuration Path]. Released: June 5, 2016
* 4.4.0 Added namespace [utils] for automatic SQL tree generation. Released: June 3, 2016
* 4.3.0 Improving [PreparedStatement] and [ParameterizedQuery], adding methods [map] and [each] to the database protocol. Released: May 25, 2016
* 4.1.0 Adding [helpers] namespace with additional query-formatting methods. Released: May 12, 2016
* 4.0.0 Consolidating the entire error-reporting mechanism. Released: April 24, 2016
* 3.9.0 Prepared Statements support rewritten, adding new type [PreparedStatement]. Released: April 20, 2016
* 3.8.0 Added Database Context support (see [Database]). Released: April 14, 2016
* 3.7.1 Adding internal typescript support to the library. Released: April 10, 2016
* 3.7.0 Modifying the protocol to accommodate changes in `pg` 4.5.3 for isolated [Native Bindings]. Released: April 9, 2016
* 3.6.0 Extending [QueryResultError] for better diagnostics. Released: April 8, 2016
* 3.5.0 Adding support for [Native Bindings]. Released: April 06, 2016
* 3.4.0 Adding support for [Open Values](README.md#open-values) and type `Buffer`. Released: March 20, 2016
* 3.3.0 Adding strict variable requirement to `$1, $2,...` formatting. Released: March 05, 2016
* 3.2.1 Adding support for formatting overrides: `:raw`, `:name`, `:json` and `:csv`. Released: February 22, 2016
* 3.2.0 Adding formatting options support, specifically option `partial`, add its use within [Query Files](README.md#query-files). Released: February 20, 2016
* 3.1.0 Adding support for [SQL Names](README.md#sql-names). Released: January 27, 2016
* 3.0.3 Complete replacement of the API with GitHub-hosted one. Released: January 21, 2016
* 2.9.3 Replaced all SQL processing with [pg-minify] dependency. Released: January 20, 2016
* 2.9.1 added custom SQL parser for external files. Released: January 19, 2016
* 2.9.0 added support for [Query Files](README.md#query-files). Released: January 18, 2016
* 2.8.0 added support for [event receive](http://vitaly-t.github.io/pg-promise/global.html#event:receive). Released: December 14, 2015
* 2.6.0 added support for [ES6 Generators](README.md#generators). Released: November 30, 2015
* 2.5.0 added support for [Configurable Transactions](README.md#configurable-transactions). Released: November 26, 2015
* 2.4.0 library re-organized for better documentation and easier maintenance. Released: November 24, 2015
* 2.2.0 major rework on the nested transactions support. Released: October 23, 2015
* 2.0.8 added all the long-outstanding breaking changes (the list was retired). Released: October 12, 2015
* 1.11.0 added [noLocking](README.md#nolocking) initialization option. Released: September 30, 2015.
* 1.10.3 added enforced locks on every level of the library. Released: September 11, 2015.
* 1.10.0 added support for `batch` execution within tasks and transactions. Released: September 10, 2015.
* 1.9.5 added support for [Raw Custom Types](README.md#raw-custom-types). Released: August 30, 2015.
* 1.9.3 added support for [Custom Type Formatting](README.md#custom-type-formatting). Released: August 30, 2015.
* 1.9.0 added support for [Tasks](#tasks) + initial [jsDoc](https://github.com/jsdoc3/jsdoc) support. Released: August 21, 2015.
* 1.8.2 added support for [Prepared Statements](https://github.com/brianc/node-postgres/wiki/Prepared-Statements). Released: August 01, 2015.
* 1.8.0 added support for Query Streaming via [node-pg-query-stream](https://github.com/brianc/node-pg-query-stream). Released: July 23, 2015.
* 1.7.2 significant code refactoring and optimizations; added support for super-massive transactions. Released: June 27, 2015.
* 1.6.0 major update for the test platform + adding coverage. Released: June 19, 2015.
* 1.5.0 major changes in architecture and query formatting. Released: June 14, 2015.
* 1.4.0 added `this` context to all callbacks where applicable. Released: May 31, 2015.
* 1.3.1 extended [Named Parameters](README.md#named-parameters) syntax to support `{}`,`()`,`[]`,`<>` and `//`. Released: May 24, 2015.
* 1.3.0 much improved error handling and reporting. Released: May 23, 2015.
* 1.2.0 extended [Named Parameters](README.md#named-parameters) syntax with `$(varName)`. Released: May 16, 2015.
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


[spex]:https://github.com/vitaly-t/spex
[utils]:http://vitaly-t.github.io/pg-promise/utils.html
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
[batch]:http://vitaly-t.github.io/pg-promise/Task.html#batch
[sequence]:http://vitaly-t.github.io/pg-promise/Task.html#sequence
[API]:http://vitaly-t.github.io/pg-promise/Database.html
[API Documentation]:http://vitaly-t.github.io/pg-promise/Database.html
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
[Result]:https://node-postgres.com/api/result
[Custom Type Formatting]:https://github.com/vitaly-t/pg-promise#custom-type-formatting

