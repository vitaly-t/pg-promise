### `utils` namespace

This folder contains everything that's available via the [utils] namespace, before and after initialization:

```js
var pgpLib = require('pg-promise');
var pgp = pgpLib(/*initialization options*/);

pgpLib.utils; // `utils` namespace
pgp.utils; // `utils` namespace
```

[utils]:http://vitaly-t.github.io/pg-promise/utils.html
