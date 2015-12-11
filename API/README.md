## Modules

<dl>
<dt><a href="#module_pg-promise">pg-promise</a></dt>
<dd><p>Complete access layer to node-postgres via $[Promises/A+]</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#queryResult">queryResult</a> : <code>enum</code></dt>
<dd><p>Binary mask that represents the result expected from queries.
It is used in the generic <a href="#module_pg-promise.Database+query">query</a> method,
as well as method <a href="#module_pg-promise.Database+func">func</a>.</p>
<p>The mask is always the last optional parameter, which defaults to <code>queryResult.any</code>.</p>
<p>Any combination of flags is supported, except for <code>one + many</code>.</p>
</dd>
</dl>

<a name="module_pg-promise"></a>
## pg-promise
Complete access layer to node-postgres via $[Promises/A+]

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
        * [.Task](#module_pg-promise.Task)
            * [.batch(values, [cb])](#module_pg-promise.Task+batch) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.page(source, [dest], [limit])](#module_pg-promise.Task+page) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.sequence(source, [dest], [limit], [track])](#module_pg-promise.Task+sequence) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.Database](#module_pg-promise.Database) ⇒ <code>Database</code>
            * [.connect()](#module_pg-promise.Database+connect) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.query(query, [values], [qrm])](#module_pg-promise.Database+query) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.none(query, [values])](#module_pg-promise.Database+none) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.one(query, [values])](#module_pg-promise.Database+one) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.many(query, [values])](#module_pg-promise.Database+many) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.oneOrNone(query, [values])](#module_pg-promise.Database+oneOrNone) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.manyOrNone(query, [values])](#module_pg-promise.Database+manyOrNone) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.any(query, [values])](#module_pg-promise.Database+any) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.result(query, [values])](#module_pg-promise.Database+result) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.stream(qs, init)](#module_pg-promise.Database+stream) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.func(funcName, [values], [qrm])](#module_pg-promise.Database+func) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.proc(procName, [values])](#module_pg-promise.Database+proc) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.task(p1, [p2])](#module_pg-promise.Database+task) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
            * [.tx(p1, [p2])](#module_pg-promise.Database+tx) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.pg](#module_pg-promise.pg)
        * [.queryResult](#module_pg-promise.queryResult)
        * [.end()](#module_pg-promise.end)
        * ["connect" (client)](#module_pg-promise.event_connect)
        * ["disconnect" (client)](#module_pg-promise.event_disconnect)
        * ["query" (e)](#module_pg-promise.event_query)
        * ["task" (e)](#module_pg-promise.event_task)
        * ["transact" (e)](#module_pg-promise.event_transact)
        * ["error" (err, e)](#module_pg-promise.event_error)
        * ["extend" (obj)](#module_pg-promise.event_extend)
    * _inner_
        * [~as](#module_pg-promise..as) : <code>module:formatting.as</code>
        * [~QueryResultError](#module_pg-promise..QueryResultError) : <code>module:error</code>
        * [~PromiseAdapter](#module_pg-promise..PromiseAdapter) : <code>module:adapter</code>
        * [~txMode](#module_pg-promise..txMode) : <code>module:txMode</code>

<a name="module_pg-promise.Task"></a>
### pg-promise.Task
**Kind**: static class of <code>[pg-promise](#module_pg-promise)</code>  
**Summary**: Internal Task implementation.  

    * [.Task](#module_pg-promise.Task)
        * [.batch(values, [cb])](#module_pg-promise.Task+batch) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.page(source, [dest], [limit])](#module_pg-promise.Task+page) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.sequence(source, [dest], [limit], [track])](#module_pg-promise.Task+sequence) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>

<a name="module_pg-promise.Task+batch"></a>
#### task.batch(values, [cb]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
For complete method documentation see $[spex.batch].

**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Resolves a predefined array of mixed values by redirecting to method $[spex.batch].  
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

<a name="module_pg-promise.Task+page"></a>
#### task.page(source, [dest], [limit]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
For complete method documentation see $[spex.page].

**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Resolves a dynamic sequence of arrays/pages with mixed values, by redirecting to method $[spex.page].  
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

<a name="module_pg-promise.Task+sequence"></a>
#### task.sequence(source, [dest], [limit], [track]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
For complete method documentation see $[spex.sequence].

**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Resolves a dynamic sequence of mixed values by redirecting to method $[spex.sequence].  
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

<a name="module_pg-promise.Database"></a>
### pg-promise.Database ⇒ <code>Database</code>
**Kind**: static class of <code>[pg-promise](#module_pg-promise)</code>  
**Returns**: <code>Database</code> - New database instance.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cn</td><td><code>String</code> | <code>Object</code></td><td><p>Connection object or string.</p>
</td>
    </tr>  </tbody>
</table>


    * [.Database](#module_pg-promise.Database) ⇒ <code>Database</code>
        * [.connect()](#module_pg-promise.Database+connect) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.query(query, [values], [qrm])](#module_pg-promise.Database+query) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.none(query, [values])](#module_pg-promise.Database+none) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.one(query, [values])](#module_pg-promise.Database+one) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.many(query, [values])](#module_pg-promise.Database+many) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.oneOrNone(query, [values])](#module_pg-promise.Database+oneOrNone) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.manyOrNone(query, [values])](#module_pg-promise.Database+manyOrNone) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.any(query, [values])](#module_pg-promise.Database+any) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.result(query, [values])](#module_pg-promise.Database+result) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.stream(qs, init)](#module_pg-promise.Database+stream) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.func(funcName, [values], [qrm])](#module_pg-promise.Database+func) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.proc(procName, [values])](#module_pg-promise.Database+proc) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.task(p1, [p2])](#module_pg-promise.Database+task) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
        * [.tx(p1, [p2])](#module_pg-promise.Database+tx) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>

<a name="module_pg-promise.Database+connect"></a>
#### database.connect() ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
This method initiates a shared connection for executing a chain of querieson the same connection. The connection must be released in the end of thechain by calling method `done()` of the connection object.This is a legacy, low-level approach to chaining queries on the same connection.A newer and simpler approach is via method [task](#module_pg-promise.Database+task),which allocates and releases the shared connection automatically.

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Retrieves a new or existing connection from the pool, based on thecurrent connection parameters.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Connection result:<ul><li>resolves with the connection object, if successful. The object has method `done()` that must  be called in the end of the query chain, in order to release the connection back to the pool.</li><li>rejects with the connection error when fails.</li></ul>  
**See**: [task](#module_pg-promise.Database+task)  
<a name="module_pg-promise.Database+query"></a>
#### database.query(query, [values], [qrm]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
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

<a name="module_pg-promise.Database+none"></a>
#### database.none(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects no data to be returned.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call- when no records are returned, the returned promise will resolve with `undefined`- when the query returns any data, it will reject with [QueryResultError](#module_pg-promise..QueryResultError),containing `No return data was expected.`  
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

<a name="module_pg-promise.Database+one"></a>
#### database.one(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects exactly one row of data.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when 1 row is returned, it will resolve with that row as a single object;- when no rows are returned, it will reject with `No data returned from the query.`- when more than 1 rows are returned, it will reject with  `Multiple rows were not expected.`  
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

<a name="module_pg-promise.Database+many"></a>
#### database.many(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects one or more rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when 1 or more rows are returned, it will resolve with the array of rows.- when no rows are returned, it will reject with `No data returned from the query.`  
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

<a name="module_pg-promise.Database+oneOrNone"></a>
#### database.oneOrNone(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects 0 or 1 rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when no rows are returned, it will resolve with `null`;- when 1 row is returned, it will resolve with that row as a single object;- when more than 1 rows are returned, it will reject with  `Multiple rows were not expected.`  
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

<a name="module_pg-promise.Database+manyOrNone"></a>
#### database.manyOrNone(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects any number of rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- when no rows are returned, it will resolve with an empty array;- when 1 or more rows are returned, it will resolve with the array of rows.  
**See**: [Database.any](#module_pg-promise.Database+any)  
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

<a name="module_pg-promise.Database+any"></a>
#### database.any(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
Alias for method [manyOrNone](#module_pg-promise.Database+manyOrNone)

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects any number of rows.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - The same as method [manyOrNone](#module_pg-promise.Database+manyOrNone)  
**See**: [manyOrNone](#module_pg-promise.Database+manyOrNone)  
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

<a name="module_pg-promise.Database+result"></a>
#### database.result(query, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query without any expectation for the return data, to provide direct accessto the $[Result] object.  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call:- resolves with the original $[Result] object:  
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

<a name="module_pg-promise.Database+stream"></a>
#### database.stream(qs, init) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Custom data streaming, with help of $[pg-query-stream].  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the streaming operation.Once the streaming has finished successfully, the method resolves with`{processed, duration}`:- `processed` - total number of rows that have been processed;- `duration` - streaming duration, in milliseconds.Possible rejections messages:- `Invalid or missing stream object.`- `Invalid stream state.`- `Invalid or missing stream initialization callback.`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>qs</td><td><code>QueryStream</code></td><td><p>stream object of type $[QueryStream].</p>
</td>
    </tr><tr>
    <td>init</td><td><code>function</code></td><td><p>stream initialization callback, with
the same <code>this</code> context as the calling method.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+func"></a>
#### database.func(funcName, [values], [qrm]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query against a database function by its name:`select * from funcName(values)`  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - Result of the query call, according to `qrm`.  
**See**: [query](#module_pg-promise.Database+query)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>funcName</td><td><code>String</code></td><td></td><td><p>name of the function to be executed.</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td></td><td><p>parameters for the function.</p>
</td>
    </tr><tr>
    <td>[qrm]</td><td><code><a href="#queryResult">queryResult</a></code></td><td><code>queryResult.any</code></td><td><p><a href="#queryResult">Query Result Mask</a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+proc"></a>
#### database.proc(procName, [values]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query against a stored procedure via its name:`select * from procName(values)`  
**Returns**: <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code> - The same result as method [oneOrNone](#module_pg-promise.Database+oneOrNone).  
**See**

- [oneOrNone](#module_pg-promise.Database+oneOrNone)
- [func](#module_pg-promise.Database+func)

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

<a name="module_pg-promise.Database+task"></a>
#### database.task(p1, [p2]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes the callback function with an automatically managed connection.  
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
    <td>[p2]</td><td><code>function</code></td><td><p>task callback function, if it is not <code>undefined</code>,
or else <code>p2</code> isn&#39;t used.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+tx"></a>
#### database.tx(p1, [p2]) ⇒ <code>[Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)</code>
The method implements the following steps:- acquires a connection from the pool, if needed;- executes `BEGIN`;- executes the callback function;- if the callback function has resolved:  - executes `COMMIT`;  - releases the connection, if it was acquired;  - resolves with the result from the callback function;- if the callback function has rejected:  - executes `ROLLBACK`;  - releases the connection, if it was acquired;  - rejects with the result from the callback function.

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes the callback function as a transaction.  
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
    <td>[p2]</td><td><code>function</code></td><td><p>transaction callback function, if it is not <code>undefined</code>,
or else <code>p2</code> isn&#39;t used.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.pg"></a>
### pg-promise.pg
Instance of the PG library used.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.queryResult"></a>
### pg-promise.queryResult
Query Result Mask.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise.end"></a>
### pg-promise.end()
Terminates pg library (call it when exiting the application).

**Kind**: static method of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_connect"></a>
### "connect" (client)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
**Summary**: Global notification function of acquiring a new databaseconnection from the connection pool, i.e. a virtual connection.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>client</td><td><code>pg.Client</code></td><td><p>$[pg.Client] object that represents the database connection.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.event_disconnect"></a>
### "disconnect" (client)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
**Summary**: Global notification function of releasing a database connectionback to the connection pool, i.e. releasing the virtual connection.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>client</td><td><code>pg.Client</code></td><td><p>$[pg.Client] object that represents the database connection.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.event_query"></a>
### "query" (e)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
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

<a name="module_pg-promise.event_task"></a>
### "task" (e)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
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

<a name="module_pg-promise.event_transact"></a>
### "transact" (e)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
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

<a name="module_pg-promise.event_error"></a>
### "error" (err, e)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
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

<a name="module_pg-promise.event_extend"></a>
### "extend" (obj)
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
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

<a name="module_pg-promise..as"></a>
### pg-promise~as : <code>module:formatting.as</code>
Namespace for the type conversion helpers.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..QueryResultError"></a>
### pg-promise~QueryResultError : <code>module:error</code>
Query Result Error type.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..PromiseAdapter"></a>
### pg-promise~PromiseAdapter : <code>module:adapter</code>
Promise Adapter.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise..txMode"></a>
### pg-promise~txMode : <code>module:txMode</code>
Instance of the Transaction Mode library.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="queryResult"></a>
## queryResult : <code>enum</code>
Binary mask that represents the result expected from queries.It is used in the generic [query](#module_pg-promise.Database+query) method,as well as method [func](#module_pg-promise.Database+func).The mask is always the last optional parameter, which defaults to `queryResult.any`.Any combination of flags is supported, except for `one + many`.

**Kind**: global enum  
**Summary**: Query Result Mask.  
**Read only**: true  
**See**: [query](#module_pg-promise.Database+query), [func](#module_pg-promise.Database+func)  
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

