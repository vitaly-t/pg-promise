const fixLinks = require('./fixLinks');

exports.handlers = {
    beforeParse: e => {
        e.source = fixLinks(e.source);
    }
};
