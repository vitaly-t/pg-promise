'use strict';

try {
    eval("(function *(){})");
} catch (e) {
    return; // generators are not supported, exit.
}

require('./es6/generators');
