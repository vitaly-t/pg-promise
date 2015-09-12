## Modules
<dl>
<dt><a href="#module_formatting">formatting</a></dt>
<dd><p>Query Formatting</p>
</dd>
<dt><a href="#module_pg-promise">pg-promise</a></dt>
<dd><p>Complete access layer to node-postgres via Promises/A+</p>
</dd>
</dl>
## Members
<dl>
<dt><a href="#queryResult">queryResult</a> : <code>enum</code></dt>
<dd><p>Binary mask that represents the result expected from queries.
It is used in the generic <a href="#module_pg-promise.Database+query">query</a> method,
as well as method <a href="#module_pg-promise.Database+func">func</a>.</p>
<p>The mask is always the last optional parameter, which default so <code>queryResult.any</code>.</p>
<p>Any combination of flags is supported, except for <code>one + many</code>.</p>
</dd>
</dl>
<a name="module_formatting"></a>
## formatting
Query Formatting

**Author:** Vitaly Tomilov  

* [formatting](#module_formatting)
  * [.as](#module_formatting.as) : <code>object</code>
    * [.text(text, raw)](#module_formatting.as.text) ⇒ <code>\*</code>
    * [.bool(value)](#module_formatting.as.bool) ⇒ <code>\*</code>
    * [.date(d, raw)](#module_formatting.as.date) ⇒ <code>\*</code>
    * [.number(num)](#module_formatting.as.number) ⇒ <code>\*</code>
    * [.number(arr)](#module_formatting.as.number) ⇒ <code>\*</code>
    * [.csv(values)](#module_formatting.as.csv) ⇒ <code>\*</code>
    * [.json(obj, raw)](#module_formatting.as.json) ⇒ <code>\*</code>
    * [.func(func, raw, obj)](#module_formatting.as.func) ⇒ <code>\*</code>
    * [.format(query, values)](#module_formatting.as.format) ⇒ <code>\*</code>

<a name="module_formatting.as"></a>
### formatting.as : <code>object</code>
**Kind**: static namespace of <code>[formatting](#module_formatting)</code>  

* [.as](#module_formatting.as) : <code>object</code>
  * [.text(text, raw)](#module_formatting.as.text) ⇒ <code>\*</code>
  * [.bool(value)](#module_formatting.as.bool) ⇒ <code>\*</code>
  * [.date(d, raw)](#module_formatting.as.date) ⇒ <code>\*</code>
  * [.number(num)](#module_formatting.as.number) ⇒ <code>\*</code>
  * [.number(arr)](#module_formatting.as.number) ⇒ <code>\*</code>
  * [.csv(values)](#module_formatting.as.csv) ⇒ <code>\*</code>
  * [.json(obj, raw)](#module_formatting.as.json) ⇒ <code>\*</code>
  * [.func(func, raw, obj)](#module_formatting.as.func) ⇒ <code>\*</code>
  * [.format(query, values)](#module_formatting.as.format) ⇒ <code>\*</code>

<a name="module_formatting.as.text"></a>
#### as.text(text, raw) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td>
    </tr><tr>
    <td>raw</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.bool"></a>
#### as.bool(value) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>value</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.date"></a>
#### as.date(d, raw) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>d</td>
    </tr><tr>
    <td>raw</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.number"></a>
#### as.number(num) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>num</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.number"></a>
#### as.number(arr) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>arr</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.csv"></a>
#### as.csv(values) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>values</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.json"></a>
#### as.json(obj, raw) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>obj</td>
    </tr><tr>
    <td>raw</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.func"></a>
#### as.func(func, raw, obj) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>func</td>
    </tr><tr>
    <td>raw</td>
    </tr><tr>
    <td>obj</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.format"></a>
#### as.format(query, values) ⇒ <code>\*</code>
**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td>
    </tr><tr>
    <td>values</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise"></a>
## pg-promise
Complete access layer to node-postgres via Promises/A+

**Author:** Vitaly Tomilov  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[options]</td><td><code>object</code></td><td><p>Library initialization options:</p>
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
</ul>
</td>
    </tr>  </tbody>
</table>


* [pg-promise](#module_pg-promise)
  * _static_
    * [.Task](#module_pg-promise.Task)
      * [.batch(values)](#module_pg-promise.Task+batch) ⇒ <code>promise</code>
      * [.sequence(factory, [noTracking], [cb])](#module_pg-promise.Task+sequence) ⇒ <code>promise</code>
    * [.Database](#module_pg-promise.Database)
      * [new Database(cn)](#new_module_pg-promise.Database_new)
      * [.connect()](#module_pg-promise.Database+connect) ⇒ <code>promise</code>
      * [.query(query, [values], [qrm])](#module_pg-promise.Database+query) ⇒ <code>promise</code>
      * [.none(query, [values])](#module_pg-promise.Database+none) ⇒ <code>promise</code>
      * [.one(query, [values])](#module_pg-promise.Database+one) ⇒ <code>promise</code>
      * [.many(query, [values])](#module_pg-promise.Database+many) ⇒ <code>promise</code>
      * [.oneOrNone(query, [values])](#module_pg-promise.Database+oneOrNone) ⇒ <code>promise</code>
      * [.manyOrNone(query, [values])](#module_pg-promise.Database+manyOrNone) ⇒ <code>promise</code>
      * [.any(query, [values])](#module_pg-promise.Database+any) ⇒ <code>promise</code>
      * [.result(query, [values])](#module_pg-promise.Database+result) ⇒ <code>promise</code>
      * [.stream(qs, init)](#module_pg-promise.Database+stream) ⇒ <code>promise</code>
      * [.func(funcName, [values], [qrm])](#module_pg-promise.Database+func) ⇒ <code>promise</code>
      * [.proc(procName, [values])](#module_pg-promise.Database+proc) ⇒ <code>promise</code>
      * [.task(p1, [p2])](#module_pg-promise.Database+task) ⇒ <code>promise</code>
      * [.tx(p1, [p2])](#module_pg-promise.Database+tx) ⇒ <code>promise</code>
    * [.version](#module_pg-promise.version)
    * [.pg](#module_pg-promise.pg)
    * [.end()](#module_pg-promise.end)
    * ["connect"](#module_pg-promise.event_connect)
    * ["disconnect"](#module_pg-promise.event_disconnect)
    * ["query"](#module_pg-promise.event_query)
    * ["task"](#module_pg-promise.event_task)
    * ["transact"](#module_pg-promise.event_transact)
    * ["error"](#module_pg-promise.event_error)
    * ["extend"](#module_pg-promise.event_extend)
  * _inner_
    * [~as](#module_pg-promise..as) : <code>[as](#module_formatting.as)</code>

<a name="module_pg-promise.Task"></a>
### pg-promise.Task
**Kind**: static class of <code>[pg-promise](#module_pg-promise)</code>  
**Summary**: Internal Task implementation.  

  * [.Task](#module_pg-promise.Task)
    * [.batch(values)](#module_pg-promise.Task+batch) ⇒ <code>promise</code>
    * [.sequence(factory, [noTracking], [cb])](#module_pg-promise.Task+sequence) ⇒ <code>promise</code>

<a name="module_pg-promise.Task+batch"></a>
#### task.batch(values) ⇒ <code>promise</code>
This method is a fusion of `promise.all` + `promise.settle` logic,highly optimized for use within tasks and transactions, to resolve with thesame type of result as `promise.all`, while also settling all the promises,and providing a detailed summary in case any of the promises rejects.

**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Attempts to resolve every value in the input array.  
**Returns**: <code>promise</code> - Result for the entire batch, which resolves whenevery promise in the input array has been resolved, and rejects when oneor more promise objects in the array rejected:- resolves with an array of individual resolved results, the same as `promise.all`;- rejects with an array of objects `{success, result}`:  - `success`: `true/false`, indicates whether the corresponding value    in the input array was resolved.  - `result`: resolved data, if `success=true`, or else the rejection reason.  The array comes extended with function `getErrors`, which returns the list  of just errors, with support for nested batch results.  Calling `getErrors()[0]`, for example, will get the same result as the  rejection reason that `promise.all` would provide.In both cases the output array is always the same size as the input one,this way providing index mapping between input and output values.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>values</td><td><code>Array</code></td><td><p>array of values of the following types:</p>
<ul>
<li>a simple value or object, to resolve with by default;</li>
<li>a promise object to be either resolved or rejected;</li>
<li>a function, to be called with the task/transaction context,
so it can return a value, an object or a promise.
If it returns another function, the call will be repeated,
until the returned type is a value, an object or a promise.</li>
</ul>
<p>If the parameter is anything other than an array, an error will
be thrown: <code>Array of values is required to execute a batch.</code></p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Task+sequence"></a>
#### task.sequence(factory, [noTracking], [cb]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Sequentially resolves dynamic promises returned by a promise factory.  
**Returns**: <code>promise</code> - Result of the sequence, depending on `noTracking`:- resolves with an array of resolved data, if `noTracking = false`;- resolves with an integer - total number of resolved requests, if `noTracking = true`;- rejects with the reason when the factory function throws an error or returns a rejected promise.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>factory</td><td><code>function</code></td><td></td><td><p>a callback function <code>(idx, t)</code> to create and return a new query
request, based on the request index passed. When the value is anything other than
a function, an error is thrown: <code>Invalid factory function specified.</code></p>
</td>
    </tr><tr>
    <td>[noTracking]</td><td><code>boolean</code></td><td><code>false</code></td><td><p>when <code>true</code>, it prevents tracking resolved results from
individual query requests, to avoid memory overuse during super-massive transactions.</p>
</td>
    </tr><tr>
    <td>[cb]</td><td><code>function</code></td><td></td><td><p>notification callback with <code>(idx, data)</code>, for every request resolved.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database"></a>
### pg-promise.Database
**Kind**: static class of <code>[pg-promise](#module_pg-promise)</code>  

  * [.Database](#module_pg-promise.Database)
    * [new Database(cn)](#new_module_pg-promise.Database_new)
    * [.connect()](#module_pg-promise.Database+connect) ⇒ <code>promise</code>
    * [.query(query, [values], [qrm])](#module_pg-promise.Database+query) ⇒ <code>promise</code>
    * [.none(query, [values])](#module_pg-promise.Database+none) ⇒ <code>promise</code>
    * [.one(query, [values])](#module_pg-promise.Database+one) ⇒ <code>promise</code>
    * [.many(query, [values])](#module_pg-promise.Database+many) ⇒ <code>promise</code>
    * [.oneOrNone(query, [values])](#module_pg-promise.Database+oneOrNone) ⇒ <code>promise</code>
    * [.manyOrNone(query, [values])](#module_pg-promise.Database+manyOrNone) ⇒ <code>promise</code>
    * [.any(query, [values])](#module_pg-promise.Database+any) ⇒ <code>promise</code>
    * [.result(query, [values])](#module_pg-promise.Database+result) ⇒ <code>promise</code>
    * [.stream(qs, init)](#module_pg-promise.Database+stream) ⇒ <code>promise</code>
    * [.func(funcName, [values], [qrm])](#module_pg-promise.Database+func) ⇒ <code>promise</code>
    * [.proc(procName, [values])](#module_pg-promise.Database+proc) ⇒ <code>promise</code>
    * [.task(p1, [p2])](#module_pg-promise.Database+task) ⇒ <code>promise</code>
    * [.tx(p1, [p2])](#module_pg-promise.Database+tx) ⇒ <code>promise</code>

<a name="new_module_pg-promise.Database_new"></a>
#### new Database(cn)
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>cn</td><td><code>string</code> | <code>object</code></td><td><p>Connection object or string.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+connect"></a>
#### database.connect() ⇒ <code>promise</code>
This method initiates a shared connection for executing a chain of querieson the same connection. The connection must be released in the end of thechain by calling method `done()` of the connection object.This is a legacy, low-level approach to chaining queries on the same connection.A newer and simpler approach is via method [task](#module_pg-promise.Database+task),which allocates and releases the shared connection automatically.

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Retrieves a new or existing connection from the pool, based on thecurrent connection parameters.  
**Returns**: <code>promise</code> - Connection result:- resolves with the connection object, if successful. The object has method `done()` that mustbe called in the end of the query chain, in order to release the connection back to the pool.- rejects with the connection error when fails.  
**See**: [task](#module_pg-promise.Database+task)  
<a name="module_pg-promise.Database+query"></a>
#### database.query(query, [values], [qrm]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a generic query that expects return data according to parameter &#x60;qrm&#x60;  
**Returns**: <code>promise</code> - A promise object that represents the query result.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td></td><td><p>formatting parameters for the query string</p>
</td>
    </tr><tr>
    <td>[qrm]</td><td><code><a href="#queryResult">queryResult</a></code></td><td><code>queryResult.any</code></td><td><p><a href="#queryResult">Query Result Mask</a></p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+none"></a>
#### database.none(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects no data to be returned.  
**Returns**: <code>promise</code> - Result of the query call:- when no records are returned, the returned promise will resolve with `undefined`;- when the query returns any data, it will reject with `"No return data was expected from the query"`.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+one"></a>
#### database.one(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects exactly one row of data.  
**Returns**: <code>promise</code> - Result of the query call:- when 1 row is returned, it will resolve with that row as a single object;- when no rows are returned, it will reject with `"No data returned from the query."`;- when more than 1 rows are returned, it will reject with  `"Single row was expected from the query, but multiple returned."`.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+many"></a>
#### database.many(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects one or more rows.  
**Returns**: <code>promise</code> - Result of the query call:- when 1 or more rows are returned, it will resolve with the array of rows.- when no rows are returned, it will reject with `"No data returned from the query."`;  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+oneOrNone"></a>
#### database.oneOrNone(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects 0 or 1 rows.  
**Returns**: <code>promise</code> - Result of the query call:- when no rows are returned, it will resolve with `null`;- when 1 row is returned, it will resolve with that row as a single object;- when more than 1 rows are returned, it will reject with  `"Single row was expected from the query, but multiple returned."`.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+manyOrNone"></a>
#### database.manyOrNone(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects any number of rows.  
**Returns**: <code>promise</code> - Result of the query call:- when no rows are returned, it will resolve with an empty array;- when 1 or more rows are returned, it will resolve with the array of rows.  
**See**: [Database.any](#module_pg-promise.Database+any)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+any"></a>
#### database.any(query, [values]) ⇒ <code>promise</code>
Alias for method [manyOrNone](#module_pg-promise.Database+manyOrNone)

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Returns**: <code>promise</code> - The same as method [manyOrNone](#module_pg-promise.Database+manyOrNone)  
**See**: [manyOrNone](#module_pg-promise.Database+manyOrNone)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+result"></a>
#### database.result(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query without any expectation for the return data,to provide direct access to the [Result](https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6) object.  
**Returns**: <code>promise</code> - Result of the query call:- resolves with the original [Result](https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6) object:  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>string</code> | <code>object</code></td><td><p>query string or prepared statement object</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>formatting parameters for the query string</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+stream"></a>
#### database.stream(qs, init) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Custom data streaming, with help of [pg-query-stream](https://github.com/brianc/node-pg-query-stream)  
**Returns**: <code>promise</code> - Result of the streaming operation.Once the streaming has finished successfully, the method resolves with`{processed, duration}`:- `processed` - total number of rows that have been processed;- `duration` - streaming duration, in milliseconds.Possible rejections messages:- `Invalid or missing stream object`- `Invalid stream state`- `Invalid or missing stream initialization callback`- `Stream not initialized`  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>qs</td><td><code>QueryStream</code></td><td><p>stream object of type <a href="https://github.com/brianc/node-pg-query-stream/blob/master/index.js#L5">QueryStream</a></p>
</td>
    </tr><tr>
    <td>init</td><td><code>function</code></td><td><p>stream initialization callback</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+func"></a>
#### database.func(funcName, [values], [qrm]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query against a database function by its name:&#x60;select * from funcName(values)&#x60;  
**Returns**: <code>promise</code> - Result of the query call, according to `qrm`.  
**See**: [query](#module_pg-promise.Database+query)  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>funcName</td><td><code>string</code></td><td></td><td><p>name of the function to be executed.</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td></td><td><p>parameters for the function.</p>
</td>
    </tr><tr>
    <td>[qrm]</td><td><code><a href="#queryResult">queryResult</a></code></td><td><code>queryResult.any</code></td><td><p><a href="#queryResult">Query Result Mask</a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+proc"></a>
#### database.proc(procName, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query against a stored procedure via its name:&#x60;select * from procName(values)&#x60;  
**Returns**: <code>promise</code> - The same result as method [oneOrNone](#module_pg-promise.Database+oneOrNone).  
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
    <td>procName</td><td><code>string</code></td><td><p>name of the stored procedure to be executed.</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>array</code> | <code>value</code></td><td><p>parameters for the procedure.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+task"></a>
#### database.task(p1, [p2]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes the callback function with an automatically managed connection.  
**Returns**: <code>promise</code> - Result from the task callback function.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>p1</td><td><code>object</code> | <code>function</code></td><td><p>task tag object, if <code>p2</code> is <code>undefined</code>,
or else it is the callback function for the task.</p>
</td>
    </tr><tr>
    <td>[p2]</td><td><code>function</code></td><td><p>task callback function, if it is not <code>undefined</code>,
or else <code>p2</code> isn&#39;t used.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.Database+tx"></a>
#### database.tx(p1, [p2]) ⇒ <code>promise</code>
The method implements the following steps:- acquires a connection from the pool, if needed;- executes `BEGIN`;- executes the callback function;- if the callback function has resolved:  - executes `COMMIT`;  - releases the connection, if it was acquired;  - resolves with the result from the callback function;- if the callback function has rejected:  - executes `ROLLBACK`;  - releases the connection, if it was acquired;  - rejects with the result from the callback function.

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes the callback function as a transaction.  
**Returns**: <code>promise</code> - Result from the transaction callback function.  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>p1</td><td><code>object</code> | <code>function</code></td><td><p>transaction tag object, if <code>p2</code> is <code>undefined</code>,
or else it is the callback function for the transaction.</p>
</td>
    </tr><tr>
    <td>[p2]</td><td><code>function</code></td><td><p>transaction callback function, if it is not <code>undefined</code>,
or else <code>p2</code> isn&#39;t used.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_pg-promise.version"></a>
### pg-promise.version
Library version.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="module_pg-promise.pg"></a>
### pg-promise.pg
Instance of the PG library used.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.end"></a>
### pg-promise.end()
Terminates pg library (call it when exiting the application).

**Kind**: static method of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_connect"></a>
### "connect"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_disconnect"></a>
### "disconnect"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_query"></a>
### "query"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_task"></a>
### "task"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_transact"></a>
### "transact"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_error"></a>
### "error"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.event_extend"></a>
### "extend"
**Kind**: event emitted by <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise..as"></a>
### pg-promise~as : <code>[as](#module_formatting.as)</code>
Namespace for the type conversion helpers.

**Kind**: inner property of <code>[pg-promise](#module_pg-promise)</code>  
**Read only**: true  
<a name="queryResult"></a>
## queryResult : <code>enum</code>
Binary mask that represents the result expected from queries.It is used in the generic [query](#module_pg-promise.Database+query) method,as well as method [func](#module_pg-promise.Database+func).The mask is always the last optional parameter, which default so `queryResult.any`.Any combination of flags is supported, except for `one + many`.

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
    <td>one</td><td><code>number</code></td><td><code>1</code></td><td>Single row is expected.</td>
    </tr><tr>
    <td>many</td><td><code>number</code></td><td><code>2</code></td><td>One or more rows expected.</td>
    </tr><tr>
    <td>none</td><td><code>number</code></td><td><code>4</code></td><td>Expecting no rows.</td>
    </tr><tr>
    <td>any</td><td><code>number</code></td><td><code>6</code></td><td>many|none - any result is expected.</td>
    </tr>  </tbody>
</table>

