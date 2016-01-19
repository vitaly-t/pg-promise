<a name="errors"></a>
## errors : <code>object</code>
**Kind**: global namespace  

* [errors](#errors) : <code>object</code>
    * [.QueryResultError](#errors.QueryResultError) ⇐ <code>Error</code>
        * [new QueryResultError()](#new_errors.QueryResultError_new)
    * [.SQLParsingError](#errors.SQLParsingError) ⇐ <code>Error</code>
        * [new SQLParsingError()](#new_errors.SQLParsingError_new)

<a name="errors.QueryResultError"></a>
### errors.QueryResultError ⇐ <code>Error</code>
**Kind**: static class of <code>[errors](#errors)</code>  
**Summary**: Query Result Error type.  
**Extends:** <code>Error</code>  
<a name="new_errors.QueryResultError_new"></a>
#### new QueryResultError()
Thrown when a query result doesn't match its Query Result Mask.The type is available from the library's root: `pgp.QueryResultError`.

<a name="errors.SQLParsingError"></a>
### errors.SQLParsingError ⇐ <code>Error</code>
**Kind**: static class of <code>[errors](#errors)</code>  
**Summary**: SQL Parsing Error type.  
**Extends:** <code>Error</code>  
<a name="new_errors.SQLParsingError_new"></a>
#### new SQLParsingError()
Represents a failure to parse an external SQL file.The type is available from the library's root: `pgp.SQLParsingError`.

