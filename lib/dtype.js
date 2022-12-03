"use strict";

module.exports._set_alias = function(np) {
    np.bool = module.exports.bool;
    np.int = module.exports.int;
    np.int8 = module.exports.int8;
    np.int16 = module.exports.int16;
    np.int32 = module.exports.int32;
    np.int64 = module.exports.int64;
    np.uint = module.exports.uint;
    np.uint8 = module.exports.uint8;
    np.uint16 = module.exports.uint16;
    np.uint32 = module.exports.uint32;
    np.uint64 = module.exports.uint64;
    np.float = module.exports.float;
    np.float16 = module.exports.float16;
    np.float32 = module.exports.float32;
    np.float64 = module.exports.float64;
    np.unicode = module.exports.unicode;
};

// Define dtypes.
// dtypes and its string representaion is described in the documentation:
// https://docs.scipy.org/doc/numpy/reference/arrays.dtypes.html
module.exports.bool = 'bool';
module.exports.int = 'int32';
module.exports.int8 = 'int8';
module.exports.int16 = 'int16';
module.exports.int32 = 'int32';
module.exports.int64 = 'int64';
module.exports.uint = 'uint32';
module.exports.uint8 = 'uint8';
module.exports.uint16 = 'uint16';
module.exports.uint32 = 'uint32';
module.exports.uint64 = 'uint64';
module.exports.float = 'float32';
module.exports.float16 = 'float16';  // Not supported.
module.exports.float32 = 'float32';
module.exports.float64 = 'float64';
module.exports.unicode = 'unicode';

/**
 * Given a string of dtype, return appropriate dtype name.
 * @param {string} value - string representation of dtype.
 * @returns {string} full dtype name
 */
module.exports.get = function(value) {
    if (value == 'int') {
        return module.exports.int;
    } else if (value == 'uint') {
        return module.exports.uint;
    } else if (value == 'float') {
        return module.exports.float;
    } else if (value == 'unicode') {
        return module.exports.unicode;
    } else if (module.exports.all.indexOf(value) >= 0) {
        return value;
    } else if (module.exports.char_to_dtype[value] !== undefined) {
        return module.exports.char_to_dtype[value];
    } else {
        throw new Error('invalid dtype ' + value);
    }
};

module.exports.all = [
    'bool',
    'int32',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'float32',
    'float16',  // Not supported.
    'float32',
    'float64',
    'unicode'
];

// Set mapping from one-character coding to dtypes.
module.exports.char_to_dtype = {};
module.exports.char_to_dtype.b = module.exports.int8;
module.exports.char_to_dtype.b1 = module.exports.bool;
module.exports.char_to_dtype.i = module.exports.int;
module.exports.char_to_dtype.i1 = module.exports.int8;
module.exports.char_to_dtype.i2 = module.exports.int16;
module.exports.char_to_dtype.i4 = module.exports.int32;
module.exports.char_to_dtype.i8 = module.exports.int64;
module.exports.char_to_dtype.L = module.exports.uint;
module.exports.char_to_dtype.u1 = module.exports.uint8;
module.exports.char_to_dtype.u2 = module.exports.uint16;
module.exports.char_to_dtype.u4 = module.exports.uint32;
module.exports.char_to_dtype.u8 = module.exports.uint64;
module.exports.char_to_dtype.f = module.exports.float;
module.exports.char_to_dtype.f2 = module.exports.float16;  // not supported
module.exports.char_to_dtype.f4 = module.exports.float32;
module.exports.char_to_dtype.f8 = module.exports.float64;
module.exports.char_to_dtype.U = module.exports.unicode;

// Set mapping from dtype to typed array constructors.
/* globals BigInt64Array */
/* globals BigUint64Array */
module.exports.arraybuffer = {};
if (typeof Uint8Array != 'undefined')
    module.exports.arraybuffer[module.exports.bool] = Uint8Array;
else
    module.exports.arraybuffer[module.exports.bool] = undefined;
if (typeof Int8Array != 'undefined')
    module.exports.arraybuffer[module.exports.int8] = Int8Array;
else
    module.exports.arraybuffer[module.exports.int8] = undefined;
if (typeof Int16Array != 'undefined')
    module.exports.arraybuffer[module.exports.int16] = Int16Array;
else
    module.exports.arraybuffer[module.exports.int16] = undefined;
if (typeof Int32Array != 'undefined')
    module.exports.arraybuffer[module.exports.int32] = Int32Array;
else
    module.exports.arraybuffer[module.exports.int32] = undefined;
if (typeof BigInt64Array != 'undefined')
    module.exports.arraybuffer[module.exports.int64] = BigInt64Array;
else
    module.exports.arraybuffer[module.exports.int64] = undefined;
if (typeof Uint8Array != 'undefined')
    module.exports.arraybuffer[module.exports.uint8] = Uint8Array;
else
    module.exports.arraybuffer[module.exports.uint8] = undefined;
if (typeof Uint16Array != 'undefined')
    module.exports.arraybuffer[module.exports.uint16] = Uint16Array;
else
    module.exports.arraybuffer[module.exports.uint16] = undefined;
if (typeof Uint32Array != 'undefined')
    module.exports.arraybuffer[module.exports.uint32] = Uint32Array;
else
    module.exports.arraybuffer[module.exports.uint32] = undefined;
if (typeof BigUint64Array != 'undefined')
    module.exports.arraybuffer[module.exports.uint64] = BigUint64Array;
else
    module.exports.arraybuffer[module.exports.uint64] = undefined;
if (typeof Float32Array != 'undefined')
    module.exports.arraybuffer[module.exports.float32] = Float32Array;
else
    module.exports.arraybuffer[module.exports.float32] = undefined;
if (typeof Float64Array != 'undefined')
    module.exports.arraybuffer[module.exports.float64] = Float64Array;
else
    module.exports.arraybuffer[module.exports.float64] = undefined;
module.exports.arraybuffer[module.exports.unicode] = undefined;

// Lookup table to an Array of castable dtypes.
module.exports.castable_types = {};
module.exports.castable_types[module.exports.bool] = [
    module.exports.bool, module.exports.int8, module.exports.int16, module.exports.int32,
    module.exports.int64, module.exports.uint8, module.exports.uint16,
    module.exports.uint32, module.exports.float32, module.exports.float64
];
module.exports.castable_types[module.exports.int8] = [
    module.exports.int8, module.exports.int16, module.exports.int32, module.exports.int64,
    module.exports.float32, module.exports.float64
];
module.exports.castable_types[module.exports.int16] = [
    module.exports.int16, module.exports.int32, module.exports.int64, module.exports.float32,
    module.exports.float64
];
module.exports.castable_types[module.exports.int32] = [
    module.exports.int32, module.exports.int64, module.exports.float32, module.exports.float64
];
module.exports.castable_types[module.exports.int64] = [module.exports.int64, module.exports.float64];
module.exports.castable_types[module.exports.uint8] = [
    module.exports.int16, module.exports.int32, module.exports.int64, module.exports.uint8,
    module.exports.uint16, module.exports.uint32, module.exports.uint64,
    module.exports.float32, module.exports.float64
];
module.exports.castable_types[module.exports.uint16] = [
    module.exports.int32, module.exports.int64, module.exports.uint16, module.exports.uint32,
    module.exports.uint64, module.exports.float32, module.exports.float64
];
module.exports.castable_types[module.exports.uint32] = [
    module.exports.int64, module.exports.uint32, module.exports.uint64, module.exports.float64
];
module.exports.castable_types[module.exports.uint64] = [module.exports.uint64];
module.exports.castable_types[module.exports.float32] = [module.exports.float32, module.exports.float64];
module.exports.castable_types[module.exports.float64] = [module.exports.float64];

// Return True if cast can be done without overflow or truncation.
module.exports.can_cast = function(from_dtype, to_dtype) {
    return module.exports.castable_types[from_dtype].indexOf(to_dtype) >= 0;
};  // can_cast
