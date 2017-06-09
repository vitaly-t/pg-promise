'use strict';

/////////////////////////////
// Special Query type;
class SpecialQuery {
    constructor(type) {
        this.isStream = type === 'stream';
        this.isResult = type === 'result';
    }
}

var cache = {
    resultQuery: new SpecialQuery('result'),
    streamQuery: new SpecialQuery('stream')
};

module.exports = {
    SpecialQuery,
    cache
};
