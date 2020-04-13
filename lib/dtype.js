"use strict";

let np = {};

// Define dtypes.
// dtypes and its string representaion is described in the documentation:
// https://docs.scipy.org/doc/numpy/reference/arrays.dtypes.html
np.bool = 'bool';
np.int = 'int32';
np.int8 = 'int8';
np.int16 = 'int16';
np.int32 = 'int32';
np.int64 = 'int64';
np.uint = 'uint32';
np.uint8 = 'uint8';
np.uint16 = 'uint16';
np.uint32 = 'uint32';
np.uint64 = 'uint64';
np.float = 'float32';
np.float16 = 'float16';  // Not supported.
np.float32 = 'float32';
np.float64 = 'float64';
np.unicode = 'unicode';


/**
 * Given a string of dtype, return appropriate dtype name.
 * @param {string} value - string representation of dtype.
 * @returns {string} full dtype name
 */
np.dtype = function(value) {
    if (value == 'int') {
        return np.int;
    } else if (value == 'uint') {
        return np.uint;
    } else if (value == 'float') {
        return np.float;
    } else if (value == 'unicode') {
        return np.unicode;
    } else if (np.dtype.all.indexOf(value) >= 0) {
        return value;
    } else if (np.dtype.str_to_dtype[value] !== undefined) {
        return np.dtype.str_to_dtype[value];
    } else {
        throw new Error('invalid dtype ' + value);
    }
};


np.dtype.all = [
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
np.dtype.str_to_dtype = {};
np.dtype.str_to_dtype.b = np.int8;
np.dtype.str_to_dtype.b1 = np.bool;
np.dtype.str_to_dtype.i = np.int;
np.dtype.str_to_dtype.i1 = np.int8;
np.dtype.str_to_dtype.i2 = np.int16;
np.dtype.str_to_dtype.i4 = np.int32;
np.dtype.str_to_dtype.i8 = np.int64;
np.dtype.str_to_dtype.L = np.uint;
np.dtype.str_to_dtype.u1 = np.uint8;
np.dtype.str_to_dtype.u2 = np.uint16;
np.dtype.str_to_dtype.u4 = np.uint32;
np.dtype.str_to_dtype.u8 = np.uint64;
np.dtype.str_to_dtype.f = np.float;
np.dtype.str_to_dtype.f2 = np.float16;  // not supported
np.dtype.str_to_dtype.f4 = np.float32;
np.dtype.str_to_dtype.f8 = np.float64;
np.dtype.str_to_dtype.U = np.unicode;


// Set mapping from dtype to typed array constructors.
/* globals BigInt64Array */
/* globals BigUint64Array */
np.dtype.arraybuffer = {};
if (typeof Uint8Array != 'undefined')
    np.dtype.arraybuffer[np.bool] = Uint8Array;
else
    np.dtype.arraybuffer[np.bool] = undefined;
if (typeof Int8Array != 'undefined')
    np.dtype.arraybuffer[np.int8] = Int8Array;
else
    np.dtype.arraybuffer[np.int8] = undefined;
if (typeof Int16Array != 'undefined')
    np.dtype.arraybuffer[np.int16] = Int16Array;
else
    np.dtype.arraybuffer[np.int16] = undefined;
if (typeof Int32Array != 'undefined')
    np.dtype.arraybuffer[np.int32] = Int32Array;
else
    np.dtype.arraybuffer[np.int32] = undefined;
if (typeof BigInt64Array != 'undefined')
    np.dtype.arraybuffer[np.int64] = BigInt64Array;
else
    np.dtype.arraybuffer[np.int64] = undefined;
if (typeof Uint8Array != 'undefined')
    np.dtype.arraybuffer[np.uint8] = Uint8Array;
else
    np.dtype.arraybuffer[np.uint8] = undefined;
if (typeof Uint16Array != 'undefined')
    np.dtype.arraybuffer[np.uint16] = Uint16Array;
else
    np.dtype.arraybuffer[np.uint16] = undefined;
if (typeof Uint32Array != 'undefined')
    np.dtype.arraybuffer[np.uint32] = Uint32Array;
else
    np.dtype.arraybuffer[np.uint32] = undefined;
if (typeof BigUint64Array != 'undefined')
    np.dtype.arraybuffer[np.uint64] = BigUint64Array;
else
    np.dtype.arraybuffer[np.uint64] = undefined;
if (typeof Float32Array != 'undefined')
    np.dtype.arraybuffer[np.float32] = Float32Array;
else
    np.dtype.arraybuffer[np.float32] = undefined;
if (typeof Float64Array != 'undefined')
    np.dtype.arraybuffer[np.float64] = Float64Array;
else
    np.dtype.arraybuffer[np.float64] = undefined;
np.dtype.arraybuffer[np.unicode] = undefined;


// Lookup table to an Array of castable dtypes.
np.castable_types = {};
np.castable_types[np.bool] = [
    np.bool, np.int8, np.int16, np.int32, np.int64, np.uint8, np.uint16, np.uint32,
    np.float32, np.float64
];
np.castable_types[np.int8] = [
    np.int8, np.int16, np.int32, np.int64, np.float32, np.float64
];
np.castable_types[np.int16] = [
    np.int16, np.int32, np.int64, np.float32, np.float64
];
np.castable_types[np.int32] = [np.int32, np.int64, np.float32, np.float64];
np.castable_types[np.int64] = [np.int64, np.float64];
np.castable_types[np.uint8] = [
    np.int16, np.int32, np.int64, np.uint8, np.uint16, np.uint32, np.uint64, np.float32,
    np.float64
];
np.castable_types[np.uint16] = [
    np.int32, np.int64, np.uint16, np.uint32, np.uint64, np.float32, np.float64
];
np.castable_types[np.uint32] = [np.int64, np.uint32, np.uint64, np.float64 ];
np.castable_types[np.uint64] = [np.uint64];
np.castable_types[np.float32] = [np.float32, np.float64];
np.castable_types[np.float64] = [np.float64];


// Return True if cast can be done without overflow or truncation.
np.can_cast = function(from_dtype, to_dtype) {
    return np.castable_types[from_dtype].indexOf(to_dtype) >= 0;
};  // np.can_cast


module.exports = np;
