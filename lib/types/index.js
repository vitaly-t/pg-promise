/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

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
