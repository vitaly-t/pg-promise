### TypeScript for pg-promise

Complete TypeScript declarations for [pg-promise] version 3.8.0 or later.

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
as it dynamically extends the protocol during its callback, which in TypeScript implies type casting.

In order to support dynamic protocol extensions automatically, without any casting, you need to mirror the
protocol extensions through an interface, and then parametrize initialization calls as shown below. 

```ts
// your protocol extensions:
interface Extensions {
    findUser(userId:number):Promise<any>;
}

// pg-promise initialization options:
var options = {
    extend: function (obj, dc) {
        obj.findUser = (userId)=> {
            return obj.one('SELECT * FROM Users WHERE id=$1', userId);
        }
    }
};

// initializing the library:
var pgp = pgPromise(options);

// creating an extended database object:
var db = pgp<Extensions>("postgres://username:password@host:port/database");

// now you can use the extensions:
db.findUser(123).then(...);
```

And if you want strict initialization options, with inline type casting, you can do this:

```ts
// extended initialization:
var pgp = pgPromise<Extensions>({    
    extend: function (obj, dc) {
        obj.findUser = (userId)=> {
            return obj.one('SELECT * FROM Users WHERE id=$1', userId);
        }
    }
});
```

For a more complete and advanced example of using [pg-promise] with TypeScript, check out [pg-promise-demo]. 

[pg-promise-demo]:https://github.com/vitaly-t/pg-promise-demo
[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend
[promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/promise.d.ts
[pg-promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg-promise.d.ts
[pg-minify.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg-minify.d.ts
[pg.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/pg.d.ts
[pg-promise]:https://github.com/vitaly-t/pg-promise
[pg-minify]:https://github.com/vitaly-t/pg-minify
[pg]:https://github.com/brianc/node-postgres
