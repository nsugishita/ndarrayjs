(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.np = definition();
    }
}(this, function () {
    "use strict";

    let np = {};

    // preparation {{{

    /**
     * Extend an object with another object.
     * This recursively copies items in one object to the other one.
     * This is an inplce operation.
     * @param {object} dest - object on which items are copied.
     * @param {object} src - object from which items are copied.
     */
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
    }  // extend

    // preparation }}}

    (function() {  // np.ndarray {{{
        /**
         * Return a new ndarray instance with given data.
         * This create a new ndarray instance.  Given data is copied and stored
         * in the new ndarray instance.
         * @param {buffer|Array|ndarray} buffer - Object holding data.
         * @param {int[]} shape - Shape of created array.
         * @param {string} dtype - Data type of elements.
         * @returns {ndarray} New ndarray.
         */
        np.array = function(buffer, shape, dtype) {
            throw new Error('not yet implemented');
        };


        /**
         * Return an ndarray instance.
         * This return an ndarray instance.  If possible, data is not copied so
         * a returned array shares data with the original array.
         * @param {buffer|Array|ndarray} buffer - Object holding data.
         * @param {int[]} shape - Shape of created array.
         * @param {string} dtype - Data type of elements.
         * @returns {ndarray} ndarray.
         */
        np.asarray = function(buffer, shape, dtype) {
            return ndarray(shape, dtype, buffer);
        };


        /**
         * Array object to represent a multidimensional, homogeneous array.
         * This is not supposed to be called by a user.  Use np.array or
         * np.asarray to create a new array from a buffer/Array.
         * For developers, this is not supposed to be called
         * with new operator (it does not harm but it is pointless).
         * This returns a callable instance, which inherit ndarray if possible.
         * @param {int[]} shape - Shape of created array.
         * @param {string} dtype - Data type of elements.
         * @param {buffer|Array|ndarray} buffer - Object holding data.
         * @param {int} [offset=0] - Offset of array data in buffer.
         * @param {int[]} [stride] - Strides of data in memory.
         * @param {bool} [check=true] - Check whether given data is consistent or not.
         * @returns {ndarray} A new array with given data.
         */
        let ndarray = function(shape, dtype, buffer, offset, stride, check) {
            offset = (offset === undefined) ? 0 : offset;
            check = (check === undefined) ? true : check;
            // If we want to use the attribute in this function,
            // we cannot use this, but we can refere by instance.xxx.
            let instance = function() {
                let index = Array.prototype.slice.call(arguments);
                return index;
            };

            if (np.helper.get_mode() == 'es6') {
                // instance.__proto__ = ndarray.prototype;
                Object.setPrototypeOf(instance, ndarray.prototype);
            } else {
                // If __proto__ is not available, copy
                // the methods defined on ndarray.prototype naively.
                let keys = Object.keys(ndarray.prototype);
                for (let i=0; i<keys.length; i++) {
                    instance[keys[i]] = ndarray.prototype[keys[i]];
                }
            }

            /* Raise if shape is invalid for underlying data. */
            function check_shape(shape) {
                let size = from_shape_to_size(shape);
                if (size != instance.buffer.length) {
                    throw new Error(
                        'invalid shape shape [' + shape + '] for buffer of length ' +
                        buffer.length
                    );
                }
            }

            if (stride == undefined) {
                let tmp = 1;
                stride = [];
                for (let i=0; i<shape.length; i++) {
                    stride.splice(0, 0, tmp);
                    tmp *= shape[shape.length-i-1];
                }
            }

            instance._shape = shape;
            instance.dtype = dtype;
            instance.buffer = buffer;
            instance.offset = offset;
            instance.stride = stride;
            instance.__ndarray__ = true;

            if (check) {
                check_shape(shape);
            }

            // Seems we can't copy setters/getters from prototype
            // when __proto__ is not available.
            // To be safe, let's define them here.
            Object.defineProperty(instance, 'shape', {
                set: function(shape) {
                    check_shape(shape);
                    this._shape = shape;
                },
                get: function() {
                    return this._shape;
                }
            });

            Object.defineProperty(instance, 'size', {
                get: function() {
                    return from_shape_to_size(this.shape);
                }
            });

            Object.defineProperty(instance, 'ndim', {
                get: function() {
                    return this.shape.length;
                }
            });

            return instance;
        };  // ndarray


        ndarray.prototype = Object.create(Function.prototype);

        /**
         * Dump contents of an array to console.
         */
        ndarray.prototype.dump = function() {
            console.log(this.dumps());
        };

        /**
         * Dump contents of an array as a string.
         * @returns {string} Content of the array.
         */
        ndarray.prototype.dumps = function() {
            return '[' + String(this.buffer) + ']';
        };

        ndarray.prototype.toString = function() {
            let shapestr = this.shape.join(',');
            if (this.shape.length <= 1) {
                shapestr += ',';
            }
            return 'array(shape=(' + shapestr + '), dtype=' + this.dtype + ')';
        };

        // Only expose ndarray in es6 mode.
        Object.defineProperty(np, 'ndarray', {
            get: function() {
                if (np.helper.get_mode() == 'es6') {
                    return ndarray;
                } else {
                    return undefined;
                }
            }
        });

        np.isndarray = function(a) {
            return a.__ndarray__ !== undefined;
        };

        /**
         * Compute size from a shape.
         * @param {int[]} shape - Shape of an array.
         * @returns {int} Computed size, namely the number of elements.
         */
        let from_shape_to_size = function(shape) {
            let tmp = 1;
            for (let i=0; i<shape.length; i++) {
                tmp *= shape[i];
            }
            return tmp;
        };
    })();  // ndarray }}}

    (function() {  // np.dtype {{{
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
            } else if (np.dtype.char_to_dtype[value] !== undefined) {
                return np.dtype.char_to_dtype[value];
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
        np.dtype.char_to_dtype = {};
        np.dtype.char_to_dtype.b = np.int8;
        np.dtype.char_to_dtype.b1 = np.bool;
        np.dtype.char_to_dtype.i = np.int;
        np.dtype.char_to_dtype.i1 = np.int8;
        np.dtype.char_to_dtype.i2 = np.int16;
        np.dtype.char_to_dtype.i4 = np.int32;
        np.dtype.char_to_dtype.i8 = np.int64;
        np.dtype.char_to_dtype.L = np.uint;
        np.dtype.char_to_dtype.u1 = np.uint8;
        np.dtype.char_to_dtype.u2 = np.uint16;
        np.dtype.char_to_dtype.u4 = np.uint32;
        np.dtype.char_to_dtype.u8 = np.uint64;
        np.dtype.char_to_dtype.f = np.float;
        np.dtype.char_to_dtype.f2 = np.float16;  // not supported
        np.dtype.char_to_dtype.f4 = np.float32;
        np.dtype.char_to_dtype.f8 = np.float64;
        np.dtype.char_to_dtype.U = np.unicode;


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
        np.dtype.castable_types = {};
        np.dtype.castable_types[np.bool] = [
            np.bool, np.int8, np.int16, np.int32, np.int64, np.uint8, np.uint16,
            np.uint32, np.float32, np.float64
        ];
        np.dtype.castable_types[np.int8] = [
            np.int8, np.int16, np.int32, np.int64, np.float32, np.float64
        ];
        np.dtype.castable_types[np.int16] = [
            np.int16, np.int32, np.int64, np.float32, np.float64
        ];
        np.dtype.castable_types[np.int32] = [
            np.int32, np.int64, np.float32, np.float64];
        np.dtype.castable_types[np.int64] = [np.int64, np.float64];
        np.dtype.castable_types[np.uint8] = [
            np.int16, np.int32, np.int64, np.uint8, np.uint16, np.uint32, np.uint64,
            np.float32, np.float64
        ];
        np.dtype.castable_types[np.uint16] = [
            np.int32, np.int64, np.uint16, np.uint32, np.uint64, np.float32, np.float64
        ];
        np.dtype.castable_types[np.uint32] = [
            np.int64, np.uint32, np.uint64, np.float64 ];
        np.dtype.castable_types[np.uint64] = [np.uint64];
        np.dtype.castable_types[np.float32] = [np.float32, np.float64];
        np.dtype.castable_types[np.float64] = [np.float64];


        // Return True if cast can be done without overflow or truncation.
        np.dtype.can_cast = function(from_dtype, to_dtype) {
            return np.dtype.castable_types[from_dtype].indexOf(to_dtype) >= 0;
        };  // np.can_cast
    })();  // np.dtype }}}

    (function() {  // np.helper {{{
        np.helper = {};

        /**
         * Version number of IE or 0 in another browser or node.
         * https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie
         */
        np.helper.msieversion = (function() {
            if (typeof window == 'undefined') {
                // This is not running in a browser (i.e. this is Node.js).
                return 0;
            }

            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");

            if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
                // If Internet Explorer, return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
            } else {
                // If another browser, return 0
                return 0;
            }
        })();


        /* True if es6 __proto__ is available. */
        np.helper.is_es6_supported =
            (np.helper.msieversion == 0 || np.helper.msieversion == 11);


        /**
         * Return the current runtime mode.
         * To change the mode, use np.helper.es5mode or np.helper.es6mode.
         * @returns {string} Current runtime mode, 'es6' or 'es5'.
         */
        np.helper.get_mode = function() {
            return mode;
        };


        /**
         * Switch to ES6-free routines.
         */
        np.helper.es5mode = function() {
            mode = 'es5';
        };  // np.helper.es5mode


        /**
         * Switch to ES6-leveraged routines.
         * This throws an error if one call this method on non-compatible environement,
         * such as IE of version 10 or earlier.
         */
        np.helper.es6mode = function() {
            if (0 < np.helper.msieversion && np.helper.msieversion < 11) {
                throw new Error('not supported on this runtime.');
            }
            mode = 'es6';
        };  // np.helper.es5mode


        /* Store the current runtime mode. */
        let mode = np.helper.is_es6_supported ? 'es6' : 'es5';

        np.helper.is_array_buffer_supported =
            (np.helper.msieversion == 0 || np.helper.msieversion >= 10);
    })();  // np_helper }}}

    (function() {  // np.testing {{{
        /**
         * Define utilities to assert quickly.
         * Functions defined on this object accept options object.
         * If options.assert is defined, it is assumed to be an
         * assertion in qunit.  Otherwise, javascript native Error
         * is thrown.
         */
        np.testing = {};


        /**
         * Assert a given object can be casted to an ndarray.
         * This returns true if the given object is an ndarray
         * or a javascript native Array with number/NaN/Infinity
         * (namely, object which typeof returns 'number') and
         * a valid shape./ This fails, for example, on [{}, 4]
         * or [[2, 3], 4].
         */
        np.testing.assert_arraylike = function(x, options) {
            options = options || {};
            let assert = options.assert;
            let exit_hook = () => {};
            if (assert !== undefined && options._nested_call === undefined) {
                exit_hook = () => assert.ok(true, 'given object is array-like');
            }

            if (x.__ndarray__ !== undefined) {
                // If this is already an ndarray.
                exit_hook();
                return;
            } else if (!Array.isArray(x)) {
                // Or this is not an Array.
                let msg = 'non array object';
                if (assert) {
                    assert.ok(false, msg);
                    return;
                } else {
                    throw new Error(msg);
                }
            } else if (x.length == 0) {
                // If this is an empty array, return true now.
                exit_hook();
                return;
            }

            try {
                np.testing.get_nested_array_shape(x, {throw_if_fail: true});
            } catch(e) {
                if (assert) {
                    assert.ok(false, e.message);
                    return;
                } else {
                    throw e;
                }
            }

            exit_hook();
        };  // np.testing.assert_arraylike


        /**
         * Assert all elements are close.
         */
        np.testing.assert_allclose = function(x, y, options) {
            options = options || {};
            let assert = options.assert;
            let rtol = "rtol" in options ? options.rtol : 1e-5;
            let atol = "atol" in options ? options.atol : 1e-8;

            let exit_hook = () => {};
            if (assert !== undefined && options._nested_call === undefined) {
                exit_hook = () => assert.ok(true, 'given objects are close');
            }
            let fail_hook;
            if (assert) {
                fail_hook = (msg) => {assert.ok(false, msg);};
            } else {
                fail_hook = (msg) => {throw new Error(msg);};
            }

            options._nested_call = true;
            if (_NumberisNaN(x) && _NumberisNaN(y)) {
                exit_hook();
                return;
            } else if (x === undefined && y === undefined) {
                exit_hook();
                return;
            } else if (x === null && y === null) {
                exit_hook();
                return;
            } else if (x === Infinity && y === Infinity) {
                exit_hook();
                return;
            } else if (x === -Infinity && y === -Infinity) {
                exit_hook();
                return;
            } else if (x === Infinity && y !== Infinity) {
                fail_hook('x is Infinity but y is ' + y);
                return;
            } else if (x === -Infinity && y !== -Infinity) {
                fail_hook('x is -Infinity but y is ' + y);
                return;
            } else if (x !== Infinity && y === Infinity) {
                fail_hook('x is ' + x + ' but y is Infinity');
                return;
            } else if (x !== -Infinity && y === -Infinity) {
                fail_hook('x is ' + x + ' but y is -Infinity');
                return;
            } else if (_NumberisNaN(x) && !_NumberisNaN(y)) {
                fail_hook('x is NaN but y is ' + (typeof y));
                return;
            } else if (!_NumberisNaN(x) && _NumberisNaN(y)) {
                fail_hook('x is ' + (typeof x) + ' but y is NaN');
                return;
            } else if (typeof x != typeof y) {
                fail_hook('x is ' + (typeof x) + ' but y is ' + (typeof y));
                return;
            } else if (x.__ndarray__ !== undefined) {
                np.testing.assert_ndarray_allclose(x, y, options);
                exit_hook();
                return;
            } else if (Array.isArray(x)) {
                if (x.length != y.length) {
                    fail_hook(
                        'x has length ' + x.length + ' but y has length ' + y.length);
                    return;
                }
                for (let i=0; i<x.length; i++) {
                    try {
                        np.testing.assert_allclose(x[i], y[i], options);
                    } catch(e) {
                        fail_hook(
                            'element ' + i + ' is not close.  ' + x[i] + ' vs ' + y[i]);
                        return;
                    }
                }
                exit_hook();
                return;
            } else if (typeof x == 'number') {
                if (Math.abs(x - y) <= (atol + rtol * Math.abs(y))) {
                    exit_hook();
                    return;
                } else {
                    fail_hook('given number is not close');
                    return;
                }
            } else if (x.__eq__ !== undefined) {
                if (x.__eq__(y)) {
                    exit_hook();
                    return;
                } else {
                    fail_hook('x.__eq__(y) return false');
                    return;
                }
            } else {
                if (x == y) {
                    exit_hook();
                    return;
                } else {
                    fail_hook('x and y are objects and x != y');
                    return;
                }
            }

            exit_hook();
        };  // np.testing.assert_allclose


        /* Compare two arrays up to a given tolerance. */
        np.testing.assert_ndarray_allclose = function(x, y, options) {
            options = options || {};
            let rtol = "rtol" in options ? options.rtol : 1e-5;
            let atol = "atol" in options ? options.atol : 1e-8;

            function isclose(x, y) {
                if (x === Infinity && y === Infinity) {
                    return true;
                } else if (x === -Infinity && y === -Infinity) {
                    return true;
                } else {
                    return (Math.abs(x - y) <= (atol + rtol * Math.abs(y)));
                }
            }

            if (np.isscalar(x) & np.isscalar(y)) {
                if (!isclose(x, y)) {
                    let msg =
                        "given scalars does not match.  " + String(x) + " != " +
                        String(y);
                    if ("assert" in options) {
                        let assert = options.assert;
                        assert.equal(x, y, msg);
                    } else {
                        throw new Error(msg);
                    }
                }
                return;
            }

            x = np.asarray(x);
            y = np.asarray(y);
            if (x.shape.length != y.shape.length) {
                if ("assert" in options) {
                    let assert = options.assert;
                    assert.equal(x.shape.length, y.shape.length, "dimension mismatch");
                    return;
                } else {
                    throw new Error("dimension mismatch");
                }
            }
            let is_same_shape = true;
            for (let i=0; i<x.shape.length; i++) {
                if (x.shape[i] != y.shape[i]) {
                    is_same_shape = false;
                    break;
                }
            }
            if (!is_same_shape) {
                let msg = "shape mismatch.  [" + x.shape + "] vs ["  + y.shape + "]";
                if ("assert" in options) {
                    let assert = options.assert;
                    assert.ok(false, msg);
                    return;
                } else {
                    throw new Error(msg);
                }
            }

            for (let i=0; i<x.buffer.length; i++) {
                let _a = x.buffer[i];
                let _b = y.buffer[i];
                if (Math.abs(_a - _b) > (atol + rtol * Math.abs(_b))) {
                    // TODO
                    // let indices =
                    //     Array(...itertools.product(...x.shape.map(i => itertools.range(i))));
                    //
                    // let msg = "different elements at (" + indices[i] + ")";
                    let msg = "element at (" + i + ") is not close";
                    if ("assert" in options) {
                        let assert = options.assert;
                        assert.equal(x.buffer[i], y.buffer[i], msg);
                        return;
                    } else {
                        throw new Error(msg);
                    }
                }
            }

            if ("assert" in options) {
                let assert = options.assert;
                assert.ok(true, "both arrays are equal up to the given tolerance");
            }
        };  // np.testing.assert_ndarray_allclose


        /* Make a shallow copy of options. */
        np.testing.copy_options = function(options) {
            return Object.assign({}, options);
        };  // np.testing.copy_options


        /* Return a shape of a nested javascript Array. */
        np.testing.get_nested_array_shape = function(array, options) {
            options = options || {};
            let allow_empty = options.allow_empty || false;
            let throw_if_fail = options.throw_if_fail || false;

            let is_number_or_boolean = function(x) {
                return typeof x == 'number' || typeof x == 'boolean';
            };

            let is_number_or_array_or_boolean = function(x) {
                return (
                    Array.isArray(x) || typeof x == 'number' || typeof x == 'boolean'
                );
            };

            // This returns a nested array's shape or raise.
            let impl = function(array) {
                if (!Array.isArray(array)) {
                    throw new Error('not an array');
                } else if (array.length == 0) {
                    // This is an empty array.
                    if (allow_empty) {
                        return [];
                    } else {
                        throw new Error('empty array');
                    }
                } else if (array.every(is_number_or_boolean)) {
                    // This is a flat array.
                    return [array.length];
                } else if (array.every(Array.isArray)) {
                    let shape = impl(array[0]);
                    for (let i=1; i<array.length; i++) {
                        let this_shape = impl(array[i]);
                        if (shape.length != this_shape.length) {
                            throw new Error('subarrays shape mismatch');
                        }
                        for (let j=0; j<shape.length; j++) {
                            if (shape[j] != this_shape[j]) {
                                throw new Error('subarrays shape mismatch');
                            }
                        }
                    }
                    if (shape.length == 0) {
                        // subarrays are []s.  Return an empty shape.
                        return [];
                    } else {
                        return [array.length].concat(shape);
                    }
                } else if (array.every(is_number_or_array_or_boolean)) {
                    let type = [];
                    for (let i=0; i<array.length; i++) {
                        if (Array.isArray(array[i])) {
                            type.push('array');
                        } else {
                            type.push(typeof array[i]);
                        }
                    }
                    throw new Error('mixed numeric and arrays: [' + type + '].');
                } else {
                    let type = [];
                    for (let i=0; i<array.length; i++) {
                        if (Array.isArray(array[i])) {
                            type.push('array');
                        } else {
                            type.push(typeof array[i]);
                        }
                    }
                    throw new Error('invalid objects: [' + type + '].');
                }
            };  // impl

            if (throw_if_fail) {
                return impl(array);
            }
            try {
                return impl(array);
            } catch(e) {
                return;
            }
        };  // np.testing.get_nested_array_shape


        let _NumberisNaN = function(a) {
            return a !== a;
        };


        return np;
    })();  // np_testing }}}

    return np;
}));
