const {ColumnSet} = require('./helpers/column-set');

const a = new ColumnSet([{name: 'one', mod: '^'}, {name: 'two', mod: '#', skip: () => false}], {
    table: {
        table: 'main',
        schema: 'public'
    }
});

console.log(a);
