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

The library supports dynamic protocol extensions, via event [extend], which requires
explicit extension interface to be declared, and parameterized as shown below.

```ts
import {IInitOptions} from 'pg-promise';
import * as pgPromise from 'pg-promise';

// your protocol extensions:
interface IExtensions {
    findUser(userId: number): Promise<any>;
}

// pg-promise initialization options:
const options: IInitOptions<IExtensions> = {
    extend(obj) {
        obj.findUser = userId => {
            return obj.one('SELECT * FROM Users WHERE id = $1', userId);
        }
    }
};

const cn = 'postgres://username:password@host:port/database';

// initializing the library:
const pgp = pgPromise(options);

// database object with extensions:
const db = pgp<IExtensions>(cn);

// now you can use the extensions everywhere (including tasks and transactions):
db.findUser(123).then(...);
```

For a more complete example, check out [pg-promise-demo]. 

[pg-promise-demo]:https://github.com/vitaly-t/pg-promise-demo
[extend]:http://vitaly-t.github.io/pg-promise/global.html#event:extend
[pg-promise]:https://github.com/vitaly-t/pg-promise
