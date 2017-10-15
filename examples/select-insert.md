# SELECT ⇒ INSERT

The following scenario is very common in adding new records:

* try finding a specific record, and if found - return its id;
* if no record found, add a new one and return the new id.

```sql
-- a simple table example
CREATE TABLE Users(
	id SERIAL PRIMARY KEY,
	name TEXT UNIQUE -- unique user name
);
```

Let's implement a function, according to that logic, to search by user's `name`, and return
a new or existing `id` of the record. 
 
```js
function getInsertUserId(name) {
    return db.task('getInsertUserId', t => {
            return t.oneOrNone('SELECT id FROM Users WHERE name = $1', name, u => u && u.id)
                .then(userId => {
                    return userId || t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name, u => u.id);
                });
        });
}
```

Example of calling the function:

```js 
getInsertUserId('name')
    .then(userId => {
        // use the id;
    })
    .catch(error => {
        // something went wrong;
    });
```

The same function `getInsertUserId`, using ES6 generators:

```js
function getInsertUserId(name) {
    return db.task('getInsertUserId', function *(t) {
        const userId = yield t.oneOrNone('SELECT id FROM Users WHERE name = $1', name, u => u && u.id);
        return yield userId || t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name, u => u.id);
    });
}
```

The same function `getInsertUserId`, using ES7 async syntax:

```js
async function getInsertUserId(name) {
    return await db.task('getInsertUserId', async (t) => {
        const userId = await t.oneOrNone('SELECT id FROM Users WHERE name = $1', name, u => u && u.id);
        return userId || await t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name, u => u.id);
    });
}
```

We recommend one of the following runtimes or transpilers when using the ES7 async clause:
* Node.js `7.6` or more recent
* TypeScript `2.1` or more recent
* Babel using `babel-preset-es2017` preset or `babel-plugin-transform-async-to-generator` plugin

## Single-query alternative

It is possible to wrap the whole operation into a single query, which would offer a better
performance, executing always just one query, and more importantly - proper data integrity,
by making sure that a parallel request would not try to execute a second `INSERT`. 

Implementing such a query however isn't trivial, and it can vary based on whether it is for
PostgreSQL 9.5+ or an older version of the server.

The following posts will help you get started writing your own single-query solution for this:

* [Id from a conditional INSERT](http://stackoverflow.com/questions/36083669/get-id-from-a-conditional-insert)
* [SELECT ⇒ INSERT in a function](http://stackoverflow.com/questions/15939902/is-select-or-insert-in-a-function-prone-to-race-conditions)
