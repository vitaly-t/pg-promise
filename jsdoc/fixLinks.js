// Automatic links:
const links = {
    'Promises/A+': 'https://promisesaplus.com',
    'spex': 'https://github.com/vitaly-t/spex',
    'spex.batch': 'http://vitaly-t.github.io/spex/global.html#batch',
    'spex.page': 'http://vitaly-t.github.io/spex/global.html#page',
    'spex.sequence': 'http://vitaly-t.github.io/spex/global.html#sequence',
    'Result': 'https://node-postgres.com/apis/result',
    'pg-query-stream': 'https://github.com/brianc/node-postgres/tree/master/packages/pg-query-stream',
    'QueryStream': 'https://github.com/brianc/node-postgres/blob/master/packages/pg-query-stream/src/index.ts',
    'pg.Client': 'https://node-postgres.com/apis/client',
    'BEGIN': 'http://www.postgresql.org/docs/9.6/static/sql-begin.html',
    'Transaction Isolation': 'http://www.postgresql.org/docs/9.6/static/transaction-iso.html',
    'pg-minify': 'https://github.com/vitaly-t/pg-minify',
    'SQLParsingError': 'https://github.com/vitaly-t/pg-minify/blob/master/lib/error.js',
    'PG': 'https://github.com/brianc/node-postgres',
    'pg': 'https://github.com/brianc/node-postgres',
    'pg-pool': 'https://github.com/brianc/node-postgres/tree/master/packages/pg-pool',
    'Native Bindings': 'https://node-postgres.com/features/native',
    'pg-native': 'https://github.com/brianc/node-postgres/tree/master/packages/pg-native',
    'Named Parameters': 'https://github.com/vitaly-t/pg-promise#named-parameters',
    'Index Variables': 'https://github.com/vitaly-t/pg-promise#index-variables',
    'Nested Named Parameters': 'https://github.com/vitaly-t/pg-promise#nested-named-parameters',
    'tags': 'https://github.com/vitaly-t/pg-promise/wiki/tags',
    'Chaining Queries': 'https://github.com/vitaly-t/pg-promise/wiki/Chaining-Queries',
    'Performance Boost': 'https://github.com/vitaly-t/pg-promise/wiki/Performance-Boost',
    'Prepared Statement': 'http://www.postgresql.org/docs/9.6/static/sql-prepare.html',
    'Prepared Statements': 'http://www.postgresql.org/docs/9.6/static/sql-prepare.html',
    'Custom Type Formatting': 'https://github.com/vitaly-t/pg-promise#custom-type-formatting',
    'Symbolic CTF': 'https://github.com/vitaly-t/pg-promise#symbolic-ctf',
    'SQL Names': 'https://github.com/vitaly-t/pg-promise#sql-names',
    'pg-promise-demo': 'https://github.com/vitaly-t/pg-promise-demo',
    'Robust Listeners': 'https://github.com/vitaly-t/pg-promise/wiki/Robust-Listeners',
    'Promise Adapter': 'https://github.com/vitaly-t/pg-promise/wiki/Promise-Adapter',
    'Bluebird': 'https://github.com/petkaantonov/bluebird',
    'Long Stack Traces': 'http://bluebirdjs.com/docs/api/promise.config.html',
    'Symbol': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol',
    'Library de-initialization': 'https://github.com/vitaly-t/pg-promise#library-de-initialization',
    'Nested Transactions': 'https://github.com/vitaly-t/pg-promise#nested-transactions',
    'changing the database or the role': 'https://stackoverflow.com/questions/2875610/permanently-set-postgresql-schema-path',
    'Promise.allSettled': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled'
};

function fixLinks(source) {
    return source.replace(/\$\[[a-z0-9\s/+-.]+\]/gi, name => {
        const sln = name.replace(/\$\[|\]/g, ''); // stripped link name;
        if (sln in links) {
            return '<a href="' + links[sln] + '">' + sln + '</a>';
        }
        return name;
    });
}

module.exports = {fixLinks};
