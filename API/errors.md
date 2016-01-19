<a name="module_errors"></a>
## errors
Custom Errors

**Author:** Vitaly Tomilov  

* [errors](#module_errors)
    * [.QueryResultError](#module_errors.QueryResultError) ⇐ <code>Error</code>
        * [new QueryResultError()](#new_module_errors.QueryResultError_new)
    * [.SQLParsingError](#module_errors.SQLParsingError) ⇐ <code>Error</code>
        * [new SQLParsingError()](#new_module_errors.SQLParsingError_new)

<a name="module_errors.QueryResultError"></a>
### errors.QueryResultError ⇐ <code>Error</code>
**Kind**: static class of <code>[errors](#module_errors)</code>  
**Summary**: Query Result Error type.  
**Extends:** <code>Error</code>  
<a name="new_module_errors.QueryResultError_new"></a>
#### new QueryResultError()
Thrown when a query result doesn't match its Query Result Mask.

<a name="module_errors.SQLParsingError"></a>
### errors.SQLParsingError ⇐ <code>Error</code>
**Kind**: static class of <code>[errors](#module_errors)</code>  
**Summary**: SQL Parsing Error type.  
**Extends:** <code>Error</code>  
<a name="new_module_errors.SQLParsingError_new"></a>
#### new SQLParsingError()
Represents a failure to parse an external SQL file.

