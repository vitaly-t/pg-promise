# SELECT ⇒ INSERT

The following scenario is very common in adding new records:

* try finding a specific record, and if found - return its id;
* if no record found, add a new record and return the new id.

```sql
-- a simple table example
CREATE TABLE Users(
	id SERIAL NOT NULL,
	name TEXT UNIQUE -- unique user name
);
```

Let's implement a function, according to that logic, to take a user's `name`, and return
a new or existing `id` of the record. 
 
```js
function getInsertUserId(name) {
    return db.tx(function (t) {
            return t.oneOrNone('SELECT id FROM Users WHERE name = $1', name)
                .then(function (user) {
                    return user || t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name);
                });
        })
        .then(function (user) {
            return user.id;
        });
}
```

We are using a transaction to make sure that a parallel request doesn't create a conflict.

Example of calling the function:

```js 
getInsertUserId('name')
    .then(function (userId) {
        // use the id;
    })
    .catch(function (error) {
        // something went wrong;
    });
```

The same function `getInsertUserId`, simplified for the ES6 syntax:

```js
function getInsertUserId(name) {
    return db.tx(t=>t.oneOrNone('SELECT id FROM Users WHERE name = $1', name)
        .then(user=>user || t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name)))
        .then(user=>user.id);
}
```

The same function `getInsertUserId`, using ES6 generators:

```js
function getInsertUserId(name) {
    return db.tx(function *(t) {
        let user = yield t.oneOrNone('SELECT id FROM Users WHERE name = $1', name);
        user = yield user || t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name);
        return user.id;
    });
}
```

## Single-query alternative

It is possible to wrap the whole operation into a single query, which would offer a much better
performance, because:

* Our transaction executes 3-4 queries: `BEGIN`, `SELECT`, [`INSERT`], `COMMIT`, and extra round-trips are expensive
* Transactions are blocking operations, and may require complex tuning for high traffic (see [Configurable Transactions](https://github.com/vitaly-t/pg-promise#configurable-transactions))

Implementing such a single-query operation isn't trivial, and can vary based on whether it is
for PostgreSQL 9.5+ or an older version of the server.

The following posts will help you get started writing your own single-query solution for this:

* [Id from a conditional INSERT](http://stackoverflow.com/questions/36083669/get-id-from-a-conditional-insert)
* [SELECT ⇒ INSERT in a function](http://stackoverflow.com/questions/15939902/is-select-or-insert-in-a-function-prone-to-race-conditions)
