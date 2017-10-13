'use strict';

/* eslint no-var: off */
var v = process.versions.node.split('.'),
    highVer = +v[0], lowVer = +v[1];

// istanbul ignore next
if (highVer < 4 || (highVer === 4 && lowVer < 5)) {

    // Starting from pg-promise v5.6.0, the library no longer supports legacy
    // Node.js versions 0.10 and 0.12, requiring Node.js 4.5.0 as the minimum.

    throw new Error('Minimum Node.js version supported by pg-promise is 4.5.0');
}

module.exports = require('./main');
