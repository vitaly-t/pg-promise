'use strict';

var util = require('util');

function hookConsole(callback) {

    var std = process.stdout, old_write = std.write;

    std.write = (function () {
        return function (string) {
            callback(string);
        }
    })(std.write);

    return function () {
        std.write = old_write;
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
