<a name="module_queryFile"></a>
## queryFile
Query File

**Author:** Vitaly Tomilov  

* [queryFile](#module_queryFile)
    * [.QueryFile](#module_queryFile.QueryFile)
        * [new QueryFile(file, [options])](#new_module_queryFile.QueryFile_new)
        * [.query](#module_queryFile.QueryFile+query) : <code>String</code>
        * [.error](#module_queryFile.QueryFile+error) : <code>Error</code>
        * [.file](#module_queryFile.QueryFile+file) : <code>String</code>
        * [.options](#module_queryFile.QueryFile+options) : <code>Object</code>
        * [.prepare()](#module_queryFile.QueryFile+prepare)

<a name="module_queryFile.QueryFile"></a>
### queryFile.QueryFile
**Kind**: static class of <code>[queryFile](#module_queryFile)</code>  
**Summary**: SQL query file provider.  

* [.QueryFile](#module_queryFile.QueryFile)
    * [new QueryFile(file, [options])](#new_module_queryFile.QueryFile_new)
    * [.query](#module_queryFile.QueryFile+query) : <code>String</code>
    * [.error](#module_queryFile.QueryFile+error) : <code>Error</code>
    * [.file](#module_queryFile.QueryFile+file) : <code>String</code>
    * [.options](#module_queryFile.QueryFile+options) : <code>Object</code>
    * [.prepare()](#module_queryFile.QueryFile+prepare)

<a name="new_module_queryFile.QueryFile_new"></a>
#### new QueryFile(file, [options])
Reads a file with SQL and prepares it for execution. The file can containboth single-line and multi-line comments, but only one SQL query, as thelibrary doesn't support results from multiple queries.

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
    <td>[options.minify]</td><td><code>Boolean</code></td><td><code>false</code></td><td><p>Minifies the SQL:</p>
<ol>
<li>Removes all comments</li>
<li>Removes trailing empty symbols</li>
<li>Flattens SQL into a single line</li>
</ol>
<p><strong>IMPORTANT:</strong></p>
<p>Do not minify SQL that contains multi-line strings or strings with comment-like
content. Minification is very basic, and will not work in those cases.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_queryFile.QueryFile+query"></a>
#### queryFile.query : <code>String</code>
When property [error](#module_queryFile.QueryFile+error) is set, the query is `undefined`.

**Kind**: instance property of <code>[QueryFile](#module_queryFile.QueryFile)</code>  
**Summary**: Prepared query string.  
**Default**: <code>undefined</code>  
**Read only**: true  
<a name="module_queryFile.QueryFile+error"></a>
#### queryFile.error : <code>Error</code>
**Kind**: instance property of <code>[QueryFile](#module_queryFile.QueryFile)</code>  
**Summary**: Error, if thrown while preparing the query.  
**Default**: <code>undefined</code>  
**Read only**: true  
<a name="module_queryFile.QueryFile+file"></a>
#### queryFile.file : <code>String</code>
**Kind**: instance property of <code>[QueryFile](#module_queryFile.QueryFile)</code>  
**Summary**: File name/path passed into the constructor.  
**Read only**: true  
<a name="module_queryFile.QueryFile+options"></a>
#### queryFile.options : <code>Object</code>
**Kind**: instance property of <code>[QueryFile](#module_queryFile.QueryFile)</code>  
**Summary**: Set of options, as configured during the object's construction.  
**Read only**: true  
<a name="module_queryFile.QueryFile+prepare"></a>
#### queryFile.prepare()
If the the query hasn't been prepared yet, it will read the fileand process the contents according the parameters passed into theconstructor.

**Kind**: instance method of <code>[QueryFile](#module_queryFile.QueryFile)</code>  
**Summary**: Prepares the query for execution.  
