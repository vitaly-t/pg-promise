## Modules
<dl>
<dt><a href="#module_pg-promise">pg-promise</a></dt>
<dd><p>Complete access layer to node-postgres via Promises/A+</p>
</dd>
</dl>
## Members
<dl>
<dt><a href="#queryResult">queryResult</a> : <code>enum</code></dt>
<dd><p>Binary mask that represents the result expected from queries.
The mask is to be passed into the generic query method as the last parameter.
When no value is passed into method query, <code>queryResult.any</code> is used.</p>
<p>Any combination of flags is supported, except for <code>one|many</code>.</p>
</dd>
</dl>
## Events
<dl>
<dt><a href="#event_connect">"connect"</a></dt>
<dd></dd>
<dt><a href="#event_disconnect">"disconnect"</a></dt>
<dd></dd>
<dt><a href="#event_query">"query"</a></dt>
<dd></dd>
<dt><a href="#event_task">"task"</a></dt>
<dd></dd>
<dt><a href="#event_transact">"transact"</a></dt>
<dd></dd>
<dt><a href="#event_error">"error"</a></dt>
<dd></dd>
<dt><a href="#event_extend">"extend"</a></dt>
<dd></dd>
</dl>
<a name="module_pg-promise"></a>
## pg-promise
Complete access layer to node-postgres via Promises/A+

**Author:** Vitaly Tomilov  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | Library initialization options: - `pgFormatting` - redirects query formatting to PG; - `promiseLib` - overrides default promise library; - `connect` - database 'connect' notification; - `disconnect` - database 'disconnect' notification; - `query` - query execution notification; - `task` - task event notification; - `transact` - transaction event notification; - `error` - error event notification; - `extend` - protocol extension event; |


* [pg-promise](#module_pg-promise)
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
  * [.as](#module_pg-promise.as)
  * [.pg](#module_pg-promise.pg)
  * [.end()](#module_pg-promise.end)

<a name="module_pg-promise.Task"></a>
### pg-promise.Task
**Kind**: static class of <code>[pg-promise](#module_pg-promise)</code>  
**Summary**: Internal Task implementation.  

* [.Task](#module_pg-promise.Task)
  * [.batch(values)](#module_pg-promise.Task+batch) ⇒ <code>promise</code>
  * [.sequence(factory, [noTracking], [cb])](#module_pg-promise.Task+sequence) ⇒ <code>promise</code>

<a name="module_pg-promise.Task+batch"></a>
#### task.batch(values) ⇒ <code>promise</code>
This method is a fusion of such logic as `promise.all` and `promise.settle`,
highly optimized for use within tasks and transactions, to resolve with the
same type of result as `promise.all`, while also settling all the promises,
and providing a detailed summary in case any of the promises rejects.

**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Attempts to resolve every value in the input array.  
**Returns**: <code>promise</code> - Result for the entire batch, which resolves when
every promise in the input array has been resolved, and rejects when one
or more promise objects in the array rejected:
- resolves with an array of individual resolved results;
- rejects with an array of objects `{success, result}`:
  - `success`: `true/false`, indicates whether the corresponding value
    in the input array was resolved.
  - `result`: resolved data, if `success=true`, or else the rejection reason.

In both cases the output array is always the same size as the input one,
this way providing index mapping between input and output values.  

| Param | Type | Description |
| --- | --- | --- |
| values | <code>array</code> | array of values of the following types: - a simple value or object, to resolve with by default; - a promise object to be either resolved or rejected; - a function, to be called with the task/transaction context,   so it can return a value, an object or a promise.   If it returns another function, the call will be repeated,   until the returned type is a value, an object or a promise. If the parameter is anything other than an array, an error will be thrown: `Array of values is required to execute a batch.` |

<a name="module_pg-promise.Task+sequence"></a>
#### task.sequence(factory, [noTracking], [cb]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Task](#module_pg-promise.Task)</code>  
**Summary**: Sequentially resolves dynamic promises returned by a promise factory.  
**Returns**: <code>promise</code> - Result of the sequence, depending on `noTracking`:
- resolves with an array of resolved data, if `noTracking` = false;
- resolves with an integer - total number of resolved requests, if `noTracking` = true;
- rejects with the reason when the factory function throws an error or returns a rejected promise.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| factory | <code>function</code> |  | a callback function `(idx, t)` to create and return a new query request, based on the request index passed. When the value is anything other than a function, an error is thrown: `Invalid factory function specified.` |
| [noTracking] | <code>boolean</code> | <code>false</code> | when `true`, it prevents tracking resolved results from individual query requests, to avoid memory overuse during super-massive transactions. |
| [cb] | <code>function</code> |  | notification callback with `(idx, data)`, for every request resolved. |

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

| Param | Type | Description |
| --- | --- | --- |
| cn | <code>string</code> &#124; <code>object</code> | Connection object or string. |

<a name="module_pg-promise.Database+connect"></a>
#### database.connect() ⇒ <code>promise</code>
This method initiates a shared connection for executing a chain of queries
on the same connection. The connection must be released in the end of the
chain by calling method `done()` of the connection object.
This is a legacy, low-level approach to chaining queries on the same connection.
A newer and simpler approach is via method [task](#module_pg-promise.Database+task),
which allocates and releases the shared connection automatically.

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Retrieves a new or existing connection from the pool, based on the
current connection parameters.  
**Returns**: <code>promise</code> - Connection result:
- resolves with connection object, if successful. The object has method `done()` that must
be called in the end of the query chain, in order to release the connection back to the pool.
- rejects with the connection error when fails.  
**See**: [task](#module_pg-promise.Database+task)  
<a name="module_pg-promise.Database+query"></a>
#### database.query(query, [values], [qrm]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a generic query that expects return data according to parameter &#x60;qrm&#x60;  
**Returns**: <code>promise</code> - A promise object that represents the query result.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> |  | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> |  | formatting parameters for the query string |
| [qrm] | <code>[queryResult](#queryResult)</code> | <code>queryResult.any</code> | Query Result Mask |

<a name="module_pg-promise.Database+none"></a>
#### database.none(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects no data to be returned.  
**Returns**: <code>promise</code> - Result of the query call:
- when no records are returned, the returned promise will resolve with `undefined`;
- when the query returns any data, it will reject with `"No return data was expected from the query"`.  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+one"></a>
#### database.one(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects exactly one row of data.  
**Returns**: <code>promise</code> - Result of the query call:
- when 1 row is returned, it will resolve with that row as a single object;
- when no rows are returned, it will reject with `"No data returned from the query."`;
- when more than 1 rows are returned, it will reject with
  `"Single row was expected from the query, but multiple returned."`.  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+many"></a>
#### database.many(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects one or more rows.  
**Returns**: <code>promise</code> - Result of the query call:
- when 1 or more rows are returned, it will resolve with the array of rows.
- when no rows are returned, it will reject with `"No data returned from the query."`;  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+oneOrNone"></a>
#### database.oneOrNone(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects 0 or 1 rows.  
**Returns**: <code>promise</code> - Result of the query call:
- when no rows are returned, it will resolve with `null`;
- when 1 row is returned, it will resolve with that row as a single object;
- when more than 1 rows are returned, it will reject with
  `"Single row was expected from the query, but multiple returned."`.  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+manyOrNone"></a>
#### database.manyOrNone(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query that expects any number of rows.  
**Returns**: <code>promise</code> - Result of the query call:
- when no rows are returned, it will resolve with an empty array;
- when 1 or more rows are returned, it will resolve with the array of rows.  
**See**: [Database.any](#module_pg-promise.Database+any)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+any"></a>
#### database.any(query, [values]) ⇒ <code>promise</code>
Alias for method [manyOrNone](Database#manyOrNone)

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Returns**: <code>promise</code> - The same as method [manyOrNone](Database#manyOrNone)  
**See**: [manyOrNone](#module_pg-promise.Database+manyOrNone)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+result"></a>
#### database.result(query, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query without any expectation for the return data,
to provide direct access to the [Result](https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6) object.  
**Returns**: <code>promise</code> - Result of the query call:
- resolves with the original [Result](https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6) object:  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> &#124; <code>object</code> | query string or prepared statement object |
| [values] | <code>array</code> &#124; <code>value</code> | formatting parameters for the query string |

<a name="module_pg-promise.Database+stream"></a>
#### database.stream(qs, init) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Custom data streaming, with help of [pg-query-stream](https://github.com/brianc/node-pg-query-stream)  
**Returns**: <code>promise</code> - Result of the streaming operation.

Once the streaming has finished successfully, the method resolves with
`{processed, duration}`:
- `processed` - total number of rows that have been processed;
- `duration` - streaming duration, in milliseconds.

Possible rejections messages:
- `Invalid or missing stream object`
- `Invalid stream state`
- `Invalid or missing stream initialization callback`
- `Stream not initialized`  

| Param | Type | Description |
| --- | --- | --- |
| qs | <code>QueryStream</code> | stream object of type [QueryStream](https://github.com/brianc/node-pg-query-stream/blob/master/index.js#L5) |
| init | <code>function</code> | stream initialization callback |

<a name="module_pg-promise.Database+func"></a>
#### database.func(funcName, [values], [qrm]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query against a database function by its name:
&#x60;select * from funcName(values)&#x60;  
**Returns**: <code>promise</code> - Result of the query call, according to `qrm`.  
**See**: [query](#module_pg-promise.Database+query)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| funcName | <code>string</code> |  | name of the function to be executed. |
| [values] | <code>array</code> &#124; <code>value</code> |  | parameters for the function. |
| [qrm] | <code>[queryResult](#queryResult)</code> | <code>queryResult.any</code> | Query Result Mask. |

<a name="module_pg-promise.Database+proc"></a>
#### database.proc(procName, [values]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes a query against a stored procedure via its name:
&#x60;select * from procName(values)&#x60;  
**Returns**: <code>promise</code> - The same result as method [oneOrNone](#module_pg-promise.Database+oneOrNone).  
**See**

- [oneOrNone](#module_pg-promise.Database+oneOrNone)
- [func](#module_pg-promise.Database+func)


| Param | Type | Description |
| --- | --- | --- |
| procName | <code>string</code> | name of the stored procedure to be executed. |
| [values] | <code>array</code> &#124; <code>value</code> | parameters for the procedure. |

<a name="module_pg-promise.Database+task"></a>
#### database.task(p1, [p2]) ⇒ <code>promise</code>
**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes the callback function with an automatically managed connection.  
**Returns**: <code>promise</code> - Result from the task callback function.  

| Param | Type | Description |
| --- | --- | --- |
| p1 | <code>object</code> &#124; <code>function</code> | task tag object, if `p2` is `undefined`, or else it is the callback function for the task. |
| [p2] | <code>function</code> | task callback function, if it is not `undefined`, or else `p2` isn't used. |

<a name="module_pg-promise.Database+tx"></a>
#### database.tx(p1, [p2]) ⇒ <code>promise</code>
The method implements the following steps:
- acquires a connection from the pool, if needed;
- executes `BEGIN`;
- executes the callback function;
- if the callback function has resolved:
  - executes `COMMIT`;
  - releases the connection, if it was acquired;
  - resolves with the result from the callback function;
- if the callback function has rejected:
  - executes `ROLLBACK`;
  - releases the connection, if it was acquired;
  - rejects with the result from the callback function.

**Kind**: instance method of <code>[Database](#module_pg-promise.Database)</code>  
**Summary**: Executes the callback function as a transaction.  
**Returns**: <code>promise</code> - Result from the transaction callback function.  

| Param | Type | Description |
| --- | --- | --- |
| p1 | <code>object</code> &#124; <code>function</code> | transaction tag object, if `p2` is `undefined`, or else it is the callback function for the transaction. |
| [p2] | <code>function</code> | transaction callback function, if it is not `undefined`, or else `p2` isn't used. |

<a name="module_pg-promise.version"></a>
### pg-promise.version
Library version.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.as"></a>
### pg-promise.as
Namespace for the type conversion helpers.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.pg"></a>
### pg-promise.pg
Instance of the PG library used.

**Kind**: static property of <code>[pg-promise](#module_pg-promise)</code>  
<a name="module_pg-promise.end"></a>
### pg-promise.end()
Terminates pg library (call it when exiting the application).

**Kind**: static method of <code>[pg-promise](#module_pg-promise)</code>  
<a name="queryResult"></a>
## queryResult : <code>enum</code>
Binary mask that represents the result expected from queries.
The mask is to be passed into the generic query method as the last parameter.
When no value is passed into method query, `queryResult.any` is used.

Any combination of flags is supported, except for `one|many`.

**Kind**: global enum  
**Summary**: Query Result Mask flags.  
**Read only**: true  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| one | <code>number</code> | <code>1</code> | Single row is expected. |
| many | <code>number</code> | <code>2</code> | One or more rows expected. |
| none | <code>number</code> | <code>4</code> | Expecting no rows. |
| any | <code>number</code> | <code>6</code> | many|none - any result is expected. |

<a name="event_connect"></a>
## "connect"
**Kind**: event emitted  
<a name="event_disconnect"></a>
## "disconnect"
**Kind**: event emitted  
<a name="event_query"></a>
## "query"
**Kind**: event emitted  
<a name="event_task"></a>
## "task"
**Kind**: event emitted  
<a name="event_transact"></a>
## "transact"
**Kind**: event emitted  
<a name="event_error"></a>
## "error"
**Kind**: event emitted  
<a name="event_extend"></a>
## "extend"
**Kind**: event emitted  
