## TypeScript for pg-promise

Complete TypeScript 3.x declarations for [pg-promise].

### Inclusion

Typescript should be able to pick up the definitions without any manual configuration.

### Simple Usage

```ts
import * as pgPromise from 'pg-promise';

const pgp = pgPromise({
    // Initialization Options
});

const cn = 'postgres://username:password@host:port/database';

const db = pgp(cn);
```

#### With Extensions

The library supports dynamic protocol extensions, via event [extend], which require
explicit extension interface to be declared, and parameterized as shown below.

```ts
import {IMain} from 'pg-promise';
import * as pgPromise from 'pg-promise';

// your protocol extensions:
interface IExtensions {
    findUser(userId: number): Promise<any>;
}

// pg-promise initialization options:
const options: IInitOptions<IExtensions> = {
    extend(obj: IInitOptions) {
        obj.findUser = userId => {
            return obj.one('SELECT * FROM Users WHERE id = $1', userId);
        }
    }
};

const cn = 'postgres://username:password@host:port/database';

// initializing the library:
const pgp: IMain = pgPromise(options);

// database object with extensions:
const db = pgp<IExtensions>(cn);

// now you can use the extensions everywhere (including tasks and transactions):
db.findUser(123).then(...);
```

And if you want strict initialization options, with inline type casting, you can do this:

```ts
// extended initialization:
const pgp = pgPromise<IExtensions>({
    extend(obj:IExtensions) {
        obj.findUser = userId => {
            return obj.one('SELECT * FROM Users WHERE id = $1', userId);
        }
    }
});
```

For a more complete and advanced example of using [pg-promise] with TypeScript, check out [pg-promise-demo]. 

[pg-promise-demo]:https://github.com/vitaly-t/pg-promise-demo
[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend
[pg-promise]:https://github.com/vitaly-t/pg-promise
