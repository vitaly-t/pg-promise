'use strict';

const npm = {
    utils: require('../utils'),
    PS: require('./prepared'),
    PQ: require('./parameterized')
};

// istanbul ignore next;
class ExternalQuery {
}

npm.utils.addInspection(ExternalQuery, function () {
    return this.toString();
});

npm.utils.inherits(npm.PS, ExternalQuery);
npm.utils.inherits(npm.PQ, ExternalQuery);

module.exports = {
    ExternalQuery,
    PreparedStatement: npm.PS,
    ParameterizedQuery: npm.PQ
};
