<a name="txMode"></a>
## txMode : <code>object</code>
Extends the default `BEGIN` with Transaction Mode parameters: - isolation level - access mode - deferrable mode

**Kind**: global namespace  
**See**: <a href="http://www.postgresql.org/docs/9.4/static/sql-begin.html">BEGIN</a>  

* [txMode](#txMode) : <code>object</code>
    * [.TransactionMode](#txMode.TransactionMode)
        * [new TransactionMode([tiLevel], [readOnly], [deferrable])](#new_txMode.TransactionMode_new)
    * [.isolationLevel](#txMode.isolationLevel) : <code>enum</code>

<a name="txMode.TransactionMode"></a>
### txMode.TransactionMode
**Kind**: static class of <code>[txMode](#txMode)</code>  
**See**: <a href="http://www.postgresql.org/docs/9.4/static/sql-begin.html">BEGIN</a>  
<a name="new_txMode.TransactionMode_new"></a>
#### new TransactionMode([tiLevel], [readOnly], [deferrable])
**Alternative Syntax:** `TransactionMode({tiLevel, readOnly, deferrable})`Constructs a complete transaction opening command,based on Transaction Mode parameters: - isolation level - access mode - deferrable mode

<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>[tiLevel]</td><td><code>isolationLevel</code> | <code>Object</code></td><td><p>Transaction Isolation Level</p>
</td>
    </tr><tr>
    <td>[readOnly]</td><td><code>Boolean</code></td><td><p>Sets transaction access mode based on the read-only flag:</p>
<ul>
<li><code>undefined</code> - access mode not specified (default)</li>
<li><code>true</code> - access mode is set as <code>READ ONLY</code></li>
<li><code>false</code> - access mode is set as <code>READ WRITE</code></li>
</ul>
</td>
    </tr><tr>
    <td>[deferrable]</td><td><code>Boolean</code></td><td><p>Sets transaction deferrable mode based on the boolean value:</p>
<ul>
<li><code>undefined</code> - deferrable mode not specified (default)</li>
<li><code>true</code> - mode is set as <code>DEFERRABLE</code></li>
<li><code>false</code> - mode is set as <code>NOT DEFERRABLE</code></li>
</ul>
<p>It is used only when <code>tiLevel</code>=<code>isolationLevel.serializable</code>
and <code>readOnly</code>=<code>true</code>, or else it is ignored.</p>
</td>
    </tr>  </tbody>
</table>

<a name="txMode.isolationLevel"></a>
### txMode.isolationLevel : <code>enum</code>
**Kind**: static enum property of <code>[txMode](#txMode)</code>  
**Summary**: Transaction Isolation Level.  
**Read only**: true  
**See**: <a href="http://www.postgresql.org/docs/9.4/static/transaction-iso.html">Transaction Isolation</a>  
**Properties**

<table>
  <thead>
    <tr>
      <th>Name</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>none</td><td><code>Number</code></td><td><code>0</code></td><td>Isolation level not specified.</td>
    </tr><tr>
    <td>serializable</td><td><code>Number</code></td><td><code>1</code></td><td>ISOLATION LEVEL SERIALIZABLE</td>
    </tr><tr>
    <td>repeatableRead</td><td><code>Number</code></td><td><code>2</code></td><td>ISOLATION LEVEL REPEATABLE READ</td>
    </tr><tr>
    <td>readCommitted</td><td><code>Number</code></td><td><code>3</code></td><td>ISOLATION LEVEL READ COMMITTED</td>
    </tr>  </tbody>
</table>

