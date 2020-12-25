(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.internal = definition();
    }
}(this, function () {
    "use strict";

    var exported = {};

    var is_boolean_array = function(a) {
        var is_boolean = function(x) {
            return typeof x == 'boolean';
        };
        return (Array.isArray(a) && Array.prototype.every.call(a, is_boolean));
    };

    var is_binary_array = function(a) {
        var is_binary = function(x) {
            return (!isNaN(x)) && ((x == 0) || (x == 1));
        };
        return (Array.isArray(a) && Array.prototype.every.call(a, is_binary));
    };

    var is_integer_array = function(a) {
        var is_integer = function(x) {
            return (!isNaN(x)) && (Math.ceil(x) == x);
        };
        return (Array.isArray(a) && Array.prototype.every.call(a, is_integer));
    };

    var is_float_array = function(a) {
        var is_float = function(x) {
            return !isNaN(x);
        };
        return (Array.isArray(a) && Array.prototype.every.call(a, is_float));
    };

    var neg_jsarray = exported.neg_jsarray = function(array) {
        if (is_boolean_array(array)) {
            return array.map(function(x) {return !x;});
        } else {
            return array.map(function(x) {return (x == 0) ? x : -x;});
        }
    };

    var nonzero_jsarray = exported.nonzero_jsarray = function(array) {
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
    var get_jsarray = exported.get_jsarray = function(array, index) {
        array = flatten_jsarray(array);
        var n;
        var ret = [];
        var i;
        if (is_boolean_array(index)) {
            // Array of booleans.
            n = Math.min(array.length, index.length);
            for (i = 0; i < n; i++) {
                if (index[i])
                    ret.push(array[i]);
            }
            return ret;
        } else if (is_float_array(index)) {
            // Array of numbers.
            n = index.length;
            for (i = 0; i < n; i++) {
                ret.push(array[index[i]]);
            }
            return ret;
        } else {
            throw new Error('not implemented: ' + JSON.stringify(index));
        }
    };

    /**
     * Return evenly spaced values within a given interval.
     * @param {int} [start]
     * @param {int} stop
     * @param {int} [step]
     * @returns {ndarray}
     */
    var arange_jsarray = exported.arange_jsarray = function(start, stop, step) {
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
    var full_jsarray = exported.full_jsarray = function(shape, fill_value) {
        if (arguments.length < 1 || arguments.length > 3) {
            throw new Error('invalid number of arguments:' + JSON.stringify(arguments));
        }
        if (!Array.isArray(shape)) {
            shape = [shape];
        }
        var size = prod_jsarray(shape);
        var ret = [];
        var i;
        for (i = 0; i < size; i++)
            ret.push(fill_value);
        return reshape_jsarray(ret, shape);
    };

    /**
     * Compute sum of all elements.
     * @param {int[]} a - array of numbers.
     * @returns {int} product of all elements in a.
     */
    var sum_jsarray = exported.sum_jsarray = function(a) {
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
    var prod_jsarray = exported.prod_jsarray = function(a) {
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
    var dot_jsarray = exported.dot_jsarray = function(a, b) {
        var i;
        var ret = 0;
        var n = Math.min(a.length, b.length);
        for (i = 0; i < n; i++) {
            ret += a[i] * b[i];
        }
        return ret;
    };

    /**
     * Flatten a nested javascript native array.
     * This returns a given array if it is not nested.
     * @param {object[]}
     * @returns {object[]}
     */
    var flatten_jsarray = exported.flatten_jsarray = function(array) {
        var is_bigint = function(a) {
            var typeofa = typeof a;  // linter complains "(typeof a) == 'bigint'".
            return typeofa == 'bigint';
        };
        if (Array.prototype.every.call(array, is_bigint))
            return array;  // Return the given array if it's flat.
        if (!Array.prototype.every.call(array, isNaN))
            return array;  // Return the given array if it's flat.
        while (Array.prototype.some.call(array, Array.isArray)) {
            array = array.reduce(function (acc, val) {return acc.concat(val);}, []);
        }
        return array;
    };  // flatten_jsarray

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
     * Reshape a js array.
     * @param {object[]} array - array holding data.
     * @param {int[]} shape - shape of created array.
     * @param {int} [offset=0] - offset of array data in buffer.
     * @param {int[]} [stride] - strides of data in memory.
     * @returns {object[]} a new array of a given shape.
     */
    var reshape_jsarray = exported.reshape_jsarray = function(array, shape, offset, stride) {
        var it = iterator_from_shape(shape);
        var v = it.next();
        var pointer;
        var ret = [];
        var size, buf, i, tail;

        if (!all_positive(shape)) {
            throw new Error("invalid shape: " + shape);
        }

        if (offset == undefined) {
            offset = 0;
        }

        if (stride == undefined) {
            stride = default_stride(shape);
        }

        // Extract elements from `array` and collect in a flat `ret` array.
        array = flatten_jsarray(array);
        while (!v.done) {
            pointer = dot_jsarray(v.value, stride) + offset;
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
    };  // reshape_jsarray

    /**
     * Given a shape, return an iterator to iterate over all elements.
     * @param {int[]} shape
     * @returns {iterator}
     */
    var iterator_from_shape = exported.iterator_from_shape = function(shape) {
        var value = [];
        var i;
        if (!all_positive(shape))
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

    var all_positive = exported.all_positive = function(array) {
        var is_positive = function(a) {
            return a > 0;
        };
        return Array.prototype.every.call(array, is_positive);
    };

    return exported;
}));
