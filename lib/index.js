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

    /* Define some constants */

    np.newaxis = '__newaxis__';
    np.Elipsis = '__elipsis__';

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
         * Flatten a nested javascript native array.
         * This returns an given array if it is not nested.
         * @param {object[]}
         * @returns {object[]}
         */
        var flatten = function(a) {
            while (Array.prototype.some.call(a, Array.isArray)) {
                // a = a.flat();
                a = a.reduce(function (acc, val) {return acc.concat(val);}, []);
            }
            return a;
        };  // flatten


        /**
         * Return an ndarray instance.
         * This return an ndarray instance.  If possible, data is not copied so
         * a returned array shares data with the original array.
         * @param {buffer|Array|ndarray} buffer - Object holding data.
         * @param {int[]} shape - Shape of created array.
         * @param {string} dtype - Data type of elements.
         * @param {int} [offset]
         * @param {int[]} [stride]
         * @returns {ndarray} ndarray.
         */
        np.asarray = function(buffer, shape, dtype, offset, stride, check) {
            if (np.isndarray(buffer)) {
                if (dtype === undefined) {
                    return buffer;
                } else {
                    return np.astype(buffer, dtype);
                }
            }
            dtype = dtype || np.float;
            var flattened = flatten(buffer);
            if (np.helper.use_arraybuffer()) {
                if (Array.isArray(buffer)) {
                    if (!Array.isArray(shape)) {
                        shape = np.helper.get_nested_array_shape(
                            buffer, {throw_if_fail: true});
                    }
                    var _TypedArray = np.dtype.arraybuffer[dtype];
                    buffer = new _TypedArray(flattened.length); var i;
                    for (i = 0; i < flattened.length; i++) {
                        buffer[i] = flattened[i];
                    }
                    return ndarray(shape, dtype, buffer, offset, stride, check);
                } else if (np.helper.isTypedArray(buffer)) {
                    shape = shape || [buffer.length];
                    return ndarray(shape, dtype, buffer, offset, stride, check);
                } else {
                    throw new Error('invalid argument ' + (typeof buffer));
                }
            } else {
                if (!Array.isArray(shape)) {
                    shape = np.helper.get_nested_array_shape(
                        buffer, {throw_if_fail: true});
                }
                return ndarray(shape, dtype, flattened, offset, stride, check);
            }
        };  // np.asarray


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
         * @param {Boolean} [check=true] - Check whether given data is consistent or not.
         * @returns {ndarray} A new array with given data.
         */
        let ndarray = function(shape, dtype, buffer, offset, stride, check) {
            offset = (offset === undefined) ? 0 : offset;
            check = (check === undefined) ? true : check;
            // If we want to use the attribute in this function,
            // we cannot use this, but we can refere by instance.xxx.
            let instance = function() {
                let index = Array.prototype.slice.call(arguments);
                return np.get(instance, index);
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
            return (a !== null) && (a !== undefined) && (a.__ndarray__ !== undefined);
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
    })();  // np.ndarray }}}

    (function() {  // np.constructors {{{
        /**
         * Return evenly spaced values within a given interval.
         * @param {int} [start]
         * @param {int} stop
         * @param {int} [step]
         * @param {dtype} [dtype=np.int]
         * @returns {ndarray}
         */
        np.arange = function(start, stop, step, dtype) {
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
            dtype = dtype || np.int;
            var numel = Math.ceil((stop-start)/step);
            var shape = [numel];
            var buffer;

            if (np.helper.use_arraybuffer()) {
                var _TypedArray = np.dtype.arraybuffer[dtype];
                buffer = new _TypedArray(numel);
                if (dtype == np.int64) {
                    for (i = 0; i < numel; i++) {
                        buffer[i] = BigInt(Math.round(start + step*i));
                    }
                } else {
                    for (i = 0; i < numel; i++) {
                        buffer[i] = Math.round(start + step * i);
                    }
                }
            } else {
                buffer = [];
                if (dtype == np.int64) {
                    for (i = 0; i < numel; i++) {
                        buffer.push(BigInt(Math.round(start + step*i)));
                    }
                } else {
                    for (i = 0; i < numel; i++) {
                        buffer.push(Math.round(start + step*i));
                    }
                }
            }
            var array = np.asarray(buffer, shape, dtype);
            var i;
            return array;
        };  // np.arange

        /**
         * Return a new array of given shape and type, filled with zeros.
         * @param {int[]} shape
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.zeros = function(shape, dtype) {
            dtype = dtype || np.float;
            return np.full(shape, 0, dtype);
        };  // np.zeros

        /**
         * Return a new array with shape of input filled with zeros.
         * @param {ndarray} a
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.zeros_like = function(a, dtype) {
            throw new Error('not implemented');
        };  // np.zeros_like

        /**
         * Return a new array of given shape and type, filled with ones.
         * @param {int[]} shape
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.ones = function(shape, dtype) {
            dtype = dtype || np.float;
            return np.full(shape, 1, dtype);
        };  // np.ones

        /**
         * Return a new array with shape of input filled with ones.
         * @param {ndarray} a
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.ones_like = function(a, dtype) {
            throw new Error('not implemented');
        };  // np.ones_like

        /**
         * Return a new array of given shape and type, filled with `fill_value`.
         * If dtype is omitted, it is set to be np.int if fill_value is an integer,
         * otherwise np.float.
         * @param {int[]} shape
         * @param {fill_value} scalar
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.full = function(shape, fill_value, dtype) {
            if (!Array.isArray(shape)) {
                shape = [shape];
            }
            if (dtype === undefined) {
                if (np.helper.isInteger(fill_value)) {
                    dtype = np.int;
                } else {
                    dtype = np.float;
                }
            }
            var i;
            var size = 1;
            for (i = 0; i < shape.length; i++) {
                size *= shape[i];
            }
            var buffer;
            if (np.helper.use_arraybuffer()) {
                var _TypedArray = np.dtype.arraybuffer[dtype];
                buffer = new _TypedArray(size);
                if (fill_value !== 0) {
                    for (i = 0; i < size; i++) {
                        buffer[i] = fill_value;
                    }
                }
            } else {
                buffer = [];
                for (i = 0; i < size; i++) {
                    buffer.push(fill_value);
                }
            }
            return np.asarray(buffer, shape, dtype);
        };  // np.full

        /**
         * Return a new array with shape of input filled with value.
         * @param {ndarray} a
         * @param {fill_value} scalar
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.full_like = function(a, fill_value, dtype) {
            throw new Error('not implemented');
        };  // np.full_like

        /**
         * Return a new array of given shape and type.
         * Actually, this is an alias for np.zeros, since javascript typed arrays
         * are initialized to be 0.
         * @param {int[]} shape
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.empty = np.zeros;

        /**
         * Return a new array with shape of input.
         * Actually, this is an alias for np.zeros_like, since javascript typed arrays
         * are initialized to be 0.
         * @param {ndarray} a
         * @param {dtype} [dtype]
         * @returns {ndarray} out
         */
        np.empty_like = np.zeros_like;
    })();  // np.constructors }}}

    (function() {  // indexing {{{
        np.indexing = {};

        /**
         * Get indexed/sliced elements.
         * `index` must be an Array of int, slice and/or array-like objects.
         * @param {array-like} a - array to be indexed/sliced.
         * @param {(int|string|array-like)[]} index - index.
         * @returns {object|ndarray}
         */
        np.get = function(a, index) {
            var is_advanced_indexing = index.some(np.isndarray);

            np.indexing.strip_commans(index);
            np.indexing.use_newaxis_and_elipsis(index);
            np.indexing.parse_integer_and_slice(index);
            np.indexing.expand_elipsis(index, a.shape);
            np.indexing.add_tail(index, a.shape);
            np.indexing.normalize_index(index, a.shape);
            a = np.indexing.expand_newaxis(a, index);

            if (is_advanced_indexing) {
                return np.indexing.apply_advanced_indexing(a, index);
            } else {
                return np.indexing.apply_basic_indexing(a, index);
            }
        };  // np.get


        /**
         * Given preprocessed array and index, apply basic indexing.
         * @param {ndarray} a
         * @param {object[]} index
         * @returns {ndarray} out - view of `a`
         */
        np.indexing.apply_basic_indexing = function(a, index){
            /*
             * Here, we apply basic indexing.
             * Since np.newaxis is applied in the preprocessing phase,
             * `index` only contains integers and/or slices.
             * Moreover, integers / starts and stops of slices are normalized.
             * If it's integer only, we returns the element.
             * Otherwise, we create a view of a given array.
             * The view can be constructed by manipulating
             * shape, offset and stride.
             *
             * - shape
             *   Only take slices and get length of each slice.
             *   Shape is given by concatenating the lengths.
             *
             * - offset
             *   Consider the first element, namely the element
             *   which is accessed by taking the first element of slices.
             *   For example, if `a` is of shape (10, 20, 30, 40)
             *   and `index` is ['2:4', 15, '10:-1:-1', 20],
             *   the first element is given by [2, 15, 10, 20].
             *   Now, compute the absolute offset of this element.
             *   This is the offset used for the new array.
             *   In the above example, the absolute offset of the element
             *   is given by
             *       2 * a.stride[0] + 15 * a.stride[1]
             *       + 10 * a.stride[2] + 20 * a.stride[3] + a.offset.
             *
             * - stride
             *   Again only take the slices.  Then, multiply the step
             *   and the corresponding stride.  Concatenating them yields
             *   stride of the new array.
             *   For example, consider `a` and `index` in the above example.
             *   The new stride is given by
             *       [1 * a.stride[0], (-1) * a.stride[2]].
             *
             * Now, create a new ndarray using the same buffer with
             * the above attributes.
             */
            var new_shape = [];
            var new_offset = a.offset;
            var new_stride = [];
            var i;
            var item;
            for (i = 0; i < index.length; i++) {
                if (np.helper.isInteger(index[i])) {
                    new_offset += index[i] * a.stride[i];
                } else {
                    item = index[i];  // Slice
                    new_shape.push(
                        Math.abs(Math.ceil((item.stop - item.start) / item.step)));
                    new_offset += item.start * a.stride[i];
                    new_stride.push(item.step * a.stride[i]);
                }
            }
            if (new_shape.length == 0) {
                return a.buffer[new_offset];
            } else {
                return np.asarray(
                    a.buffer, new_shape, a.dtype, new_offset, new_stride, false);
            }
        };  // np.indexing.apply_basic_indexing


        np.indexing.apply_advanced_indexing = function(a, index){
            throw new Error('not yet implemented');
        };  // np.indexing.apply_advanced_indexing


        /**
         * Get an item from an array.
         * `index` must be an Array of int, whose length is equal to the dimension
         * of the array.
         * @param {array-like} a - array to be indexed/sliced.
         * @param {int[]} index - index.
         * @returns {object}
         */
        np.getitem = function(a, index) {
            if (index.length !== a.ndim) {
                throw new Error(
                    'invalid index [' + index + '] for a ' + a.ndim +
                    ' dimensional array.'
                );
            }
            var i = 0;
            var cursor = a.offset;
            var idx;
            for (i = 0; i < a.ndim; i++) {
                idx = index[i];
                if (idx < -a.shape[i] || idx >= a.shape[i]) {
                    throw new Error(
                        'invalid index [' + index + '] for an array of shape (' +
                        a.shape + ').'
                    );
                } else if (idx < 0) {
                    idx += a.shape[i];
                }
                cursor += idx * a.stride[i];
            }
            return a.buffer[cursor];
        };  // np.getitem

        /**
         * Returns a javascript native Array.
         * @param {array-like} a
         * @param {bool} [flatten=true] - return a flattened Array
         */
        np.tojsarray = function(a, flatten) {
            // TODO Modify np.asarray to accept an scalar, and unify
            // if (a.shape.length ==1) and final else clause.
            var ret = [];
            var i = 0;
            if (flatten) {
                throw new Error('not implemented');
                // return np.tojsarray(a.reshape(-1), false);
            } else if (a.shape.length == 0) {
                return a.getitem();
            } else if (a.shape.length == 1) {
                for (i = 0; i < a.shape[0]; i++) {
                    ret.push(a(i));
                }
                return ret;
            } else {
                for (i = 0; i < a.shape[0]; i++) {
                    ret.push(np.tojsarray(a(i)));
                }
                return ret;
            }
        };  // np.tojsarray

        /**
         * Expand the shape of an array.
         * a : array-lik
         * axis : int
         * This returns a view of a given array with the modified shape.
         */
        np.expand_dims = function(a, axis) {
            a = np.asarray(a);
            if (axis < -a.shape.length - 1 || axis > a.shape.length) {
                throw new Error(
                    'invalid axis ' + axis + ' for ' + a.shape.length +
                    ' dimensional array.');
            } else if (axis < 0) {
                axis = axis + a.shape.length + 1;
            }
            var shape = a.shape.slice();
            var stride = a.stride.slice();
            shape.splice(axis, 0, 1);  // Append a new axis.
            if (axis == 0) {
                stride.splice(axis, 0, 2*stride[0]);  // Append a new stride.
            } else {
                stride.splice(axis, 0, stride[axis-1]);  // Append a new stride.
            }
            return np.asarray(a.buffer, shape, a.dtype, a.offset, stride, false);
        };  // np.expand_dims

        /**
         * Slice object to slice ndarray.
         * @param {int} start
         * @param {int} stop
         * @param {int} step
         */
        np.indexing.Slice = function(start, stop, step) {
            this.start = start;
            this.stop = stop;
            this.step = step;
        };  // np.indexing.Slice

        /**
         * Return all indices in this slice.
         * @returns {int[]}
         */
        np.indexing.Slice.prototype.get_indices = function() {
            var result = [];
            var i;
            if (this.step > 0) {
                for (i = this.start; i < this.stop; i += this.step) {
                    result.push(i);
                }
            } else {
                for (i = this.start; i > this.stop; i += this.step) {
                    result.push(i);
                }
            }
            return result;
        };  // np.indexing.Slice.prototype.get_indices

        /**
         * Compare self with another slice.
         * @param {object} other
         * @returns {Boolean}
         */
        np.indexing.Slice.prototype.__eq__ = function(other) {
            if (!(other instanceof np.indexing.Slice)) {
                return false;
            } else if (this.start != other.start) {
                return false;
            } else if (this.stop != other.stop) {
                return false;
            } else if (this.step != other.step) {
                return false;
            }
            return true;
        };  // np.indexing.Slice.prototype.__eq__;

        /**
         * Return string representing self.
         * @returns {str}
         */
        np.indexing.Slice.prototype.toString = function() {
            return '{' + this.start + ',' + this.stop + ',' + this.step  + '}';
        };  // np.indexing.Slice.prototype.toString

        /**
         * Parse a string and get a Slice instance.
         * This parses a string and returns a Slice instance if possible.
         * For examples, extract_slice('2:4') -> Slice(2, 4, undefined) and
         * extract_slice('::-1') -> Slice(undefined, undefined, -1).
         * If a given object is not a valid slice, this returns undefined.
         * @param {string} x
         * @returns {Slice|undefined}
         */
        np.indexing.parse_slice = function(x) {
            const patter = /^(-?[0-9]+)?:(-?[0-9]+)?(:(-?[0-9]+)?)?$/;
            const result = patter.exec(x);
            if (!result) {
                return;
            }
            const start = result[1] ? Number(result[1]) : undefined;
            const stop = result[2] ? Number(result[2]) : undefined;
            const step = result[4] ? Number(result[4]) : undefined;
            return new np.indexing.Slice(start, stop, step);
        };  // np.indexing.parse_slice

        /**
         * Strip string elements by comma as a part of preprocessing.
         * This takes an Array and splits each item of str with comma, and
         * strip spaces.
         * This is an inplace operation.
         * @param {object[]} index - index array
         */
        np.indexing.strip_commans = function(index) {
            var i;
            var args;
            for (i = 0; i < index.length; i++) {
                if (typeof index[i] == 'string') {
                    args = [i, 1].concat(index[i].split(','));
                    index.splice.apply(index, args);
                }
            }
        };  // np.indexing.strip_commans

        /**
         * Use np.newaxis and np.Elipsis when required.
         * This is an inplace operation.
         * @param {object[]} index - index array
         */
        np.indexing.use_newaxis_and_elipsis = function(index) {
            var item;
            var i;
            for (i = 0; i < index.length; i++) {
                item = index[i];
                if (np.helper.isNaN(item)) {
                    index[i] = np.newaxis;
                } else if (item === null) {
                    index[i] = np.newaxis;
                } else if (item === undefined) {
                    index[i] = np.newaxis;
                } else if (item == '...') {
                    index[i] = np.Elipsis;
                }
            }
        };  // np.indexing.use_newaxis_and_elipsis

        /**
         * Check whether a given string is actually a number or not.
         * @param {string} str
         * @returns {Boolean}
         */
        np.indexing.is_string_integer = function(str) {
            return Boolean(str.match(/^([+-]?[1-9]\d*|0)$/));
        };  // np.indexing.is_string_integer

        /**
         * Parse integers and Slices in an array.
         * This takes an Array and try to parse string items into integers
         * and Slices.  If this encounters an string which cannot be parsed
         * as integer or Slice, and which does not match with np.newaxis nor
         * np.Elipsis, this throws an error.
         * This is an inplace operation.
         * @param {object[]} index - index array
         */
        np.indexing.parse_integer_and_slice = function(index) {
            var i;
            var allowed = [np.Elipsis, np.newaxis];
            var slice;
            for (i = 0; i < index.length; i++) {
                if (typeof index[i] != 'string') {
                    continue;
                }
                // Try to parse into a Slice.
                slice = np.indexing.parse_slice(index[i]);
                if (np.indexing.is_string_integer(index[i])) {
                    // This is actually integer.
                    index[i] = parseInt(index[i]);
                } else if (slice !== undefined) {
                    // This is Slice.
                    index[i] = slice;
                } else if (allowed.indexOf(index[i]) < 0) {
                    // Invalid string.
                    throw new Error("invalid item '" + index[i]+ "'");
                }
            }
        };

        /**
         * Expand elisps in an array.
         * This counts the number of items which are not new axis nor elipsis
         * and replace elispsis with ':'s.
         * If there are more than one elipsis in a given array, this throws
         * an Error.
         * This is an inplace operation.
         * @param {object[]} index - index array
         * @param {int[]} shape - shape of an array to be indexed
         */
        np.indexing.expand_elipsis = function(index, shape) {
            var elipsis_position = index.indexOf(np.Elipsis);
            var another_elipsis_position;
            var i;
            var num_non_newaxis_nor_elipsis;
            var num_slices_to_be_added;

            if (elipsis_position < 0) {
                return index;
            }
            another_elipsis_position =
                index.indexOf(np.Elipsis, elipsis_position+1);
            if (another_elipsis_position >= 0) {
                throw new Error('more than one Elipsis found');
            }
            num_non_newaxis_nor_elipsis = 0;
            for (i = 0; i < index.length; i++) {
                if (index[i] != np.newaxis && index[i] != np.Elipsis) {
                    num_non_newaxis_nor_elipsis += 1;
                }
            }
            num_slices_to_be_added =
                shape.length - num_non_newaxis_nor_elipsis;
            index.splice(elipsis_position, 1);  // Pop elipsis.
            for (i = 0; i < num_slices_to_be_added; i++) {
                // Insert ':' at the position where elipsis was placed.
                index.splice(elipsis_position, 0, new np.indexing.Slice());
            }
        };  // np.indexing.expand_elipsis

        /**
         * Add tailing slices.
         * This adds ':' at the end of an array so that the number of
         * items except np.newaxis matches with the number of dimension.
         * If there are more items than allowed in an array, this throws an Error.
         * This is an inplace operation.
         * @param {object[]} index - index array
         * @param {int[]} shape - shape of an array to be indexed
         */
        np.indexing.add_tail = function(index, shape) {
            var num_non_newaxis = 0;
            var i;
            var num_tailing_slices;
            var ndim = shape.length;

            for (i = 0; i < index.length; i++) {
                if (index[i] != np.newaxis) {
                    num_non_newaxis += 1;
                }
            }
            num_tailing_slices = ndim - num_non_newaxis;
            // If num_non_newaxis is more than the dimension of the array,
            // raise an error.
            if (num_non_newaxis > ndim) {
                throw new Error(
                    'too many indices ' + num_non_newaxis + ' for a ' +
                    ndim + ' dimensional array'
                );
            }
            for (i = 0; i < num_tailing_slices; i++) {
                index.splice(index.length, 0, new np.indexing.Slice());
            }
        };  // np.indexing.add_tail

        /**
         * Normalize integer / slice / index array.
         * This normalizes integer / slice / index array in an array,
         * given the shape of the array to be indexed.
         * Namely, this replaces negative indices and replace
         * undefined slice properties.
         * This throws an Error if some elements are out of range.
         * This is an inplace operation.
         * @param {object[]} index - index array
         * @param {int[]} shape - shape of an array to be indexed
         */
        np.indexing.normalize_index = function(index, shape) {
            var non_new_axis_counter = -1;
            var i;
            var item;
            var this_shape;

            for (i = 0; i < index.length; i++) {
                item = index[i];
                if (item == np.newaxis)
                    continue;

                non_new_axis_counter += 1;  // Note we initialized this counter with -1.
                this_shape = shape[non_new_axis_counter];

                if (item instanceof np.indexing.Slice) {
                    if (item.step === undefined)
                        item.step = 1;

                    if (item.start === undefined)
                        item.start = item.step > 0 ? 0 : this_shape-1;
                    else if (item.start < 0 && item.start > -this_shape)
                        item.start += this_shape;
                    else if (item.start <= -this_shape || item.start >= this_shape)
                        throw new Error(
                            'slice start out of range.  start ' + item.start +
                            ' for size ' + this_shape
                        );

                    // Be careful; stop is exclusive.
                    if (item.stop === undefined)
                        item.stop = item.step > 0 ? this_shape : -1;
                    else if (item.stop < 0 && item.stop > -this_shape)
                        item.stop += this_shape;
                    else if (item.stop <= -this_shape || item.stop > this_shape)
                        throw new Error(
                            'slice stop out of range.  stop ' + item.start +
                            ' for size ' + this_shape
                        );

                } else if (np.helper.isInteger(item)) {
                    if (item < 0 && item > -this_shape) {
                        index[i] += this_shape;
                    } else if (item < 0 || item >= this_shape) {
                        throw new Error(
                            'integer index out of range.  index ' + item +
                            ' for size ' + this_shape
                        );
                    }

                } else if (np.isndarray(item) && item.dtype.indexOf('bool') < 0) {
                    throw new Error('not yet implemented');
                    // item = item + (item < 0) * this_shape;
                    // index[i] = np.add(item, np.mul(np.lt(item, 0), this_shape));
                }
            }
        };  // np.indexing.normalize_index


        /**
         * Expand dimensions of an array to match with np.newaxis.
         * This expands dimensions of a given array where np.newaxis
         * are given.  np.newaxis in `index` is replaced with `0:1`.
         * This returns a view of the original array.
         * @param {ndarray} a
         * @param {object[]} index
         * @returns {ndarray} out
         */
        np.indexing.expand_newaxis = function(a, index) {
            // Expand dimension at np.newaxis, and replace np.newaxis with Slices.
            var newaxis_pos = [];
            var i;
            for (i = 0; i < index.length; i++) {
                if (index[i] == np.newaxis) {
                    newaxis_pos.push(i);
                    index[i] = new np.indexing.Slice(0, 1, 1);
                }
            }
            for (let i=0; i<newaxis_pos.length; i++) {
                a = np.expand_dims(a, newaxis_pos[i]);
            }
            return a;
        };  // np.indexing.expand_newaxis
    })();  // indexing }}}

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
        np.helper.is_es6_supported =
            (np.helper.msieversion == 0 || np.helper.msieversion == 11);


        // Maybe we should change the name of the mode.
        // Typed arrays are added in es6 so it might be confusing.
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

        var use_arraybuffer = np.helper.is_array_buffer_supported;
        np.helper.use_arraybuffer = function(value) {
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
        np.helper.isNaN = Number.isNaN || function(value) {
            return value !== value;
        };  // np.helper.isNaN

        /**
         * Returns the integer part of a number by removing any fractional digits.
         * This is equivalent to Number.trunc, if it's available.
         * @param {Number} v
         * @returns {Number} i
         */
        np.helper.trunc = Number.trunc || function(v) {
            return v < 0 ? Math.ceil(v) : Math.floor(v);
        };  // np.helper.trunc

        /**
         * Determine whether the passed value is an integer.
         * This is equivalent to Number.isInteger, if it's available.
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
         */
        np.helper.isInteger = Number.isInteger || function(value) {
            return typeof value === 'number' &&
                    isFinite(value) &&
                    Math.floor(value) === value;
        };  // np.helper.isInteger

        np.helper.Arrayfrom = (function(arrayLike) {
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
        })();  // np.helper.Arrayfrom

        if (np.helper.msieversion > 0) {
            /**
             * Determine whether the passed value is a TypedArray.
             */
            np.helper.isTypedArray = function(value) {
                // This is not very precise test but anyway...
                return np.helper.is_array_buffer_supported &&
                        (value.byteLength !== undefined);
            };  // np.helper.isTypedArray
        } else {
            var TypedArray = Object.getPrototypeOf(Int32Array);
            /**
             * Determine whether the passed value is a TypedArray.
             */
            np.helper.isTypedArray = function(value) {
                return np.helper.is_array_buffer_supported &&
                        (value instanceof TypedArray);
            };  // np.helper.isTypedArray
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
        np.helper.get_nested_array_shape = function(array, options) {
            options = options || {};
            let allow_empty = options.allow_empty || false;
            let throw_if_fail = options.throw_if_fail || false;

            let is_number_or_boolean = function (x) {
                return (typeof x == 'number') || (typeof x == 'boolean');
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
                } else {
                    let type = [];
                    for (let i=0; i<array.length; i++) {
                        if (Array.isArray(array[i])) {
                            type.push('array');
                        } else {
                            type.push(typeof array[i]);
                        }
                    }
                    throw new Error('mixed numeric and arrays: [' + type + '].');
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
        };  // np.helper.get_nested_array_shape

        /**
         * Dump a log of a formatted array on the console.
         * There are two signatures:
         * np.dumps(array: np.ndarray, precision: int)
         * np.dumps(array: np.ndarray, width: int, precision: int)
         * This does not support arrays of more than three dimensions.
         */
        np.helper.dump = function(x, a, b) {
            console.log(np.helper.dumps(x, a, b));
        };

        /**
         * Returns a formatted string which contains content of this array.
         * There are two signatures:
         * np.dumps(array: np.ndarray, precision: int)
         * np.dumps(array: np.ndarray, width: int, precision: int)
         * This does not support arrays of more than three dimensions.
         */
        np.helper.dumps = function(x, a, b) {
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
                    ret += np.helper.dumps(x(i), wide, precision);
                }
                ret += ']';
            } else if (x.shape.length == 3) {
                ret = '[';
                for (i = 0; i < x.shape[0]; i++) {
                    if (i > 0)
                        ret += ',\n\n ';
                    tmp = np.helper.dumps(x(i), wide, precision);
                    tmp = tmp.replace(/\n/g, '\n ');
                    ret += tmp;
                }
                ret += ']';
            } else if (x.shape.length >= 4) {
                throw new Error('not supported an x of more than 2 dimensions');
            }
            return ret;

        };  // np.helper.dump
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
            let exit_hook = function() {};
            if (assert !== undefined && options._nested_call === undefined) {
                exit_hook = function() {assert.ok(true, 'given object is array-like');};
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

            let exit_hook = function() {};
            if (assert !== undefined && options._nested_call === undefined) {
                exit_hook = function() {assert.ok(true, 'given objects are close');};
            }
            let fail_hook;
            if (assert) {
                fail_hook = function(msg) {assert.ok(false, msg);};
            } else {
                fail_hook = function(msg) {throw new Error(msg);};
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
