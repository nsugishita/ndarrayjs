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
    // globally exported, namely available as np.xxx as well as np.helper.xxx.
    var gexported = {};

    exported._set_alias = function(np) {
        var key;
        for (key in gexported) {
            np[key] = gexported[key];
        }
    };

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

    exported.is_array_buffer_supported =
        (exported.msieversion == 0 || exported.msieversion >= 10);

    /**
     * If called without arguments, return whether array buffers
     * should be used or not.
     * If called with an argument, overwrite the current mode
     * to the given value.
     * @param {[object]} mode
     * @returns {Boolean}
     */
    var use_arraybuffer_current_mode = exported.is_array_buffer_supported;
    exported.use_arraybuffer = function(value) {
        if (value === undefined) {
            return use_arraybuffer_current_mode;
        } else {
            use_arraybuffer_current_mode = Boolean(value);
            return use_arraybuffer_current_mode;
        }
    };

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

    gexported.nan = NaN;
    gexported.inf = Infinity;
    gexported.None = null;

    /**
     * Return true if a given object is number including nan and infinity.
     * @param {object} value
     * @returns {Boolean}
     */
    gexported.isnumber = function(value) {
        return typeof value === 'number';
    };  // isnumber

    /**
     * Return true if a given object is NaN.
     * This is equivalent to Number.isNaN, if it's available.
     * @param {object} value
     * @returns {Boolean}
     */
    gexported.isnan = Number.isNaN || function(value) {
        return value !== value;
    };  // isnan

    /**
     * Return true if a given object is a finite number.
     * This is equivalent to Number.isFinite, if it's available.
     * @param {object} value
     * @returns {Boolean}
     */
    gexported.isfinite = Number.isFinite || function(value) {
        return typeof value === 'number' && isFinite(value);
    };  // isfinite

    /**
     * Return true if a given object is positive or negative inifinity.
     * @param {object} value
     * @returns {Boolean}
     */
    gexported.isinf = function(value) {
        return (
            (typeof value == 'number') && ((value == Infinity) || (value == -Infinity))
        );
    };  // isinf

    /**
     * Determine whether the passed value is an integer.
     * This is equivalent to Number.isInteger, if it's available.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
     */
    exported.isinteger = Number.isInteger || function(value) {
        return typeof value === 'number' &&
                isFinite(value) &&
                Math.floor(value) === value;
    };  // isinteger

    /**
     * Determine whether the passed value is 0 or 1.
     */
    exported.isbinary = function(value, allow_bool) {
        if (allow_bool)
            return (value == 0) || (value == 1);
        else
            return typeof value === 'number' && ((value == 0) || (value == 1));
    };  // isbinary

    /**
     * Determine whether the passed value is 0 or 1.
     */
    exported.isbool = function(value) {
        return typeof value === 'boolean';
    };  // isboolean

    /**
     * Determine whether the passed value is a positive number, including np.inf.
     */
    exported.ispositive = function(value) {
        return exported.isnumber(value) && (value > 0);
    };  // ispositive

    /**
     * Determine whether the passed value is a nonnegative number, including np.inf.
     */
    exported.isnonnegative = function(value) {
        return exported.isnumber(value) && (value >= 0);
    };  // isnonnegative

    /**
     * Determine whether the passed value is a bigint.
     */
    exported.isbigint = function(value) {
        var typeofa = typeof a;  // linter complains "(typeof a) == 'bigint'".
        return typeofa == 'bigint';
    };  // isbigint

    /**
     * Returns the integer part of a number by removing any fractional digits.
     * This is equivalent to Number.trunc, if it's available.
     * @param {Number} v
     * @returns {Number} i
     */
    exported.trunc = Number.trunc || function(v) {
        return v < 0 ? Math.ceil(v) : Math.floor(v);
    };  // exported.trunc

    var is_float_array = exported.is_float_array = function(a) {
        return (Array.isArray(a) && Array.prototype.every.call(a, exported.isnumber));
    };

    var is_boolean_array = exported.is_boolean_array = function(a) {
        return (Array.isArray(a) && Array.prototype.every.call(a, exported.isbool));
    };

    var is_binary_array = exported.is_binary_array = function(a) {
        return (Array.isArray(a) && Array.prototype.every.call(a, exported.isbinary));
    };

    var is_integer_array = exported.is_integer_array = function(a) {
        return (Array.isArray(a) && Array.prototype.every.call(a, exported.isinteger));
    };

    /**
     * Compute a default stride of a given shape.
     * @param {object[]} shape
     * @returns {object[]} stride
     */
    var default_stride = exported.default_stride = function(shape) {
        var stride = [];
        var buf = 1;
        var i;
        for (i = 0; i < shape.length; i++) {
            stride.splice(0, 0, buf);
            buf *= shape[shape.length - i - 1];
        }
        return stride;
    };

    /**
     * Given a shape, return an iterator to iterate over all elements.
     * @param {int[]} shape
     * @returns {iterator}
     */
    var iterator_from_shape = exported.iterator_from_shape = function(shape) {
        var value = [];
        var i;
        if (!jsarray.allpositive(shape))
            // If some elements are nonpositive, return an iterator which
            // terminates immediately.
            return {
                next: function() {return {done: true};}
            };
        for (i = 0; i < shape.length; i++) {
            value.push(0);
        }
        value[value.length - 1] = -1;
        return {
            value: value,
            done: false,
            next: function() {
                var i, idx, v;
                if (this.done)
                    return {done: true};
                for (i = 0; i < this.value.length; i++) {
                    idx = this.value.length - i - 1;
                    if (this.value[idx] < shape[idx] - 1) {
                        this.value[idx]++;
                        return {
                            value: this.value,
                            done: false
                        };
                    } else {
                        this.value[idx] = 0;
                    }
                }
                this.done = true;
                return {
                    done: true
                };
            }
        };
    };

    // Define some utilities on javascript naitive arrays.
    var jsarray = exported.jsarray = {};

    jsarray.allpositive = function(array) {
        return Array.prototype.every.call(array, exported.ispositive);
    };

    jsarray.allnonnegative = function(array) {
        return Array.prototype.every.call(array, exported.isnonnegative);
    };

    jsarray.neg = function(array) {
        if (is_boolean_array(array)) {
            return array.map(function(x) {return !x;});
        } else {
            return array.map(function(x) {return (x == 0) ? x : -x;});
        }
    };

    jsarray.nonzero = function(array) {
        var i, n = array.length, ret = [];
        for (i = 0; i < n; i++)
            if (array[i] != 0)
                ret.push(i);
        return ret;
    };

    /**
     * Get indexed/sliced elements.
     * `index` must be an Array of int, slice and/or array-like objects.
     * @param {array-like} a - array to be indexed/sliced.
     * @param {(int|string|array-like)[]} index - index.
     * @returns {object|ndarray}
     */
    jsarray.get = function(array, index) {
        // array = jsarray.flatten(array);
        var n;
        var ret = [];
        var i;
        if (index.length == 0) {
            return [];
        } else if (is_boolean_array(index)) {
            // Array of booleans.
            if (array.length != index.length) {
                throw new Error('invalid index size ' + index.length + ' for an array of size ' + array.length);
            }
            n = array.length;
            for (i = 0; i < n; i++) {
                if (index[i])
                    ret.push(array[i]);
            }
            return ret;
        } else if (is_float_array(index)) {
            // Array of numbers.
            n = index.length;
            for (i = 0; i < n; i++) {
                if ((index[i] < -array.length) || (index[i] >= array.length))
                    throw new Error('invalid index ' + index + ' for an array of size ' + array.length);
                else if (index[i] < 0)
                    ret.push(array[array.length + index[i]]);
                else
                    ret.push(array[index[i]]);
            }
            return ret;
        } else {
            if ((index < -array.length) || (index >= array.length))
                throw new Error('invalid index ' + index + ' for an array of size ' + array.length);
            else if (index < 0)
                return array[array.length + index];
            else
                return array[index];
        }
    };

    /**
     * Return evenly spaced values within a given interval.
     * @param {int} [start]
     * @param {int} stop
     * @param {int} [step]
     * @returns {ndarray}
     */
    jsarray.arange = function(start, stop, step) {
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
        var numel = Math.ceil((stop-start)/step);
        var shape = [numel];
        var array = [];
        var i;
        for (i = 0; i < numel; i++) {
            array.push(Math.round(start + step*i));
        }
        return array;
    };  // np.arange

    // Return a new array of given shape and type, filled with `fill_value`.
    jsarray.full = function(shape, fill_value) {
        if (arguments.length < 1 || arguments.length > 3) {
            throw new Error('invalid number of arguments:' + JSON.stringify(arguments));
        }
        if (!Array.isArray(shape)) {
            shape = [shape];
        }
        var size = jsarray.prod(shape);
        var ret = [];
        var i;
        for (i = 0; i < size; i++)
            ret.push(fill_value);
        return jsarray.reshape(ret, shape);
    };

    /**
     * Compute sum of all elements.
     * @param {int[]} a - array of numbers.
     * @returns {int} product of all elements in a.
     */
    jsarray.sum = function(a) {
        var ret = 0;
        var i;
        for (i = 0; i < a.length; i++) {
            ret += a[i];
        }
        return ret;
    };

    /**
     * Compute product of all elements.
     * @param {int[]} a - array of numbers.
     * @returns {int} product of all elements in a.
     */
    jsarray.prod = function(a) {
        var ret = 1;
        var i;
        for (i = 0; i < a.length; i++) {
            ret *= a[i];
        }
        return ret;
    };

    /**
     * Compute dot product of two js arrays.
     * @param {int[]} a, b - arrays of numbers.
     * @returns {int} dot product of a and b.
     */
    jsarray.dot = function(a, b) {
        var i;
        var ret = 0;
        var n = Math.min(a.length, b.length);
        for (i = 0; i < n; i++) {
            ret += a[i] * b[i];
        }
        return ret;
    };

    /**
     * Flatten a nested javascript native array or typed array.
     * This returns a given array if it is not nested.
     * @param {object[]}
     * @returns {object[]}
     */
    jsarray.flatten = function(array) {
        while (Array.prototype.some.call(array, Array.isArray)) {
            array = array.reduce(function (acc, val) {return acc.concat(val);}, []);
        }
        return array;
    };  // jsarray.flatten

    /**
     * Reshape a js array.
     * @param {object[]} array - array holding data.
     * @param {int[]} shape - shape of created array.
     * @param {int} [offset=0] - offset of array data in buffer.
     * @param {int[]} [stride] - strides of data in memory.
     * @returns {object[]} a new array of a given shape.
     */
    jsarray.reshape = function(array, shape, offset, stride) {
        var it = iterator_from_shape(shape);
        var v = it.next();
        var pointer;
        var ret = [];
        var size, buf, i, tail;

        if (!jsarray.allpositive(shape)) {
            throw new Error("invalid shape: " + shape);
        }

        if (offset == undefined) {
            offset = 0;
        }

        if (stride == undefined) {
            stride = default_stride(shape);
        }

        // Extract elements from `array` and collect in a flat `ret` array.
        array = jsarray.flatten(array);
        while (!v.done) {
            pointer = jsarray.dot(v.value, stride) + offset;
            if (pointer < 0 || pointer >= array.length) {
                throw new Error(
                    'invalid arguments. given array size: ' + array.length +
                    '  shape: ' + shape +
                    '  offset: ' + offset +
                    '  stride: ' + stride
                );
            }
            ret.push(array[pointer]);
            v = it.next();
        }

        // Reshape `ret`.
        for (i = 0; i < shape.length - 1; i++) {
            size = shape[shape.length - i - 1];
            buf = [];
            while (ret.length > 0) {
                tail = ret.splice(size);
                buf.push(ret);
                ret = tail;
            }
            ret = buf;
        }
        return ret;
    };  // jsarray.reshape

    /**
     * Creates a new, shallow-copied Array instance from an array-like
     * or iterable object.
     * @param {arrayLike} An array-like or iterable object to convert to an array.
     * @param {[mapFn]} Map function to call on every element of the array.
     * @param {[thisArg]} Value to use as this when executing mapFn.
     * @returns {Array} A new Array instance.
     */
    jsarray.from = (function(arrayLike) {
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
    })();  // exported.jsarray.from

    for (var key in gexported)
        exported[key] = gexported[key];

    return exported;
}));
