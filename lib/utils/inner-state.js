const {addReadProp} = require('./');

/**
 * @private
 * @class InnerState
 * @description
 * Implements generic implementation for supporting private/inner state inside classes.
 *
 * A derived class can access its inner state via hidden read-only property _inner.
 */
class InnerState {

    constructor(initialState) {
        let state = {};
        if (initialState && typeof initialState === 'object') {
            state = Object.assign({}, initialState);
        }
        addReadProp(this, '_inner', state, true);
    }

    /**
     * Extends or overrides inner state with the specified properties.
     */
    extendState(state) {
        for (const a in state) {
            // istanbul ignore else
            if (Object.prototype.hasOwnProperty.call(state, a)) {
                this._inner[a] = state[a];
            }
        }
    }
}

/**
 * @member InnerState#_inner
 * Private/Inner object state.
 */

module.exports = {InnerState};
