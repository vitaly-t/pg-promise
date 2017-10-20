'use strict';

const util = require('util');

function inspect(obj) {
    if (util.inspect.custom) {
        return obj[util.inspect.custom]();
    }
    return obj.inspect();
}

module.exports = {
    inspect
};
