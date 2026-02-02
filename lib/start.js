const {TableName} = require('./helpers/table-name');

const a = new TableName({table: 'hello', schema: 'public'});

console.log(a);
