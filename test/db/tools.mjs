import * as util from 'util';

export function inspect(obj) {
    return obj[util.inspect.custom]();
}
