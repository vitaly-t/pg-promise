const {QueryFileError} = require('./errors');

const a = new QueryFileError(new Error('Ops!'), {file:'.bla/sql', options:123});

// eslint-disable-next-line
console.log(a);
