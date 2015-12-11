'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        jsdoc2md: {
            oneOutputFile: {
                options: {
                    "no-gfm": true
                },
                files: files
            }
        }
    });
    grunt.registerTask("fixLinks", fixLinks);
    grunt.loadNpmTasks("grunt-jsdoc-to-markdown");
    grunt.registerTask("default", ["jsdoc2md", "fixLinks"]);
};

var codePath = "API/"; // folder for all generated code documentation;

var files = [
    {
        src: "lib/index.js",
        dest: codePath + "README.md"
    },
    {
        src: "lib/formatting.js",
        dest: codePath + "formatting.md"
    },
    {
        src: "lib/adapter.js",
        dest: codePath + "adapter.md"
    },
    {
        src: "lib/qrError.js",
        dest: codePath + "qrError.md"
    },
    {
        src: "lib/txMode.js",
        dest: codePath + "txMode.md"
    }
];

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
    "BEGIN": "http://www.postgresql.org/docs/9.4/static/sql-begin.html",
    "Transaction Isolation": "http://www.postgresql.org/docs/9.4/static/transaction-iso.html"
};

var fs = require("fs");

//////////////////////////////////////////////////////////
// Replaces all `$[link name]` occurrences in each MD file
// with the corresponding link tag as defined on the list.
function fixLinks() {
    return;

    var done = this.async(), count = 0;
    files.forEach(function (f) {
        fs.readFile(f.dest, "utf-8", function (_, data) {
            data = data.replace(/\$\[[a-z\s\/\+-\.]+\]/gi, function (name) {
                var sln = name.replace(/\$\[|\]/g, ''); // stripped link name;
                if (sln in links) {
                    return "<a href=\"" + links[sln] + "\">" + sln + "</a>"
                }
                return name;
            });
            fs.writeFile(f.dest, data, check);
        });
    });
    function check() {
        if (++count === files.length) {
            done();
        }
    }
}
