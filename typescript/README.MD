## TypeScript for pg-promise

Complete TypeScript 2.0 declarations for the [pg-promise] module.

### Inclusion

Typescript should be able to pick up the definitions without any manual configuration.

### Usage

```ts
import {IMain, IDatabase} from 'pg-promise';
import * as pgPromise from 'pg-promise';

var pgp:IMain = pgPromise({
    // Initialization Options
});

var cn:string = 'postgres://username:password@host:port/database';

var db:IDatabase<any> = pgp(cn);
```

Example of compiling into JavaScript:

```
$ tsc myApp.ts --target es6 --module commonjs
```

And if you want to make full use of a custom promise library, see file [ext-promise.d.ts]. 

#### Protocol Extensions

The library supports protocol extensions via event [extend], which is a special case when it comes to TypeScript,
as it dynamically extends the protocol during its callback, which in TypeScript implies type casting.

In order to support dynamic protocol extensions automatically, you need to mirror the protocol extensions through
an interface, and then re-cast the database object with it, as shown below. 

```ts
import {IMain, IDatabase} from 'pg-promise';
import * as pgPromise from 'pg-promise';

// your protocol extensions:
interface IExtensions {
    findUser(userId: number): Promise<any>;
}

// pg-promise initialization options:
var options = {
    extend: obj => {
        obj.findUser = userId => {
            return obj.one('SELECT * FROM Users WHERE id=$1', userId);
        }
    }
};

var cn = 'postgres://username:password@host:port/database';

// initializing the library:
var pgp: IMain = pgPromise(options);

// database object with extensions:
var db = <IDatabase<IExtensions>&IExtensions>pgp(cn);

// now you can use the extensions everywhere (including tasks and transactions):
db.findUser(123).then(...);
```

Alternatively, you can create the extended `db` object like this:
```ts
var db = pgp<IExtensions>(cn);
```
The result is identical, but some IntelliSense implementations may struggle to inspect such type correctly.

And if you want strict initialization options, with inline type casting, you can do this:

```ts
// extended initialization:
var pgp = pgPromise<IExtensions>({
    extend: obj=> {
        obj.findUser = userId=> {
            return obj.one('SELECT * FROM Users WHERE id=$1', userId);
        }
    }
});
```

For a more complete and advanced example of using [pg-promise] with TypeScript, check out [pg-promise-demo]. 

[pg-promise-demo]:https://github.com/vitaly-t/pg-promise-demo
[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend
[ext-promise.d.ts]:https://github.com/vitaly-t/pg-promise/blob/master/typescript/ext-promise.d.ts
[pg-promise]:https://github.com/vitaly-t/pg-promise
