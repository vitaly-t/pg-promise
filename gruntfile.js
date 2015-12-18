'use strict';

var fs = require("fs");
var fixLinks = require('./jsdoc/fixLinks');

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
    grunt.registerTask("fixFiles", fixFiles);
    grunt.loadNpmTasks("grunt-jsdoc-to-markdown");
    grunt.registerTask("default", ["jsdoc2md", "fixFiles"]);
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

//////////////////////////////////////////////////////////
// Replaces all `$[link name]` occurrences in each MD file
// with the corresponding link tag as defined on the list.
function fixFiles() {
    var done = this.async(), count = 0;
    files.forEach(function (f) {
        fs.readFile(f.dest, "utf-8", function (_, data) {
            data = fixLinks(data);
            fs.writeFile(f.dest, data, check);
        });
    });
    function check() {
        if (++count === files.length) {
            done();
        }
    }
}
