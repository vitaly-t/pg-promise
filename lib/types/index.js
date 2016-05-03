'use strict';

var $npm = {
    util: require('util'),
    PS: require('./prepared'),
    PQ: require('./parameterized')
};

function QueryParameter() {
}

QueryParameter.prototype.inspect = function () {
    return this.toString();
};

$npm.util.inherits($npm.PS, QueryParameter);
$npm.util.inherits($npm.PQ, QueryParameter);

module.exports = {
    QueryParameter: QueryParameter,
    PreparedStatement: $npm.PS,
    ParameterizedQuery: $npm.PQ
};
