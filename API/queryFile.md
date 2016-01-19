<a name="QueryFile"></a>
## QueryFile
**Kind**: global class  
**Summary**: SQL query file provider.  

* [QueryFile](#QueryFile)
    * [new QueryFile(file, [options])](#new_QueryFile_new)
    * _instance_
        * [.query](#QueryFile+query) : <code>String</code>
        * [.error](#QueryFile+error) : <code>Error</code>
        * [.file](#QueryFile+file) : <code>String</code>
        * [.options](#QueryFile+options) : <code>Object</code>
    * _static_
        * [.prepare()](#QueryFile.prepare)

<a name="new_QueryFile_new"></a>
### new QueryFile(file, [options])
Reads a file with SQL and prepares it for execution. The file can containboth single-line and multi-line comments, but only one SQL query, as thelibrary doesn't support results from multiple queries.The type is available from the library's root: `pgp.QueryFile`.

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>file</td><td><code>String</code></td><td></td><td><p>Name/path of the SQL file with the query. If there is any problem reading
the file, it will be reported when executing the query.</p>
</td>
    </tr><tr>
    <td>[options]</td><td><code>Object</code></td><td></td><td><p>A set of configuration options.</p>
</td>
    </tr><tr>
    <td>[options.debug]</td><td><code>Boolean</code></td><td></td><td><p>When in debug mode, the query file is checked for its last modification
time on every query request, so if it changes, the file is read afresh.</p>
<p>The default for this property is <code>true</code> when <code>NODE_ENV</code> = <code>development</code>,
or <code>false</code> otherwise.</p>
</td>
    </tr><tr>
    <td>[options.minify]</td><td><code>Boolean</code></td><td><code>false</code></td><td><p>Parses and minifies the SQL:</p>
<ol>
<li>Removes all comments</li>
<li>Normalizes multi-line strings</li>
<li>Removes trailing empty symbols</li>
<li>Flattens SQL into a single line</li>
</ol>
<p>Failure to parse SQL will result in <a href="errors.SQLParsingError">SQLParseError</a>.</p>
</td>
    </tr>  </tbody>
</table>

<a name="QueryFile+query"></a>
### queryFile.query : <code>String</code>
When property [error](#QueryFile+error) is set, the query is `undefined`.

**Kind**: instance property of <code>[QueryFile](#QueryFile)</code>  
**Summary**: Prepared query string.  
**Default**: <code>undefined</code>  
**Read only**: true  
<a name="QueryFile+error"></a>
### queryFile.error : <code>Error</code>
**Kind**: instance property of <code>[QueryFile](#QueryFile)</code>  
**Summary**: Error, if thrown while preparing the query.  
**Default**: <code>undefined</code>  
**Read only**: true  
<a name="QueryFile+file"></a>
### queryFile.file : <code>String</code>
**Kind**: instance property of <code>[QueryFile](#QueryFile)</code>  
**Summary**: File name/path passed into the constructor.  
**Read only**: true  
<a name="QueryFile+options"></a>
### queryFile.options : <code>Object</code>
**Kind**: instance property of <code>[QueryFile](#QueryFile)</code>  
**Summary**: Set of options, as configured during the object's construction.  
**Read only**: true  
<a name="QueryFile.prepare"></a>
### QueryFile.prepare()
If the the query hasn't been prepared yet, it will read the fileand process the contents according the parameters passed into theconstructor.

**Kind**: static method of <code>[QueryFile](#QueryFile)</code>  
**Summary**: Prepares the query for execution.  
