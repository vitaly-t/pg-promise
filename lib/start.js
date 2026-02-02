const {TransactionMode, isolationLevel} = require('./tx-mode');

const a = new TransactionMode({tiLevel: isolationLevel.serializable});

console.log(a);
