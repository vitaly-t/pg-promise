/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

/////////////////////////////
// Special Query type;
class SpecialQuery {
    constructor(type) {
        this[type] = true;
    }
}

const cache = {
    resultQuery: new SpecialQuery('isResult'),
    multiResultQuery: new SpecialQuery('isMultiResult'),
    streamQuery: new SpecialQuery('isStream')
};

module.exports = {
    SpecialQuery,
    cache
};
