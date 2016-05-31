'use strict';

///////////////////////////////////////////////////
// NOTE: This file is an experimental development!
///////////////////////////////////////////////////

var fs = require('fs');
var path = require('path');

// istanbul ignore next;
function camelize(text) {
    text = text.replace(/[\-_\s]+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return text.substr(0, 1).toLowerCase() + text.substr(1);
}

// istanbul ignore next;
function camelizeVar(text) {
    text = text.replace(/[^a-zA-Z0-9\$_\-\s]/g, '').replace(/^[0-9_\-\s]+/, '');
    return camelize(text);
}

// istanbul ignore next;
function removeExt(fileName) {
    return fileName.replace(/\.[^/.]+$/, '');
}

// istanbul ignore next;
function isSqlFile(file) {
    return path.extname(file).toLowerCase() === '.sql';
}

// istanbul ignore next;
function _enumSql(dir, options, cb, namePath) {
    var tree = {};
    fs.readdirSync(dir).forEach(function (file) {
        var stat, p = path.join(dir, file);
        try {
            stat = fs.statSync(p);
        } catch (e) {
            if (options.ignoreErrors) {
                return;
            } else {
                throw e;
            }
        }
        if (stat.isDirectory()) {
            if (options.recursive) {
                var dirName = camelizeVar(file);
                if (dirName.length && !(dirName in tree)) {
                    var np = namePath ? (namePath + '.' + dirName) : dirName;
                    var t = _enumSql(p, options, cb, np);
                    if (Object.keys(t).length) {
                        tree[dirName] = t;
                    }
                }
            }
        } else {
            if (isSqlFile(file)) {
                var name = camelizeVar(removeExt(file));
                if (!name.length || name in tree) {
                    if (!options.ignoreErrors) {
                        throw new Error("Empty or duplicate camelized file name: " + p);
                    }
                }
                tree[name] = p;
                if (cb) {
                    var result = cb(p, namePath ? (namePath + '.' + name) : name);
                    if (result !== undefined) {
                        tree[name] = result;
                    }
                }
            }
        }
    });
    return tree;
}

// istanbul ignore next;
function enumSql(dir, options, cb) {
    if (!options || typeof options !== 'object') {
        options = {};
    }
    cb = (typeof cb === 'function') ? cb : null;
    return _enumSql(dir, options, cb, '');
}

module.exports = {
    camelize: camelize,
    camelizeVar: camelizeVar,
    enumSql: enumSql
};
