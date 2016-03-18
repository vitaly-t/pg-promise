# SELECT ⇒ INSERT

The following scenario is very common in adding new records:

Insert a new record, if it doesn't exist yet, and return its `id`.

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
            return yield user || t.one('INSERT INTO Users(name) VALUES($1) RETURNING id', name);
        })
        .then(function (user) {
            return user.id;
        });
}
```
