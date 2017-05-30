pg-promise 6.x
==============

[Promises/A+] interface for PostgreSQL.

[![Build Status](https://travis-ci.org/vitaly-t/pg-promise.svg?branch=6.x)](https://travis-ci.org/vitaly-t/pg-promise)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/pg-promise/badge.svg?branch=6.x)](https://coveralls.io/r/vitaly-t/pg-promise?branch=6.x)
[![Package Quality](http://npm.packagequality.com/shield/pg-promise.svg)](http://packagequality.com/#?package=pg-promise)
[![Join the chat at https://gitter.im/vitaly-t/pg-promise](https://img.shields.io/gitter/room/vitaly-t/pg-promise.svg)](https://gitter.im/vitaly-t/pg-promise?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

---

This is 6.x branch of [pg-promise], temporarily distributed as a `pgp` package:

```
$ npm install pgp
```

...until the day when it is ready to become the `master` branch that is.

---

The only difference from the `master` branch is that it uses the latest version of [node-postgres],
automatically creating and maintaining a separate pool for each database.

See also: [Why the `master` branch is currently using node-postgres v5.1](https://github.com/vitaly-t/pg-promise/issues/206).

[pg-promise]:https://github.com/vitaly-t/pg-promise
[node-postgres]:https://github.com/brianc/node-postgres
[Promises/A+]:https://promisesaplus.com/
