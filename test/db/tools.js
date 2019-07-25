const util = require('util');

function inspect(obj) {
    return obj[util.inspect.custom]();
}

module.exports = {
    inspect
};
