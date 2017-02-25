'use strict';

var nodeHighVer = +process.versions.node.split('.')[0];

// istanbul ignore if
if (nodeHighVer < 4) {

    // Starting from pg-promise v5.6.0, the library no longer supports legacy
    // Node.js versions 0.10 and 0.12, requiring Node.js 4.x as the minimum.

    throw new Error('Minimum Node.js version required by pg-promise is 4.x');
}

module.exports = require('./main');
