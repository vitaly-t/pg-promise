const {Column} = require('./helpers/column');

const a = new Column({
    name: 'test',
    mod: '^'
});

console.log(a);
