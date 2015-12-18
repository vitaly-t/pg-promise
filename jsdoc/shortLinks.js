var fixLinks = require('./fixLinks');

exports.handlers = {
    beforeParse: function (e) {
        e.source = fixLinks(e.source);
    }
};
