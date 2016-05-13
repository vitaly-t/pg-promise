### `errors` namespace

The namespace for all error-related types.

This folder contains everything that's available via the `errors` namespace, before and after initialization:

```js
var pgpLib = require('pg-promise');
var pgp = pgpLib(/*initialization options*/);

pgpLib.errors; // `errors` namespace
pgp.errors; // `errors` namespace
```

For details see the [`errors` API](http://vitaly-t.github.io/pg-promise/errors.html). 
