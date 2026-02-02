const {QueryResultError} = require('./errors');

const a = new QueryResultError(2, {rows:[{}]}, 'some-query', [1,2,3]);

// eslint-disable-next-line
console.log(a);
