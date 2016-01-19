## Classes

<dl>
<dt><a href="#QueryResultError">QueryResultError</a> ⇐ <code>Error</code></dt>
<dd></dd>
<dt><a href="#SQLParsingError">SQLParsingError</a> ⇐ <code>Error</code></dt>
<dd></dd>
</dl>

<a name="QueryResultError"></a>
## QueryResultError ⇐ <code>Error</code>
**Kind**: global class  
**Summary**: Query Result Error type.  
**Extends:** <code>Error</code>  
<a name="new_QueryResultError_new"></a>
### new QueryResultError()
Thrown when a query result doesn't match its Query Result Mask.The type is available from the library's root: `pgp.QueryResultError`.

<a name="SQLParsingError"></a>
## SQLParsingError ⇐ <code>Error</code>
**Kind**: global class  
**Summary**: SQL Parsing Error type.  
**Extends:** <code>Error</code>  
<a name="new_SQLParsingError_new"></a>
### new SQLParsingError()
Represents a failure to parse an external SQL file.The type is available from the library's root: `pgp.SQLParsingError`.

