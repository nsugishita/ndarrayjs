(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.dtype = definition();
    }
}(this, function () {
    "use strict";

    var exported = {};

    exported._set_alias = function(np) {
        np.bool = exported.bool;
        np.int = exported.int;
        np.int8 = exported.int8;
        np.int16 = exported.int16;
        np.int32 = exported.int32;
        np.int64 = exported.int64;
        np.uint = exported.uint;
        np.uint8 = exported.uint8;
        np.uint16 = exported.uint16;
        np.uint32 = exported.uint32;
        np.uint64 = exported.uint64;
        np.float = exported.float;
        np.float16 = exported.float16;
        np.float32 = exported.float32;
        np.float64 = exported.float64;
        np.unicode = exported.unicode;
    };

    // Define dtypes.
    // dtypes and its string representaion is described in the documentation:
    // https://docs.scipy.org/doc/numpy/reference/arrays.dtypes.html
    exported.bool = 'bool';
    exported.int = 'int32';
    exported.int8 = 'int8';
    exported.int16 = 'int16';
    exported.int32 = 'int32';
    exported.int64 = 'int64';
    exported.uint = 'uint32';
    exported.uint8 = 'uint8';
    exported.uint16 = 'uint16';
    exported.uint32 = 'uint32';
    exported.uint64 = 'uint64';
    exported.float = 'float32';
    exported.float16 = 'float16';  // Not supported.
    exported.float32 = 'float32';
    exported.float64 = 'float64';
    exported.unicode = 'unicode';

    /**
     * Given a string of dtype, return appropriate dtype name.
     * @param {string} value - string representation of dtype.
     * @returns {string} full dtype name
     */
    exported.get = function(value) {
        if (value == 'int') {
            return exported.int;
        } else if (value == 'uint') {
            return exported.uint;
        } else if (value == 'float') {
            return exported.float;
        } else if (value == 'unicode') {
            return exported.unicode;
        } else if (exported.all.indexOf(value) >= 0) {
            return value;
        } else if (exported.char_to_dtype[value] !== undefined) {
            return exported.char_to_dtype[value];
        } else {
            throw new Error('invalid dtype ' + value);
        }
    };

    exported.all = [
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
    exported.char_to_dtype = {};
    exported.char_to_dtype.b = exported.int8;
    exported.char_to_dtype.b1 = exported.bool;
    exported.char_to_dtype.i = exported.int;
    exported.char_to_dtype.i1 = exported.int8;
    exported.char_to_dtype.i2 = exported.int16;
    exported.char_to_dtype.i4 = exported.int32;
    exported.char_to_dtype.i8 = exported.int64;
    exported.char_to_dtype.L = exported.uint;
    exported.char_to_dtype.u1 = exported.uint8;
    exported.char_to_dtype.u2 = exported.uint16;
    exported.char_to_dtype.u4 = exported.uint32;
    exported.char_to_dtype.u8 = exported.uint64;
    exported.char_to_dtype.f = exported.float;
    exported.char_to_dtype.f2 = exported.float16;  // not supported
    exported.char_to_dtype.f4 = exported.float32;
    exported.char_to_dtype.f8 = exported.float64;
    exported.char_to_dtype.U = exported.unicode;

    // Set mapping from dtype to typed array constructors.
    /* globals BigInt64Array */
    /* globals BigUint64Array */
    exported.arraybuffer = {};
    if (typeof Uint8Array != 'undefined')
        exported.arraybuffer[exported.bool] = Uint8Array;
    else
        exported.arraybuffer[exported.bool] = undefined;
    if (typeof Int8Array != 'undefined')
        exported.arraybuffer[exported.int8] = Int8Array;
    else
        exported.arraybuffer[exported.int8] = undefined;
    if (typeof Int16Array != 'undefined')
        exported.arraybuffer[exported.int16] = Int16Array;
    else
        exported.arraybuffer[exported.int16] = undefined;
    if (typeof Int32Array != 'undefined')
        exported.arraybuffer[exported.int32] = Int32Array;
    else
        exported.arraybuffer[exported.int32] = undefined;
    if (typeof BigInt64Array != 'undefined')
        exported.arraybuffer[exported.int64] = BigInt64Array;
    else
        exported.arraybuffer[exported.int64] = undefined;
    if (typeof Uint8Array != 'undefined')
        exported.arraybuffer[exported.uint8] = Uint8Array;
    else
        exported.arraybuffer[exported.uint8] = undefined;
    if (typeof Uint16Array != 'undefined')
        exported.arraybuffer[exported.uint16] = Uint16Array;
    else
        exported.arraybuffer[exported.uint16] = undefined;
    if (typeof Uint32Array != 'undefined')
        exported.arraybuffer[exported.uint32] = Uint32Array;
    else
        exported.arraybuffer[exported.uint32] = undefined;
    if (typeof BigUint64Array != 'undefined')
        exported.arraybuffer[exported.uint64] = BigUint64Array;
    else
        exported.arraybuffer[exported.uint64] = undefined;
    if (typeof Float32Array != 'undefined')
        exported.arraybuffer[exported.float32] = Float32Array;
    else
        exported.arraybuffer[exported.float32] = undefined;
    if (typeof Float64Array != 'undefined')
        exported.arraybuffer[exported.float64] = Float64Array;
    else
        exported.arraybuffer[exported.float64] = undefined;
    exported.arraybuffer[exported.unicode] = undefined;

    // Lookup table to an Array of castable dtypes.
    exported.castable_types = {};
    exported.castable_types[exported.bool] = [
        exported.bool, exported.int8, exported.int16, exported.int32,
        exported.int64, exported.uint8, exported.uint16,
        exported.uint32, exported.float32, exported.float64
    ];
    exported.castable_types[exported.int8] = [
        exported.int8, exported.int16, exported.int32, exported.int64,
        exported.float32, exported.float64
    ];
    exported.castable_types[exported.int16] = [
        exported.int16, exported.int32, exported.int64, exported.float32,
        exported.float64
    ];
    exported.castable_types[exported.int32] = [
        exported.int32, exported.int64, exported.float32, exported.float64
    ];
    exported.castable_types[exported.int64] = [exported.int64, exported.float64];
    exported.castable_types[exported.uint8] = [
        exported.int16, exported.int32, exported.int64, exported.uint8,
        exported.uint16, exported.uint32, exported.uint64,
        exported.float32, exported.float64
    ];
    exported.castable_types[exported.uint16] = [
        exported.int32, exported.int64, exported.uint16, exported.uint32,
        exported.uint64, exported.float32, exported.float64
    ];
    exported.castable_types[exported.uint32] = [
        exported.int64, exported.uint32, exported.uint64, exported.float64
    ];
    exported.castable_types[exported.uint64] = [exported.uint64];
    exported.castable_types[exported.float32] = [exported.float32, exported.float64];
    exported.castable_types[exported.float64] = [exported.float64];

    // Return True if cast can be done without overflow or truncation.
    exported.can_cast = function(from_dtype, to_dtype) {
        return exported.castable_types[from_dtype].indexOf(to_dtype) >= 0;
    };  // can_cast

    return exported;
}));
