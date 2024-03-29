"use strict";

module.exports._set_alias = function(np) {
    var key;
    for (key in module.exports)
        np[key] = module.exports[key];
};

var ndarray_module = require('./ndarray');
var dtype_module = require('./dtype');
var helper = require('./helper');
var jsarray = helper.jsarray;

// Return a new array of given shape and type, filled with zeros.
var zeros = module.exports.zeros = function(shape, dtype) {
    if (arguments.length != 1 && arguments.length != 2) {
        throw new Error('invalid number of arguments:' + JSON.stringify(arguments));
    }
    if (!Array.isArray(shape)) { shape = [shape];
    }
    if (dtype === undefined) {
        dtype = dtype_module.float;
    }
    var size = jsarray.prod(shape);
    var ArrayBuffer = dtype_module.arraybuffer[dtype];
    var buffer = new ArrayBuffer(size);
    return new ndarray_module.ndarray(buffer, shape, dtype);
};  // np.zeros

// Return a new array with shape of input filled with zeros.
var zeros_like = module.exports.zeros_like = function(a, dtype) {
    throw new Error('not implemented');
};  // np.zeros_like

// Return a new array of given shape and type, filled with ones.
var ones = module.exports.ones = function(shape, dtype) {
    return full(shape, 1.0, dtype);
};  // np.ones

// Return a new array with shape of input filled with ones.
var ones_like = module.exports.ones_like = function(a, dtype) {
    return full_like(a, 1.0, dtype);
};  // np.ones_like

// Return a new array of given shape and type, filled with `fill_value`.
var full = module.exports.full = function(shape, fill_value, dtype) {
    if (arguments.length < 1 || arguments.length > 3) {
        throw new Error('invalid number of arguments:' + JSON.stringify(arguments));
    }
    if (!Array.isArray(shape)) {
        shape = [shape];
    }
    if (dtype === undefined) {
        dtype = dtype_module.float;
    }
    var size = jsarray.prod(shape);
    var ArrayBuffer = dtype_module.arraybuffer[dtype];
    var buffer = new ArrayBuffer(size);
    var i;
    for (i = 0; i < buffer.length; i++) {
        buffer[i] = fill_value;
    }
    return new ndarray_module.ndarray(buffer, shape, dtype);
};  // np.full


// Return a new array with shape of input filled with value.
var full_like = module.exports.full_like = function(a, fill_value, dtype) {
    throw new Error('not implemented');
};  // np.full_like


// Return a new array of given shape and type.
// Actually, this is an alias for np.zeros, since javascript typed arrays
// are initialized to be 0.
var empty = module.exports.empty = module.exports.zeros;


// Return a new array with shape of input.
// Actually, this is an alias for np.zeros_like, since javascript typed arrays
// are initialized to be 0.
var empty_like = module.exports.empty_like = module.exports.zeros_like;

/**
 * Return evenly spaced values within a given interval.
 * @param {int} [start]
 * @param {int} stop
 * @param {int} [step]
 * @param {dtype} [dtype=np.int]
 * @returns {ndarray}
 */
var arange = module.exports.arange = function(start, stop, step, dtype) {
    if (start === undefined) {
        throw new Error('at least one argument must be given.');
    } else if (stop === undefined) {
        stop = start;
        start = 0;
        step = 1;
    } else if (step === undefined) {
        start = start;
        stop = stop;
        step = 1;
    }
    dtype = dtype || dtype_module.int;
    var numel = Math.ceil((stop-start)/step);
    var shape = [numel];
    var buffer;

    if (helper.use_arraybuffer()) {
        var _TypedArray = dtype_module.arraybuffer[dtype];
        buffer = new _TypedArray(numel);
        if (dtype == dtype_module.int64) {
            for (i = 0; i < numel; i++) {
                /* jshint ignore:start */
                buffer[i] = BigInt(Math.round(start + step*i));
                /* jshint ignore:end */
            }
        } else {
            for (i = 0; i < numel; i++) {
                buffer[i] = Math.round(start + step * i);
            }
        }
    } else {
        buffer = [];
        if (dtype == dtype_module.int64) {
            for (i = 0; i < numel; i++) {
                /* jshint ignore:start */
                buffer.push(BigInt(Math.round(start + step*i)));
                /* jshint ignore:end */
            }
        } else {
            for (i = 0; i < numel; i++) {
                buffer.push(Math.round(start + step*i));
            }
        }
    }
    var array = ndarray_module.asarray(buffer, shape, dtype);
    var i;
    return array;
};  // np.arange
