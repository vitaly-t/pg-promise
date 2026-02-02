const {QueryFile} = require('./query-file');

const a = new QueryFile('../test/sql/allUsers.sql', {minify: true});

console.log(a);
