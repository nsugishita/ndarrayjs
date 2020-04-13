"use strict";

let np = {};

function extend(dest, src) {
    for (let key in src) {
        let val = src[key];
        if (Array.isArray(val)) {
            dest[key] = val;
        } else if (val == null) {
            dest[key] = val;
        } else if (typeof val == "object") {
            if (dest[key] === undefined) {
                dest[key] = {};
            }
            extend(dest[key], val);
        } else {
            dest[key] = val;
        }
    }
    return dest;
}

let ndarray = require('./ndarray.js');
extend(np, require('./dtype.js'));
np.helper = require('./helper.js');
np.testing = require('./testing.js');


// Only expose ndarray in es6 mode.
Object.defineProperty(np, 'ndarray', {
    get() {
        if (np.helper.get_mode() == 'es6') {
            return ndarray.ndarray;
        } else {
            return undefined;
        }
    }
});

np.array = ndarray.array;
np.asarray = ndarray.asarray;
np.isndarray = function(a) {
    return a.__ndarray__ !== undefined;
};  // np.isndarray


module.exports = np;
