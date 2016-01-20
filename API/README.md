## Modules

<dl>
<dt><a href="#module_pg-promise">pg-promise</a></dt>
<dd><p>Advanced access layer to node-postgres via <a href="https://promisesaplus.com">Promises/A+</a></p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#Database">Database</a></dt>
<dd></dd>
<dt><a href="#Task">Task</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#queryResult">queryResult</a> : <code>enum</code></dt>
<dd><p>Binary mask that represents the result expected from queries.
It is used in the generic <a href="module:pg-promise.Database#query">query</a> method,
as well as method <a href="module:pg-promise.Database#func">func</a>.</p>
<p>The mask is always the last optional parameter, which defaults to <code>queryResult.any</code>.</p>
<p>Any combination of flags is supported, except for <code>one + many</code>.</p>
<p>The type is available from the library&#39;s root: <code>pgp.queryResult</code>.</p>
</dd>
</dl>

## Events

<dl>
<dt><a href="#event_connect">"connect" (client)</a></dt>
<dd></dd>
<dt><a href="#event_disconnect">"disconnect" (client)</a></dt>
<dd></dd>
<dt><a href="#event_query">"query" (e)</a></dt>
<dd></dd>
<dt><a href="#event_receive">"receive" (data, result, e)</a></dt>
<dd></dd>
<dt><a href="#event_task">"task" (e)</a></dt>
<dd></dd>
<dt><a href="#event_transact">"transact" (e)</a></dt>
<dd></dd>
<dt><a href="#event_error">"error" (err, e)</a></dt>
<dd></dd>
<dt><a href="#event_extend">"extend" (obj)</a></dt>
<dd></dd>
</dl>

<a name="module_pg-promise"></a>
## pg-promise
Advanced access layer to node-postgres via <a href="https://promisesaplus.com">Promises/A+</a>

**Author:** Vitaly Tomilov  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td><code>Object</code></td><td><p>Library initialization options:</p>
<ul>
<li><code>pgFormatting</code> - redirects query formatting to PG;</li>
<li><code>promiseLib</code> - overrides default promise library;</li>
<li><code>connect</code> - database <code>connect</code> notification;</li>
<li><code>disconnect</code> - database <code>disconnect</code> notification;</li>
<li><code>query</code> - query execution notification;</li>
<li><code>receive</code> - received data notification;</li>
<li><code>task</code> - task event notification;</li>
<li><code>transact</code> - transaction event notification;</li>
<li><code>error</code> - error event notification;</li>
<li><code>extend</code> - protocol extension event;</li>
<li><code>noLocking</code> - prevents protocol locking;</li>
<li><code>capTX</code> - capitalizes transaction commands.</li>
</ul>
</td>
    </tr>  </tbody>
</table>


* [pg-promise](#module_pg-promise)
    * _static_
        * [.end()](#module_pg-promise.end)
    * _inner_
        * [~as](#module_pg-promise..as) : <code>formatting</code>
        * [~pg](#module_pg-promise..pg) : <code>[PG](https://github.com/brianc/node-postgres/blob/master/lib/index.js#L8)</code>
        * [~minify](#module_pg-promise..minify) : <code>[pg-minify](https://github.com/vitaly-t/pg-minify)</code>
        * [~queryResult](#module_pg-promise..queryResult) : <code>[queryResult](#queryResult)</code>
        * [~QueryResultError](#module_pg-promise..QueryResultError) : <code>errors.QueryResultError</code>
        * [~PromiseAdapter](#module_pg-promise..PromiseAdapter) : <code>PromiseAdapter</code>
        * [~QueryFile](#module_pg-promise..QueryFile) : <code>QueryFile</code>
        * [~txMode](#module_pg-promise..txMode) : <code>txMode</code>

<a name="module_pg-promise.end"></a>
### pg-promise.end()
Terminates pg library (call it when exiting the application).

**Kind**: static method of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise..as"></a>
### pg-promise~as : <code>formatting</code>
Namespace for the type conversion helpers.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..pg"></a>
### pg-promise~pg : <code>[PG](https://github.com/brianc/node-postgres/blob/master/lib/index.js#L8)</code>
Instance of the PG library that's used.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise..minify"></a>
### pg-promise~minify : <code>[pg-minify](https://github.com/vitaly-t/pg-minify)</code>
Instance of the pg-minify library that's used.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise..queryResult"></a>
### pg-promise~queryResult : <code>[queryResult](#queryResult)</code>
Query Result Mask.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..QueryResultError"></a>
### pg-promise~QueryResultError : <code>errors.QueryResultError</code>
QueryResultError type.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..PromiseAdapter"></a>
### pg-promise~PromiseAdapter : <code>PromiseAdapter</code>
PromiseAdapter type.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..QueryFile"></a>
### pg-promise~QueryFile : <code>QueryFile</code>
QueryFile type.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..txMode"></a>
### pg-promise~txMode : <code>txMode</code>
Transaction Mode namespace.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="Database"></a>
## Database
**Kind**: global class  

* [Database](#Database)
    * [new Database(cn)](#new_Database_new)
    * [.query(query, [values], [qrm])](#Database.query) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.none(query, [values])](#Database.none) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.one(query, [values])](#Database.one) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.many(query, [values])](#Database.many) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.oneOrNone(query, [values])](#Database.oneOrNone) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.manyOrNone(query, [values])](#Database.manyOrNone) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.any(query, [values])](#Database.any) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.result(query, [values])](#Database.result) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.stream(qs, init)](#Database.stream) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.proc(procName, [values])](#Database.proc) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.task(p1, [p2])](#Database.task) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.tx(p1, [p2])](#Database.tx) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>

<a name="new_Database_new"></a>
### new Database(cn)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cn</td><td><code>String</code> | <code>Object</code></td><td><p>Connection object or string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.query"></a>
### Database.query(query, [values], [qrm]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a generic query that expects return data according to parameter `qrm`  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - A promise object that represents the query result.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
<li>function object</li>
<li>stream object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td></td><td><p>formatting parameters for the query string</p>
</td>
    </tr><tr>
    <td>[qrm]</td><td><code><a href="#queryResult">queryResult</a></code></td><td><code>queryResult.any</code></td><td><p><a href="#queryResult">Query Result Mask</a></p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.none"></a>
### Database.none(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query that expects no data to be returned.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when no records are returned, it resolves with `undefined`- when any data is returned, it rejects with [QueryResultError](errors.QueryResultError)= `No return data was expected.`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.one"></a>
### Database.one(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query that expects exactly one row of data.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when 1 row is returned, it resolves with that row as a single object;- when no rows are returned, it rejects with [QueryResultError](errors.QueryResultError)= `No data returned from the query.`- when multiple rows are returned, it rejects with [QueryResultError](errors.QueryResultError)= `Multiple rows were not expected.`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.many"></a>
### Database.many(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query that expects one or more rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when 1 or more rows are returned, it resolves with the array of rows- when no rows are returned, it rejects with [QueryResultError](errors.QueryResultError)= `No data returned from the query.`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.oneOrNone"></a>
### Database.oneOrNone(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query that expects 0 or 1 rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when no rows are returned, it resolves with `null`- when 1 row is returned, it resolves with that row as a single object- when multiple rows are returned, it rejects with [QueryResultError](errors.QueryResultError)= `Multiple rows were not expected.`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.manyOrNone"></a>
### Database.manyOrNone(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query that expects any number of rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when no rows are returned, it resolves with an empty array- when 1 or more rows are returned, it resolves with the array of rows.  
**See**: [any](#Database.any)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.any"></a>
### Database.any(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
Alias for method [manyOrNone](#Database.manyOrNone)

**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query that expects any number of rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - The same as method [manyOrNone](#Database.manyOrNone)  
**See**: [manyOrNone](#Database.manyOrNone)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.result"></a>
### Database.result(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query without any expectation for the return data,to provide direct access to the <a href="https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6">Result</a> object.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- resolves with the original <a href="https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6">Result</a> object  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code> | <code>Object</code></td><td><ul>
<li>query string</li>
<li>prepared statement object</li>
</ul>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.stream"></a>
### Database.stream(qs, init) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Custom data streaming, with the help of <a href="https://github.com/brianc/node-pg-query-stream">pg-query-stream</a>.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the streaming operation.Once the streaming has finished successfully, the method resolves with`{processed, duration}`:- `processed` - total number of rows processed;- `duration` - streaming duration, in milliseconds.Possible rejections messages:- `Invalid or missing stream object.`- `Invalid stream state.`- `Invalid or missing stream initialization callback.`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>qs</td><td><code>QueryStream</code></td><td><p>stream object of type <a href="https://github.com/brianc/node-pg-query-stream/blob/master/index.js#L5">QueryStream</a>.</p>
</td>
    </tr><tr>
    <td>init</td><td><code>function</code></td><td><p>stream initialization callback, with
the same <code>this</code> context as the calling method.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.proc"></a>
### Database.proc(procName, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a query against a stored procedure via its name:`select * from procName(values)`  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - The same result as method [oneOrNone](#Database.oneOrNone).  
**See**

- [oneOrNone](#Database.oneOrNone)
- [Database.func](Database.func)

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>procName</td><td><code>String</code></td><td><p>name of the stored procedure to be executed.</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>parameters for the procedure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.task"></a>
### Database.task(p1, [p2]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a callback function (or generator) with an automatically managed connection.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result from the task callback function.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>p1</td><td><code>Object</code> | <code>function</code> | <code>generator</code></td><td><p>task tag object, if <code>p2</code> is <code>undefined</code>,
or else it is the callback function for the task.</p>
</td>
    </tr><tr>
    <td>[p2]</td><td><code>function</code> | <code>generator</code></td><td><p>task callback function, if it is not <code>undefined</code>,
or else <code>p2</code> is ignored.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Database.tx"></a>
### Database.tx(p1, [p2]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
Executes a task as a transaction. The transaction will execute `ROLLBACK`in the end, if the callback function returns a rejected promise or throwsan error; and it will execute `COMMIT` in all other cases.

**Kind**: static method of <code>[Database](#Database)</code>  
**Summary**: Executes a callback function (or generator) as a transaction.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result from the transaction callback function.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>p1</td><td><code>Object</code> | <code>function</code> | <code>generator</code></td><td><p>transaction tag object, if <code>p2</code>
is <code>undefined</code>, or else it is the callback function for the transaction.</p>
</td>
    </tr><tr>
    <td>[p2]</td><td><code>function</code> | <code>generator</code></td><td><p>transaction callback function, if it is not <code>undefined</code>,
or else <code>p2</code> is ignored.</p>
</td>
    </tr>  </tbody>
</table>

<a name="Task"></a>
## Task
**Kind**: global class  
**Summary**: Internal Task implementation.  

* [Task](#Task)
    * [.batch(values, [cb])](#Task.batch) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.page(source, [dest], [limit])](#Task.page) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
    * [.sequence(source, [dest], [limit], [track])](#Task.sequence) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>

<a name="Task.batch"></a>
### Task.batch(values, [cb]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
For complete method documentation see <a href="https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md">spex.batch</a>.

**Kind**: static method of <code>[Task](#Task)</code>  
**Summary**: Resolves a predefined array of mixed values by redirecting to method <a href="https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md">spex.batch</a>.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>values</td><td><code>Array</code></td>
    </tr><tr>
    <td>[cb]</td><td><code>function</code></td>
    </tr>  </tbody>
</table>

<a name="Task.page"></a>
### Task.page(source, [dest], [limit]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
For complete method documentation see <a href="https://github.com/vitaly-t/spex/blob/master/docs/code/page.md">spex.page</a>.

**Kind**: static method of <code>[Task](#Task)</code>  
**Summary**: Resolves a dynamic sequence of arrays/pages with mixed values, by redirecting to method <a href="https://github.com/vitaly-t/spex/blob/master/docs/code/page.md">spex.page</a>.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>source</td><td><code>function</code></td><td></td>
    </tr><tr>
    <td>[dest]</td><td><code>function</code></td><td></td>
    </tr><tr>
    <td>[limit]</td><td><code>Number</code></td><td><code>0</code></td>
    </tr>  </tbody>
</table>

<a name="Task.sequence"></a>
### Task.sequence(source, [dest], [limit], [track]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
For complete method documentation see <a href="https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md">spex.sequence</a>.

**Kind**: static method of <code>[Task](#Task)</code>  
**Summary**: Resolves a dynamic sequence of mixed values by redirecting to method <a href="https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md">spex.sequence</a>.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>source</td><td><code>function</code></td><td></td>
    </tr><tr>
    <td>[dest]</td><td><code>function</code></td><td></td>
    </tr><tr>
    <td>[limit]</td><td><code>Number</code></td><td><code>0</code></td>
    </tr><tr>
    <td>[track]</td><td><code>Boolean</code></td><td><code>false</code></td>
    </tr>  </tbody>
</table>

<a name="queryResult"></a>
## queryResult : <code>enum</code>
Binary mask that represents the result expected from queries.It is used in the generic [query](module:pg-promise.Database#query) method,as well as method [func](module:pg-promise.Database#func).The mask is always the last optional parameter, which defaults to `queryResult.any`.Any combination of flags is supported, except for `one + many`.The type is available from the library's root: `pgp.queryResult`.

**Kind**: global enum  
**Summary**: Query Result Mask.  
**Read only**: true  
**See**: [query](module:pg-promise.Database#query), [func](module:pg-promise.Database#func)  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>one</td><td><code>Number</code></td><td><code>1</code></td><td>Single row is expected.</td>
    </tr><tr>
    <td>many</td><td><code>Number</code></td><td><code>2</code></td><td>One or more rows expected.</td>
    </tr><tr>
    <td>none</td><td><code>Number</code></td><td><code>4</code></td><td>Expecting no rows.</td>
    </tr><tr>
    <td>any</td><td><code>Number</code></td><td><code>6</code></td><td>many|none - any result is expected.</td>
    </tr>  </tbody>
</table>

<a name="event_connect"></a>
## "connect" (client)
**Kind**: event emitted  
**Summary**: Global notification function of acquiring a new databaseconnection from the connection pool, i.e. a virtual connection.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>client</td><td><code>pg.Client</code></td><td><p><a href="https://github.com/brianc/node-postgres/wiki/Client">pg.Client</a> object that represents the database connection.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_disconnect"></a>
## "disconnect" (client)
**Kind**: event emitted  
**Summary**: Global notification function of releasing a database connectionback to the connection pool, i.e. releasing the virtual connection.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>client</td><td><code>pg.Client</code></td><td><p><a href="https://github.com/brianc/node-postgres/wiki/Client">pg.Client</a> object that represents the database connection.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_query"></a>
## "query" (e)
**Kind**: event emitted  
**Summary**: Global notification of a query that's about to execute.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>e</td><td><code>Object</code></td><td><p>event context object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_receive"></a>
## "receive" (data, result, e)
**Kind**: event emitted  
**Summary**: Global notification of any received data.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>data</td><td><code>Array</code></td><td><p>array of received data rows.</p>
</td>
    </tr><tr>
    <td>result</td><td><code>Object</code></td><td><p>original <a href="https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6">Result</a> object, if available.</p>
</td>
    </tr><tr>
    <td>e</td><td><code>Object</code></td><td><p>event context object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_task"></a>
## "task" (e)
**Kind**: event emitted  
**Summary**: Global notification of a task start / finish events.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>e</td><td><code>Object</code></td><td><p>event context object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_transact"></a>
## "transact" (e)
**Kind**: event emitted  
**Summary**: Global notification of a transaction start / finish events.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>e</td><td><code>Object</code></td><td><p>event context object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_error"></a>
## "error" (err, e)
**Kind**: event emitted  
**Summary**: Global notification of an error during connection, query, task or transaction.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>err</td><td><code>String</code> | <code>Error</code></td><td><p>error text or object.</p>
</td>
    </tr><tr>
    <td>e</td><td><code>Object</code></td><td><p>event context object.</p>
</td>
    </tr>  </tbody>
</table>

<a name="event_extend"></a>
## "extend" (obj)
**Kind**: event emitted  
**Summary**: Extends database protocol with custom methods and properties.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>obj</td><td><code>Object</code></td><td><p>protocol object to be extended.</p>
</td>
    </tr>  </tbody>
</table>

