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

And if you want to make full use of a custom promise library, see file [promise.d.ts]. 

#### Protocol Extensions

The library supports protocol extensions via event [extend], which is a special case when it comes to TypeScript,
as that event dynamically extends the protocol during its callback. And dynamic types in TypeScript usually
require additional casting.

In order to support such dynamic protocol extensions automatically, without any casting, you need to mirror the
protocol extensions through an interface, and then parametrize initialization calls as shown below. 

```ts
// Your protocol extensions:
interface Extensions {
    findUser(userId:number):Promise<any>;
}

// Initialization with the standard protocol extension:
var pgp = pgPromise({    
    extend: function (obj) {
        obj['findUser'] = (userId)=> {
            return obj.one('SELECT * FROM Users WHERE id=$1', userId);
        }
    }
});

// Creating extended database object:
var db = pgp<Extensions>("postgres://username:password@host:port/database");

// Now you can use the extensions:
db.findUser(123).then(...);
```

You can optionally extend the library's initialization object to allow explicit protocol extension during event `extend`:

```ts
// Extended initialization:
var pgp = pgPromise<Extensions>({    
    extend: function (obj) {
        obj.findUser = (userId)=> {
            return obj.one('SELECT * FROM Users WHERE id=$1', userId);
        }
    }
});
```


[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend
[promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/promise.d.ts
[pg-promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg-promise.d.ts
[pg-minify.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg-minify.d.ts
[pg.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg.d.ts
[pg-promise]:https://github.com/vitaly-t/pg-promise
[pg-minify]:https://github.com/vitaly-t/pg-minify
[pg]:https://github.com/brianc/node-postgres
