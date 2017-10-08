'use strict';

/////////////////////////////
// Special Query type;
class SpecialQuery {
    constructor(type) {
        this.isStream = type === 'stream';
        this.isMultiResult = type === 'multiResult';
        this.isResult = type === 'result';
    }
}

const cache = {
    resultQuery: new SpecialQuery('result'),
    multiResultQuery: new SpecialQuery('multiResult'),
    streamQuery: new SpecialQuery('stream')
};

module.exports = {
    SpecialQuery,
    cache
};
