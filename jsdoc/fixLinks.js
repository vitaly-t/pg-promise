'use strict';

// Automatic links:
var links = {
    "Promises/A+": "https://promisesaplus.com",
    "spex.batch": "https://github.com/vitaly-t/spex/blob/master/docs/code/batch.md",
    "spex.page": "https://github.com/vitaly-t/spex/blob/master/docs/code/page.md",
    "spex.sequence": "https://github.com/vitaly-t/spex/blob/master/docs/code/sequence.md",
    "Result": "https://github.com/brianc/node-postgres/blob/master/lib/result.js#L6",
    "pg-query-stream": "https://github.com/brianc/node-pg-query-stream",
    "QueryStream": "https://github.com/brianc/node-pg-query-stream/blob/master/index.js#L5",
    "pg.Client": "https://github.com/brianc/node-postgres/wiki/Client",
    "BEGIN": "http://www.postgresql.org/docs/9.5/static/sql-begin.html",
    "Transaction Isolation": "http://www.postgresql.org/docs/9.5/static/transaction-iso.html",
    "pg-minify": "https://github.com/vitaly-t/pg-minify",
    "SQLParsingError": "https://github.com/vitaly-t/pg-minify/blob/master/lib/error.js",
    "PG": "https://github.com/brianc/node-postgres",
    "pg": "https://github.com/brianc/node-postgres",
    "Native Bindings": "https://github.com/brianc/node-postgres#native-bindings",
    "pg-native": "https://github.com/brianc/node-pg-native",
    "Named Parameters": "https://github.com/vitaly-t/pg-promise#named-parameters",
    "tags": "https://github.com/vitaly-t/pg-promise/wiki/workflows#tags",
    "ES6 generator": "https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/function*",
    "Performance Boost": "https://github.com/vitaly-t/pg-promise/wiki/Performance-Boost"
};

function fixLinks(source) {
    return source.replace(/\$\[[a-z0-9\s\/\+-\.]+\]/gi, function (name) {
        var sln = name.replace(/\$\[|\]/g, ''); // stripped link name;
        if (sln in links) {
            return "<a href=\"" + links[sln] + "\">" + sln + "</a>"
        }
        return name;
    });
}

module.exports = fixLinks;
