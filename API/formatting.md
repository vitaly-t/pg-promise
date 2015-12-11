<a name="module_formatting"></a>
## formatting
Query Formatting

**Author:** Vitaly Tomilov  

* [formatting](#module_formatting)
    * [.as](#module_formatting.as) : <code>object</code>
        * [.text(text, [raw])](#module_formatting.as.text) ⇒ <code>String</code>
        * [.bool(value)](#module_formatting.as.bool) ⇒ <code>String</code>
        * [.date(d, [raw])](#module_formatting.as.date) ⇒ <code>String</code>
        * [.number(num)](#module_formatting.as.number) ⇒ <code>String</code>
        * [.array(arr)](#module_formatting.as.array) ⇒ <code>String</code>
        * [.csv(values)](#module_formatting.as.csv) ⇒ <code>String</code>
        * [.json(obj, [raw])](#module_formatting.as.json) ⇒ <code>String</code>
        * [.func(func, [raw], [obj])](#module_formatting.as.func) ⇒ <code>String</code>
        * [.format(query, [values])](#module_formatting.as.format) ⇒ <code>String</code>

<a name="module_formatting.as"></a>
### formatting.as : <code>object</code>
**Kind**: static namespace of <code>[formatting](#module_formatting)</code>  

* [.as](#module_formatting.as) : <code>object</code>
    * [.text(text, [raw])](#module_formatting.as.text) ⇒ <code>String</code>
    * [.bool(value)](#module_formatting.as.bool) ⇒ <code>String</code>
    * [.date(d, [raw])](#module_formatting.as.date) ⇒ <code>String</code>
    * [.number(num)](#module_formatting.as.number) ⇒ <code>String</code>
    * [.array(arr)](#module_formatting.as.array) ⇒ <code>String</code>
    * [.csv(values)](#module_formatting.as.csv) ⇒ <code>String</code>
    * [.json(obj, [raw])](#module_formatting.as.json) ⇒ <code>String</code>
    * [.func(func, [raw], [obj])](#module_formatting.as.func) ⇒ <code>String</code>
    * [.format(query, [values])](#module_formatting.as.format) ⇒ <code>String</code>

<a name="module_formatting.as.text"></a>
#### as.text(text, [raw]) ⇒ <code>String</code>
Converts a value into PostgreSQL text presentation, fixing single-quote symbolsand wrapping the result in quotes (unless flag `raw` is set).

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>text</td><td><code>String</code></td><td></td><td><p>Value to be converted.</p>
</td>
    </tr><tr>
    <td>[raw]</td><td><code>Boolean</code></td><td><code>false</code></td><td><p>Indicates when the value is not to be formatted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.bool"></a>
#### as.bool(value) ⇒ <code>String</code>
Converts a truthy value into PostgreSQL boolean presentation.

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>value</td><td><code>Boolean</code></td><td><p>Value to be converted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.date"></a>
#### as.date(d, [raw]) ⇒ <code>String</code>
Converts a `Date`-type value into PostgreSQL date/time presentation,as a UTC string, wrapped in quotes (unless flag `raw` is set).

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>d</td><td><code>Date</code></td><td></td><td><p>Value to be converted.</p>
</td>
    </tr><tr>
    <td>[raw]</td><td><code>Boolean</code></td><td><code>false</code></td><td><p>Indicates when the value is not to be formatted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.number"></a>
#### as.number(num) ⇒ <code>String</code>
Converts a numeric value into its PostgreSQL number presentation,with support for `NaN`, `+Infinity` and `-Infinity`.

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>num</td><td><code>Number</code></td><td><p>Value to be converted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.array"></a>
#### as.array(arr) ⇒ <code>String</code>
Converts an array of values into its PostgreSQL presentationas an Array-Type constructor string: `array[]`.

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>arr</td><td><code>Array</code></td><td><p>Array to be converted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.csv"></a>
#### as.csv(values) ⇒ <code>String</code>
Converts a single value or an array of values into a CSV string,with all values formatted according to their type.

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>values</td><td><code>Array</code> | <code>value</code></td><td><p>Value(s) to be converted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.json"></a>
#### as.json(obj, [raw]) ⇒ <code>String</code>
Converts any value into JSON (using `JSON.stringify`), and returns itas a formatted text string (unless flag `raw` is set).

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>obj</td><td><code>Object</code></td><td></td><td><p>Object/Value to be converted.</p>
</td>
    </tr><tr>
    <td>[raw]</td><td><code>Boolean</code></td><td><code>false</code></td><td><p>Indicates when the result is not to be formatted.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.func"></a>
#### as.func(func, [raw], [obj]) ⇒ <code>String</code>
Calls the function to get the actual value, and then formats the resultaccording to its type + `raw` flag.

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Default</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>func</td><td><code>function</code></td><td></td><td><p>Function to be called.</p>
</td>
    </tr><tr>
    <td>[raw]</td><td><code>Boolean</code></td><td><code>false</code></td><td><p>Indicates when the result is not to be formatted.</p>
</td>
    </tr><tr>
    <td>[obj]</td><td><code>Object</code></td><td></td><td><p><code>this</code> context to be passed into the function.</p>
</td>
    </tr>  </tbody>
</table>

<a name="module_formatting.as.format"></a>
#### as.format(query, [values]) ⇒ <code>String</code>
Replaces variables in the query string with the corresponding values passed.

**Kind**: static method of <code>[as](#module_formatting.as)</code>  
<table>
  <thead>
    <tr>
      <th>Param</th><th>Type</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td>query</td><td><code>String</code></td><td><p>Query string with formatting variables in it.</p>
</td>
    </tr><tr>
    <td>[values]</td><td><code>Array</code> | <code>value</code></td><td><p>Formatting variable value(s).</p>
</td>
    </tr>  </tbody>
</table>

