/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

const {PreparedStatement} = require('./prepared');
const {ParameterizedQuery} = require('./parameterized');

const npm = {
    utils: require('../utils')
};

// istanbul ignore next;
class ExternalQuery {
}

npm.utils.addInspection(ExternalQuery, function () {
    return this.toString();
});

// TODO: this is to be retired
npm.utils.inherits(PreparedStatement, ExternalQuery);
npm.utils.inherits(ParameterizedQuery, ExternalQuery);

module.exports = {
    ExternalQuery,
    PreparedStatement,
    ParameterizedQuery
};
