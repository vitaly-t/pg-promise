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
    grunt.loadNpmTasks("grunt-jsdoc-to-markdown");
    grunt.registerTask("default", "jsdoc2md");
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
    }
];
