'use strict';

function hookConsole(callback) {

    const stdout = process.stdout,
        stderr = process.stderr,
        oldOutWrite = stdout.write,
        oldErrWrite = stderr.write;

    stdout.write = (() => {
        return string => {
            callback(string);
        };
    })(stdout.write);

    stderr.write = (() => {
        return string => {
            callback(string);
        };
    })(stderr.write);

    return () => {
        stdout.write = oldOutWrite;
        stderr.write = oldErrWrite;
    };
}

// removes color elements from text;
function removeColors(text) {
    // eslint-disable-next-line
    return text.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '');
}

function capture() {
    let text = '';
    const hook = hookConsole(s => {
        if (!text) {
            text = s;
        }
    });
    return () => {
        hook();
        return removeColors(text);
    };
}

module.exports = capture;
