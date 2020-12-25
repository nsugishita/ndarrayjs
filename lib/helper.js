(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.helper = definition();
    }
}(this, function () {
    "use strict";

    var exported = {};

    /**
     * Version number of IE or 0 in another browser or node.
     * https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie
     */
    exported.msieversion = (function() {
        if (typeof window == 'undefined') {
            // This is not running in a browser (i.e. this is Node.js).
            return 0;
        }
        var ua = window.navigator.userAgent.toLowerCase();
        if (ua.match(/trident.*rv\:11\./)) {
            return 11;
        } else if (ua.indexOf('msie')> 0) {
            // If Internet Explorer, return version number
            return parseInt(ua.split('msie')[1]);
        } else {
            // If another browser, return 0
            return 0;
        }
    })();


    /* True if es6 __proto__ is available. */
    exported.is_es6_supported =
        (exported.msieversion == 0 || exported.msieversion == 11);


    // Maybe we should change the name of the mode.
    // Typed arrays are added in es6 so it might be confusing.
    /**
     * Return the current runtime mode.
     * To change the mode, use exported.es5mode or exported.es6mode.
     * @returns {string} Current runtime mode, 'es6' or 'es5'.
     */
    exported.get_mode = function() {
        return mode;
    };


    /**
     * Switch to ES6-free routines.
     */
    exported.es5mode = function() {
        mode = 'es5';
    };  // exported.es5mode


    /**
     * Switch to ES6-leveraged routines.
     * This throws an error if one call this method on non-compatible environement,
     * such as IE of version 10 or earlier.
     */
    exported.es6mode = function() {
        if (0 < exported.msieversion && exported.msieversion < 11) {
            throw new Error('not supported on this runtime.');
        }
        mode = 'es6';
    };  // exported.es5mode


    /* Store the current runtime mode. */
    var mode = exported.is_es6_supported ? 'es6' : 'es5';

    exported.is_array_buffer_supported =
        (exported.msieversion == 0 || exported.msieversion >= 10);

    var use_arraybuffer = exported.is_array_buffer_supported;
    exported.use_arraybuffer = function(value) {
        if (value === undefined) {
            return use_arraybuffer;
        } else {
            use_arraybuffer = Boolean(value);
        }
    };

    /**
     * Return true if a given object is NaN.
     * This is equivalent to Number.isNaN, if it's available.
     * @param {object} value
     * @returns {Boolean}
     */
    exported.isNaN = Number.isNaN || function(value) {
        return value !== value;
    };  // exported.isNaN

    /**
     * Returns the integer part of a number by removing any fractional digits.
     * This is equivalent to Number.trunc, if it's available.
     * @param {Number} v
     * @returns {Number} i
     */
    exported.trunc = Number.trunc || function(v) {
        return v < 0 ? Math.ceil(v) : Math.floor(v);
    };  // exported.trunc

    /**
     * Determine whether the passed value is an integer.
     * This is equivalent to Number.isInteger, if it's available.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
     */
    exported.isInteger = Number.isInteger || function(value) {
        return typeof value === 'number' &&
                isFinite(value) &&
                Math.floor(value) === value;
    };  // exported.isInteger

    exported.Arrayfrom = (function(arrayLike) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        // Production steps of ECMA-262, Edition 6, 22.1.2.1
        if (Array.from) {
            return Array.from;
        } else {
            var toStr = Object.prototype.toString;
            var isCallable = function (fn) {
                return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
            };
            var toInteger = function (value) {
                var number = Number(value);
                if (isNaN(number)) { return 0; }
                if (number === 0 || !isFinite(number)) { return number; }
                return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
            };
            var maxSafeInteger = Math.pow(2, 53) - 1;
            var toLength = function (value) {
                var len = toInteger(value);
                return Math.min(Math.max(len, 0), maxSafeInteger);
            };

            // The length property of the from method is 1.
            return function from(arrayLike/*, mapFn, thisArg */) {
                // 1. Let C be the this value.
                var C = this;

                // 2. Let items be ToObject(arrayLike).
                var items = Object(arrayLike);

                // 3. ReturnIfAbrupt(items).
                if (arrayLike == null) {
                    throw new TypeError('Array.from requires an array-like object - not null or undefined');
                }

                // 4. If mapfn is undefined, then let mapping be false.
                var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
                var T;
                if (typeof mapFn !== 'undefined') {
                    // 5. else
                    // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                    if (!isCallable(mapFn)) {
                        throw new TypeError('Array.from: when provided, the second argument must be a function');
                    }

                    // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                    if (arguments.length > 2) {
                        T = arguments[2];
                    }
                }

                // 10. Let lenValue be Get(items, "length").
                // 11. Let len be ToLength(lenValue).
                var len = toLength(items.length);

                // 13. If IsConstructor(C) is true, then
                // 13. a. Let A be the result of calling the [[Construct]] internal method
                // of C with an argument list containing the single item len.
                // 14. a. Else, Let A be ArrayCreate(len).
                var A = isCallable(C) ? Object(new C(len)) : new Array(len);

                // 16. Let k be 0.
                var k = 0;
                // 17. Repeat, while k < len… (also steps a - h)
                var kValue;
                while (k < len) {
                    kValue = items[k];
                    if (mapFn) {
                        A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                    } else {
                        A[k] = kValue;
                    }
                    k += 1;
                }
                // 18. Let putStatus be Put(A, "length", len, true).
                A.length = len;
                // 20. Return A.
                return A;
            };
        }
    })();  // exported.Arrayfrom

    if (exported.msieversion > 0) {
        /**
         * Determine whether the passed value is a TypedArray.
         */
        exported.isTypedArray = function(value) {
            // This is not very precise test but anyway...
            return exported.is_array_buffer_supported &&
                    (value.byteLength !== undefined);
        };  // exported.isTypedArray
    } else {
        var TypedArray = Object.getPrototypeOf(Int32Array);
        /**
         * Determine whether the passed value is a TypedArray.
         */
        exported.isTypedArray = function(value) {
            return exported.is_array_buffer_supported &&
                    (value instanceof TypedArray);
        };  // exported.isTypedArray
    }

    /**
     * Return a shape of a nested javascript Array.
     * `options` may have the following properties:
     *  - allow_empty : Boolean, default false
     *      If true, this allows an empty array [].
     *  - throw_if_fail : Boolean, default false
     *      If true, this throws an Error if a given array does
     *      not have an appropriate nested structure.
     *      If false, this returns undefined.
     * @param {object[]} array
     * @param {object} [options]
     * @returns {object[]}
     */
    exported.get_nested_array_shape = function(array, options) {
        options = options || {};
        var allow_empty = options.allow_empty || false;
        var throw_if_fail = options.throw_if_fail || false;
        var type, i;

        var is_number_or_boolean = function(x) {
            return typeof x == 'number' || typeof x == 'boolean';
        };

        var is_number_or_array_or_boolean = function(x) {
            return (
                Array.isArray(x) || typeof x == 'number' || typeof x == 'boolean'
            );
        };

        // This returns a nested array's shape or raise.
        var impl = function(array) {
            var i, j, shape, this_shape;
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
                shape = impl(array[0]);
                for (i=1; i<array.length; i++) {
                    this_shape = impl(array[i]);
                    if (shape.length != this_shape.length) {
                        throw new Error('subarrays shape mismatch');
                    }
                    for (j=0; j<shape.length; j++) {
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
                type = [];
                for (i=0; i<array.length; i++) {
                    if (Array.isArray(array[i])) {
                        type.push('array');
                    } else {
                        type.push(typeof array[i]);
                    }
                }
                throw new Error('mixed numeric and arrays: [' + type + '].');
            } else {
                type = [];
                for (i=0; i<array.length; i++) {
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

    /**
     * Dump a log of a formatted array on the console.
     * There are two signatures:
     * np.dumps(array: np.ndarray, precision: int)
     * np.dumps(array: np.ndarray, width: int, precision: int)
     * This does not support arrays of more than three dimensions.
     */
    exported.dump = function(x, a, b) {
        console.log(exported.dumps(x, a, b));
    };

    /**
     * Returns a formatted string which contains content of this array.
     * There are two signatures:
     * np.dumps(array: np.ndarray, precision: int)
     * np.dumps(array: np.ndarray, width: int, precision: int)
     * This does not support arrays of more than three dimensions.
     */
    exported.dumps = function(x, a, b) {
        var wide;
        var precision;

        var max_precision = 4;
        // This returns the least significant digits below
        // the decimal point, or max_precision, whichever smaller value.
        // For example, if 1.23300 is given, this returns 3,
        // and if 1.00 is given, this returns 0;
        var get_least_significant_digit = function(value) {
            var i = 0;
            var epsilon = 1e-4;
            var x10i;
            for (i = 0; i < max_precision; i++) {
                x10i = value * Math.pow(10, i);
                if (Math.abs(Math.round(x10i) - x10i) < epsilon) {
                    return i;
                }
            }
            return max_precision;
        };
        var i;

        var max_digits;
        var min;
        var ret;
        var val, tmp;

        if (a === undefined) {
            wide = -1;
            precision = -1;
        } else if (b === undefined) {
            wide = -1;
            precision = a;
        } else {
            wide = a;
            precision = b;
        }

        if ((precision == -1) & (np.isndarray(x))) {
            if (x.dtype.indexOf('int') >= 0) {
                precision = 0;
            } else {
                // TODO Use iterator to walk all elements.
                for (i = 0; i < x.buffer.length; i++) {
                    precision = Math.max(
                        precision, get_least_significant_digit(x.buffer[i]));
                }
            }
        } else if (precision == -1) {
            precision = Math.max(precision, get_least_significant_digit(x));
        }

        if (np.isndarray(x)) {
            // If we have BigInt, x causes lots of trouble.
            // For easy fix, convert it to a int32 array.
            x = (x.dtype.indexOf('int') >= 0 ? x.astype(np.int32) : x);
        }

        if (wide == -1) {
            if (np.isndarray(x)) {
                // TODO Don't scan all elements in buffer if it's a view.
                max_digits = Math.max.apply(
                    x.buffer.map(function (x) {
                        return Math.floor(Math.log10(Math.abs(x)));
                    })
                );
                min = Math.min.apply(x.buffer);
                wide = max_digits;
                if (precision > 0)
                    wide += precision + 1;  // fractional parts + decimal point.
                if (min < 0)
                    wide += 1;  // sign.
            } else {
                max_digits = Math.floor(Math.log10(Math.abs(x))) + 1;
                wide = max_digits;
                if (precision > 0)
                    wide += precision + 1;  // fractional parts + decimal point.
                if (x < 0)
                    wide += 1;  // sign.
            }
        }

        if (!(np.isndarray(x))) {
            val = x;
            tmp = val.toFixed(precision);
            if (tmp.length < wide)
                tmp = ' '.repeat(wide - tmp.length) + tmp;
            ret = tmp;
        } else if (x.shape.length == 0) {
            val = x.item();  // TODO
            tmp = val.toFixed(precision);
            if (tmp.length < wide)
                tmp = ' '.repeat(wide - tmp.length) + tmp;
            ret = tmp;
        } else if (x.shape.length == 1) {
            ret = '[';
            for (i = 0; i < x.shape[0]; i++) {
                if (i > 0) {
                    ret += ', ';
                }
                val = x(i);
                tmp = val.toFixed(precision);
                if (tmp.length < wide)
                    tmp = ' '.repeat(wide - tmp.length) + tmp;
                ret += tmp;
            }
            ret += ']';
        } else if (x.shape.length == 2) {
            ret = '[';
            for (i = 0; i < x.shape[0]; i++) {
                if (i > 0)
                    ret += ',\n ';
                ret += exported.dumps(x(i), wide, precision);
            }
            ret += ']';
        } else if (x.shape.length == 3) {
            ret = '[';
            for (i = 0; i < x.shape[0]; i++) {
                if (i > 0)
                    ret += ',\n\n ';
                tmp = exported.dumps(x(i), wide, precision);
                tmp = tmp.replace(/\n/g, '\n ');
                ret += tmp;
            }
            ret += ']';
        } else if (x.shape.length >= 4) {
            throw new Error('not supported an x of more than 2 dimensions');
        }
        return ret;

    };  // exported.dump

    return exported;
}));
