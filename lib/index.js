'use strict';

var nodeHighVer = +process.versions.node.split('.')[0];

// istanbul ignore if
if (nodeHighVer < 4) {
    throw new Error('Minimum Node.js version required by pg-promise is 4.x');
}

module.exports = require('./main');
