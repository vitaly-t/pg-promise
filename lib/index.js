/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

/* eslint no-var: off */
var v = process.versions.node.split('.'),
    highVer = +v[0], lowVer = +v[1];

// istanbul ignore next
if (highVer < 4 || (highVer === 4 && lowVer < 5)) {

    // Starting from pg-promise v5.6.0, the library no longer supports legacy
    // Node.js versions 0.10 and 0.12, requiring Node.js 4.5.0 as the minimum.
    // The last version that supported legacy Node.js versions was 5.5.8

    throw new Error('Minimum Node.js version supported by pg-promise is 4.5.0');
}

module.exports = require('./main');
