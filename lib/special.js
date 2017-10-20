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
