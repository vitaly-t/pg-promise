'use strict';

/////////////////////////////
// Special Query type;
function SpecialQuery(type) {
    this.isStream = type === 'stream';
    this.isResult = type === 'result';
}

var cache = {
    resultQuery: new SpecialQuery('result'),
    streamQuery: new SpecialQuery('stream')
};

module.exports = {
    SpecialQuery: SpecialQuery,
    cache: cache
};
