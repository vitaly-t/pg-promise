const {addInspection} = require('../utils');

class ServerFormatting {
    parse() {
        // to be implemented in a derived class
    }
}

addInspection(ServerFormatting, function () {
    return this.toString();
});

module.exports = {ServerFormatting};
