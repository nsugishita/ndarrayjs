"use strict";

let np = {};

let ndarray = require('./ndarray.js');
np.helper = require('./helper.js');


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
