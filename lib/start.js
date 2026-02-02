const {PreparedStatementError} = require('./errors');

const a = new PreparedStatementError(new Error('Ops!'), {text: 'bla', values: ['a'], name: 'hello'});

// eslint-disable-next-line
console.log(a);
