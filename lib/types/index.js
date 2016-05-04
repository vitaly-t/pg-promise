'use strict';

var $npm = {
    utils: require('../utils'),
    PS: require('./prepared'),
    PQ: require('./parameterized')
};

// istanbul ignore next;
function QueryParameter() {
}

QueryParameter.prototype.inspect = function () {
    return this.toString();
};

$npm.utils.inherits($npm.PS, QueryParameter);
$npm.utils.inherits($npm.PQ, QueryParameter);

module.exports = {
    QueryParameter: QueryParameter,
    PreparedStatement: $npm.PS,
    ParameterizedQuery: $npm.PQ
};
