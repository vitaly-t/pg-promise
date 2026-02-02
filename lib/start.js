const {ParameterizedQueryError} = require('./errors');

const a = new ParameterizedQueryError(new Error('Ops! is ok to be one one line'), {text: 'bla', values: ['a']});

// eslint-disable-next-line
console.log(a);
