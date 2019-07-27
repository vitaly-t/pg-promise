const {addInspection} = require('../utils');
const utils = require('../utils');

class ServerFormatting {

    constructor() {
        const _i = {
            changed: true,
            currentError: undefined,
            target: {},
            setValues(v) {
                if (Array.isArray(v)) {
                    if (v.length) {
                        _i.target.values = v;
                    } else {
                        delete _i.target.values;
                    }
                } else {
                    if (utils.isNull(v)) {
                        delete _i.target.values;
                    } else {
                        _i.target.values = [v];
                    }
                }
            }
        };
        utils.addReadProp(this, '_inner', _i, true);
    }

    parse /* istanbul ignore next */() {
        // to be implemented in a derived class
    }

    get error() {
        return this._inner.currentError;
    }

    get text() {
        return this._inner.options.text;
    }

    set text(value) {
        const _i = this._inner;
        if (value !== _i.options.text) {
            _i.options.text = value;
            _i.changed = true;
        }
    }

    get binary() {
        return this._inner.options.binary;
    }

    set binary(value) {
        const _i = this._inner;
        if (value !== _i.options.binary) {
            _i.options.binary = value;
            _i.changed = true;
        }
    }

    get rowMode() {
        return this._inner.options.rowMode;
    }

    set rowMode(value) {
        const _i = this._inner;
        if (value !== _i.options.rowMode) {
            _i.options.rowMode = value;
            _i.changed = true;
        }
    }

    get values() {
        return this._inner.target.values;
    }

    set values(value) {
        this._inner.setValues(value);
    }

}

addInspection(ServerFormatting, function () {
    return this.toString();
});

module.exports = {ServerFormatting};
