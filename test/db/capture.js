'use strict';

var util = require('util');

function hookConsole(callback) {

    var stdout = process.stdout,
        stderr = process.stderr,
        oldOutWrite = stdout.write,
        oldErrWrite = stderr.write;

    stdout.write = (function () {
        return function (string) {
            callback(string);
        }
    })(stdout.write);

    stderr.write = (function () {
        return function (string) {
            callback(string);
        }
    })(stderr.write);

    return function () {
        stdout.write = oldOutWrite;
        stderr.write = oldErrWrite;
    }
}

// removes color elements from text;
function removeColors(text) {
    return text.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');
}

function capture() {
    var text, hook = hookConsole(function (s) {
        text = s;
    });
    return function () {
        hook();
        return removeColors(text);
    };
}

module.exports = capture;
