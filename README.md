pg-promise 6.x Beta
===================

[Promises/A+] interface for PostgreSQL.

[![Build Status](https://travis-ci.org/vitaly-t/pg-promise.svg?branch=6.x)](https://travis-ci.org/vitaly-t/pg-promise)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/pg-promise/badge.svg?branch=6.x)](https://coveralls.io/r/vitaly-t/pg-promise?branch=6.x)
[![Package Quality](http://npm.packagequality.com/shield/pg-promise.svg)](http://packagequality.com/#?package=pg-promise)
[![Join the chat at https://gitter.im/vitaly-t/pg-promise](https://img.shields.io/gitter/room/vitaly-t/pg-promise.svg)](https://gitter.im/vitaly-t/pg-promise?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

---

This is 6.x branch of [pg-promise], currently in Beta, and to be installed as follows:

```
$ npm install pg-promise@beta
```

---

It uses the latest version of [node-postgres], automatically allocating a new connection pool for each [Database] object.

See also: [Why the `master` branch is currently using node-postgres v5.1](https://github.com/vitaly-t/pg-promise/issues/206).

[pg-promise]:https://github.com/vitaly-t/pg-promise
[node-postgres]:https://github.com/brianc/node-postgres
[Promises/A+]:https://promisesaplus.com/
[Pool Strategy]:http://vitaly-t.github.io/pg-promise/global.html#PoolStrategy
