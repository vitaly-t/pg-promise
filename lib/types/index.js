'use strict';

var $npm = {
    PS: require('./prepared'),
    PQ: require('./parameterized')
};

function QueryParameter() {
}

QueryParameter.prototype.inspect = function () {
    return this.toString();
};

if (!Object.setPrototypeOf) {
    Object.setPrototypeOf = function (obj, proto) {
        obj.__proto__ = proto;
        return obj;
    };
}

Object.setPrototypeOf($npm.PS.prototype, QueryParameter.prototype);
Object.setPrototypeOf($npm.PQ.prototype, QueryParameter.prototype);

module.exports = {
    QueryParameter: QueryParameter,
    PreparedStatement: $npm.PS,
    ParameterizedQuery: $npm.PQ
};
