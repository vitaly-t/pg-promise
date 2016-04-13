### TypeScript for pg-promise

Complete TypeScript declarations for [pg-promise] version 3.7.0 or later.

| File             | Description                      |
|------------------|----------------------------------|
|[pg-promise.d.ts] | Main script file for [pg-promise]|
|[pg-minify.d.ts]  | Additional types from [pg-minify]|
|[pg.d.ts]         | Additional types from [pg]|
|[promise.d.ts]    | Promise provider module|

#### Usage

```ts
/// <reference path="node_modules/pg-promise/typescript/pg-promise.d.ts" />

import * as pgPromise from "pg-promise";

var pgp = pgPromise({
    // Initialization Options
});

var db = pgp("postgres://username:password@host:port/database");
```

Example of compiling into JavaScript:

```
tsc myApp.ts --target es6 --module commonjs
```

And if you want to make use of a custom promise library, see file [promise.d.ts]. 


[promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/promise.d.ts
[pg-promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg-promise.d.ts
[pg-minify.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg-minify.d.ts
[pg.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg.d.ts
[pg-promise]:https://github.com/vitaly-t/pg-promise
[pg-minify]:https://github.com/vitaly-t/pg-minify
[pg]:https://github.com/brianc/node-postgres
