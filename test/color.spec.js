const {ColorConsole} = require('../lib/utils/color');

describe('protocol', () => {
    it('must have the right signature', () => {
        expect(typeof ColorConsole).toBe('function');
        expect(typeof ColorConsole.log).toBe('function');
        expect(typeof ColorConsole.log.bright).toBe('function');
        expect(typeof ColorConsole.info).toBe('function');
        expect(typeof ColorConsole.info.bright).toBe('function');
        expect(typeof ColorConsole.warn).toBe('function');
        expect(typeof ColorConsole.warn.bright).toBe('function');
        expect(typeof ColorConsole.error).toBe('function');
        expect(typeof ColorConsole.error.bright).toBe('function');
        expect(typeof ColorConsole.success).toBe('function');
        expect(typeof ColorConsole.success.bright).toBe('function');
    });
});

describe('text', () => {
    it('must match', () => {
        expect(invoke(ColorConsole.log, 'log')).toEqual(['log']);
        expect(invoke(ColorConsole.log.bright, ['one', 'two'])).toEqual(['one', 'two']);
        expect(invoke(ColorConsole.info, 'info')).toEqual(['info']);
        expect(invoke(ColorConsole.info.bright, ['one', 'two'])).toEqual(['one', 'two']);
        expect(invoke(ColorConsole.warn, 'warning')).toEqual(['warning']);
        expect(invoke(ColorConsole.warn.bright, ['one', 'two'])).toEqual(['one', 'two']);
        expect(invoke(ColorConsole.success, 'success')).toEqual(['success']);
        expect(invoke(ColorConsole.success.bright, ['one', 'two'])).toEqual(['one', 'two']);
        expect(invoke(ColorConsole.error, 'error', true)).toEqual(['error']);
        expect(invoke(ColorConsole.error.bright, ['one', 'two'], true)).toEqual(['one', 'two']);
    });

    function invoke(method, text, isErr) {
        text = Array.isArray(text) ? text : [text];
        const name = isErr ? 'error' : 'log';
        const old = console[name]; // eslint-disable-line no-console
        let res;
        console[name] = function () { // eslint-disable-line no-console
            res = [...arguments].map(removeColors);
        };
        method.apply(null, text);
        console[name] = old; // eslint-disable-line no-console
        return res;
    }
});

function removeColors(text) {
    /*eslint no-control-regex: 0*/
    return text.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');
}
