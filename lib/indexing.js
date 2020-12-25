(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.exported = definition();
    }
}(this, function () {
    "use strict";

    var exported = {};

    exported._set_alias = function(np) {
        np.newaxis = exported.newaxis;
        np.Ellipsis = exported.Ellipsis;
        np.expand_dims = exported.expand_dims;
        np.expand_newaxis = exported.expand_newaxis;
    };

    var ndarray_module = require('./ndarray');
    var helper = require('./helper');
    var jsarray = helper.jsarray;
    var constructor_module = require('./constructor');
    var dtype_module = require('./dtype');

    // Constant used in structural indexing.
    var newaxis = exported.newaxis = '__newaxis__';
    // Constant used in slicing expression.
    var Ellipsis = exported.Ellipsis = '__ellipsis__';

    /**
     * Get an array whose elements are pointers of the corresponding
     * elements in the underlying buffer.
     * @param {array-like} array
     * @returns {ndarray} pointer
     */
    var buffer_pointer = exported.buffer_pointer = function(array) {
        array = ndarray_module.asarray(array);
        var ret = constructor_module.full(array.shape, -1, dtype_module.int);
        var it = helper.iterator_from_shape(array.shape);
        var v = it.next();
        var i = 0;
        var pointer;
        while (!v.done) {
            pointer = jsarray.dot(v.value, array.stride) + array.offset;
            ret.buffer[i] = pointer;
            v = it.next();
            i++;
        }
        return ret;
    };

    /**
     * Get indexed/sliced elements.
     * `index` must be an Array of int, slice and/or array-like objects.
     * @param {array-like} a - array to be indexed/sliced.
     * @param {(int|string|array-like)[]} index - index.
     * @returns {object|ndarray}
     */
    var get = exported.get = function(a, index) {
        return accessor_impl(a, index, undefined);
    };  // np.get

    /**
     * Get indexed/sliced elements.
     * `index` must be an Array of int, slice and/or array-like objects.
     * @param {array-like} a - array to be indexed/sliced.
     * @param {(int|string|array-like)[]} index - index.
     * @returns {object|ndarray}
     */
    var accessor_impl = function(a, index, value) {
        var is_array = function(x) {
             return (x instanceof ndarray_module.ndarray) || Array.isArray(x);
        };
        var is_advanced_indexing = Array.prototype.some.call(index, is_array);
        var is_getter = true;
        var pointer, ret, it, v, i;
        if (value != undefined) {
            value = ndarray_module.asarray(value);
            is_getter = false;
        }
        index = index.slice();

        exported.strip_commans(index);
        exported.use_newaxis_and_ellipsis(index);
        exported.parse_integer_and_slice(index);
        exported.expand_ellipsis(index, a.shape);
        exported.add_tail(index, a.shape);
        exported.normalize_index(index, a.shape);
        a = exported.expand_newaxis(a, index);

        if (is_advanced_indexing && is_getter) {  // advanced getter
            pointer = exported.apply_advanced_indexing(a, index);
            ret = np.zeros(pointer.shape, a.dtype);
            for (i = 0; i < pointer.buffer.length; i++)
                ret.buffer[i] = a.buffer[pointer.buffer[i]];
            return ret;
        } else if (is_advanced_indexing && !is_getter) {  // advanced setter
            pointer = exported.apply_advanced_indexing(a, index);
            value = ascontiguous(np.broadcast_to(value, pointer.shape));
            for (i = 0; i < pointer.buffer.length; i++)
                a.buffer[pointer.buffer[i]] = value.buffer[i];
        } else if (!is_advanced_indexing && is_getter) {  // simple getter
            return exported.apply_basic_indexing(a, index);
        } else {  // simple setter
            if (!Array.prototype.some.call(index, isNaN)) {  // single element.
                setitem(a, index, getitem(value));
            } else {
                a = exported.apply_basic_indexing(a, index);
                value = np.broadcast_to(value, a.shape);
                it = helper.iterator_from_shape(a.shape);
                v = it.next();
                while (!v.done) {
                    setitem(a, v.value, getitem(value, v.value));
                    v = it.next();
                }
            }
        }
    };  // np.get

    /**
     * Get indexed/sliced elements.
     * `index` must be an Array of int, slice and/or array-like objects.
     * @param {array-like} a - array to be indexed/sliced.
     * @param {(int|string|array-like)[]} index - index.
     * @returns {object|ndarray}
     */
    var set = exported.set = function(a, index, value) {
        return accessor_impl(a, index, value);
    };  // np.set

    /**
     * Set a value on a specified position.
     * Note the order of arguments are different from python setter.
     * @param {array-like} a - array to be indexed/sliced.
     * @param {int|float|ndarray} value - value to be set.
     * @param {int[]} index - index.
     * @returns {object|ndarray}
     */
    var setitem = exported.setitem = function(a, index, value) {
        // TODO Accept negative values.
        a = ndarray_module.asarray(a);
        if (index.length !== a.shape.length) {
            throw new Error(
                'dimension mismatch. expected' + a.shape.length +
                ' but got ' + index.length
            );
        }
        var pointer = jsarray.dot(index, a.stride) + a.offset;
        a.buffer[pointer] = value;
    };  // np.setitem

    /**
     * Given preprocessed array and index, apply basic indexing.
     * @param {ndarray} a
     * @param {object[]} index
     * @returns {ndarray} out - view of `a`
     */
    var apply_basic_indexing = exported.apply_basic_indexing = function(a, index){
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
            if (helper.isInteger(index[i])) {
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
            return ndarray_module.asarray(
                a.buffer, new_shape, a.dtype, new_offset, new_stride, false);
        }
    };  // exported.apply_basic_indexing

    exported.apply_advanced_indexing = function(a, index){
        // TODO Replace boolean masks with integer arrays.
        // Transpose axis and put all advanced indexing on the left.
        var i, n_advanced_index = 0;
        for (i = 0; i < index.length; i++) {
            if ((Array.isArray(index[i])) || !isNaN(index[i])) {
                index[i] = ndarray_module.asarray(index[i]);
                n_advanced_index++;
            } else if (index[i] instanceof ndarray_module.ndarray) {
                n_advanced_index++;
            }
        }
        // This include integers.
        var array_like = function(x) {
            return (!isNaN(x)) || (Array.isArray(x)) || (x instanceof ndarray_module.ndarray);
        };
        var axis = jsarray.arange(a.ndim);
        var index_array_like = index.map(array_like);
        var index_array_pos = jsarray.nonzero(index_array_like);
        // Broadcast arrays.
        var broadcasted = np.broadcast_arrays(jsarray.get(index, index_array_like));
        for (i = 0; i < n_advanced_index; i++) {
            index[index_array_pos[i]] = broadcasted[i];
        }
        var original_pointer = exported.buffer_pointer(a);
        axis = jsarray.get(axis, index_array_like).concat(
            jsarray.get(axis, jsarray.neg(index_array_like))
        );
        original_pointer = np.transpose(original_pointer, axis);  // TODO
        index = jsarray.get(index, axis);
        // Apply basic indexing on the right side.
        var extended_basic_index = (
            [exported.Ellipsis].concat(index.slice(n_advanced_index))
        );
        var advanced_index = index.slice(0, n_advanced_index);
        original_pointer = get(original_pointer, extended_basic_index);
        // Compute the resulting shape and allocate memory.
        var shape = advanced_index[0].shape.concat(original_pointer.shape.slice(n_advanced_index));
        var new_pointer = constructor_module.zeros(shape, dtype_module.int);
        // Iterate all advance indices.
        var it = helper.iterator_from_shape(advanced_index[0].shape);
        var v = it.next();
        var cursor;
        var buf;
        while (!v.done) {
            cursor = [];
            for (i = 0; i < advanced_index.length; i++) {
                buf = get(advanced_index[i], v.value);
                if ((buf <= -original_pointer.shape[i]) || (buf > original_pointer.shape[i])) {
                    // TODO Improve the error message.
                    throw new Error('invalid index ' + index + ' for array ' + original_pointer);
                } else if (buf < 0) {
                    buf += original_pointer.shape[i];
                }
                cursor.push(buf);
            }
            set(new_pointer, v.value, get(original_pointer, cursor));
            v = it.next();
        }
        // If arrays were located next to each other, transpose the final result.
        var first_array_pos = index_array_like.indexOf(true);
        var last_array_pos = index_array_like.lastIndexOf(true);
        var successive_arrays = (
            index_array_like
                .slice(first_array_pos, last_array_pos+1)
                .every(function(x) {return x;})
        );
        if (successive_arrays && (first_array_pos > 0)) {
            var advanced_index_dim = advanced_index[0].ndim;
            axis = jsarray.arange(new_pointer.ndim);
            var sliced = axis.splice(0, advanced_index_dim);
            for (i = 0; i < sliced.length; i++)
                axis.splice(first_array_pos, 0, sliced[sliced.length - i - 1]);
            new_pointer = np.transpose(new_pointer, axis);
            new_pointer = ascontiguous(new_pointer);
        }
        return new_pointer;
    };  // exported.apply_advanced_indexing
    var apply_advanced_indexing = exported.apply_advanced_indexing;

    /**
     * Get an item from an array.
     * `index` must be an Array of int, whose length is equal to the dimension
     * of the array.
     * @param {array-like} a - array to be indexed/sliced.
     * @param {int[]} index - index.
     * @returns {object}
     */
    var getitem = exported.getitem = function(a, index) {
        if (a.ndim == 0) {
            if ((index != undefined) && (index.length > 0)) {
                throw new Error(
                    'invalid index [' + index + '] for a ' + a.ndim +
                    ' dimensional array.'
                );
            }
            return a.buffer[a.offset];
        }
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
     * Expand the shape of an array.
     * @param {array-like} a
     * @param {int} axis
     * This returns a view of a given array with the modified shape.
     */
    var expand_dims = exported.expand_dims = function(a, axis) {
        a = ndarray_module.asarray(a);
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
        return ndarray_module.asarray(a.buffer, shape, a.dtype, a.offset, stride, false);
    };  // np.expand_dims

    // {{{ Slice

    /**
     * Slice object to slice ndarray.
     * @param {int} start
     * @param {int} stop
     * @param {int} step
     */
    var Slice = exported.Slice = function(start, stop, step) {
        this.start = start;
        this.stop = stop;
        this.step = step;
    };  // Slice

    /**
     * Return all indices in this slice.
     * @returns {int[]}
     */
    Slice.prototype.get_indices = function() {
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
    };  // Slice.prototype.get_indices

    /**
     * Compare self with another slice.
     * @param {object} other
     * @returns {Boolean}
     */
    Slice.prototype.__eq__ = function(other) {
        if (!(other instanceof Slice)) {
            return false;
        } else if (this.start != other.start) {
            return false;
        } else if (this.stop != other.stop) {
            return false;
        } else if (this.step != other.step) {
            return false;
        }
        return true;
    };  // Slice.prototype.__eq__;

    /**
     * Return string representing self.
     * @returns {str}
     */
    Slice.prototype.toString = function() {
        return '{' + this.start + ',' + this.stop + ',' + this.step  + '}';
    };  // Slice.prototype.toString

    // }}} Slice

    // {{{ index preprocessing

    /**
     * Parse a string and get a Slice instance.
     * This parses a string and returns a Slice instance if possible.
     * For examples, extract_slice('2:4') -> Slice(2, 4, undefined) and
     * extract_slice('::-1') -> Slice(undefined, undefined, -1).
     * If a given object is not a valid slice, this returns undefined.
     * @param {string} x
     * @returns {Slice|undefined}
     */
    exported.parse_slice = function(x) {
        var patter = /^(-?[0-9]+)?:(-?[0-9]+)?(:(-?[0-9]+)?)?$/;
        var result = patter.exec(x);
        if (!result) {
            return;
        }
        var start = result[1] ? Number(result[1]) : undefined;
        var stop = result[2] ? Number(result[2]) : undefined;
        var step = result[4] ? Number(result[4]) : undefined;
        return new exported.Slice(start, stop, step);
    };  // exported.parse_slice

    /**
     * Strip string elements by comma as a part of preprocessing.
     * This takes an Array and splits each item of str with comma, and
     * strip spaces.
     * This is an inplace operation.
     * @param {object[]} index - index array
     */
    exported.strip_commans = function(index) {
        var i;
        var args;
        for (i = 0; i < index.length; i++) {
            if (typeof index[i] == 'string') {
                args = [i, 1].concat(index[i].split(','));
                index.splice.apply(index, args);
            }
        }
    };  // exported.strip_commans

    /**
     * Use np.newaxis and np.Ellipsis when required.
     * This is an inplace operation.
     * @param {object[]} index - index array
     */
    exported.use_newaxis_and_ellipsis = function(index) {
        var item;
        var i;
        for (i = 0; i < index.length; i++) {
            item = index[i];
            if (helper.isNaN(item)) {
                index[i] = exported.newaxis;
            } else if (item === null) {
                index[i] = exported.newaxis;
            } else if (item === undefined) {
                index[i] = exported.newaxis;
            } else if (item == '...') {
                index[i] = exported.Ellipsis;
            }
        }
    };  // exported.use_newaxis_and_ellipsis

    /**
     * Check whether a given string is actually a number or not.
     * @param {string} str
     * @returns {Boolean}
     */
    exported.is_string_integer = function(str) {
        return Boolean(str.match(/^([+-]?[1-9]\d*|0)$/));
    };  // exported.is_string_integer

    /**
     * Parse integers and Slices in an array.
     * This takes an Array and try to parse string items into integers
     * and Slices.  If this encounters an string which cannot be parsed
     * as integer or Slice, and which does not match with np.newaxis nor
     * np.Ellipsis, this throws an error.
     * This is an inplace operation.
     * @param {object[]} index - index array
     */
    exported.parse_integer_and_slice = function(index) {
        var i;
        var allowed = [exported.Ellipsis, exported.newaxis];
        var slice;
        for (i = 0; i < index.length; i++) {
            if (typeof index[i] != 'string') {
                continue;
            }
            if ((index[i] == exported.newaxis) || (index[i] == exported.Ellipsis)) {
                continue;
            }
            // Try to parse into a Slice.
            slice = exported.parse_slice(index[i]);
            if (exported.is_string_integer(index[i])) {
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
     * This counts the number of items which are not new axis nor ellipsis
     * and replace elispsis with ':'s.
     * If there are more than one ellipsis in a given array, this throws
     * an Error.
     * This is an inplace operation.
     * @param {object[]} index - index array
     * @param {int[]} shape - shape of an array to be indexed
     */
    exported.expand_ellipsis = function(index, shape) {
        var ellipsis_position = index.indexOf(exported.Ellipsis);
        var another_ellipsis_position;
        var i;
        var num_non_newaxis_nor_ellipsis;
        var num_slices_to_be_added;

        if (ellipsis_position < 0) {
            return index;
        }
        another_ellipsis_position =
            index.indexOf(exported.Ellipsis, ellipsis_position+1);
        if (another_ellipsis_position >= 0) {
            throw new Error('more than one Ellipsis found');
        }
        num_non_newaxis_nor_ellipsis = 0;
        for (i = 0; i < index.length; i++) {
            if (index[i] != exported.newaxis && index[i] != exported.Ellipsis) {
                num_non_newaxis_nor_ellipsis += 1;
            }
        }
        num_slices_to_be_added =
            shape.length - num_non_newaxis_nor_ellipsis;
        index.splice(ellipsis_position, 1);  // Pop ellipsis.
        for (i = 0; i < num_slices_to_be_added; i++) {
            // Insert ':' at the position where ellipsis was placed.
            index.splice(ellipsis_position, 0, new Slice());
        }
    };  // exported.expand_ellipsis

    /**
     * Add tailing slices.
     * This adds ':' at the end of an array so that the number of
     * items except np.newaxis matches with the number of dimension.
     * If there are more items than allowed in an array, this throws an Error.
     * This is an inplace operation.
     * @param {object[]} index - index array
     * @param {int[]} shape - shape of an array to be indexed
     */
    exported.add_tail = function(index, shape) {
        var num_non_newaxis = 0;
        var i;
        var num_tailing_slices;
        var ndim = shape.length;

        for (i = 0; i < index.length; i++) {
            if (index[i] != exported.newaxis) {
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
            index.splice(index.length, 0, new exported.Slice());
        }
    };  // exported.add_tail

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
    exported.normalize_index = function(index, shape) {
        var non_new_axis_counter = -1;
        var i;
        var item;
        var this_shape;

        for (i = 0; i < index.length; i++) {
            item = index[i];
            if (item == exported.newaxis)
                continue;

            non_new_axis_counter += 1;  // Note we initialized this counter with -1.
            this_shape = shape[non_new_axis_counter];

            if (item instanceof exported.Slice) {
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

            } else if (helper.isInteger(item)) {
                if (item < 0 && item > -this_shape) {
                    index[i] += this_shape;
                } else if (item < 0 || item >= this_shape) {
                    throw new Error(
                        'integer index out of range.  index ' + item +
                        ' for size ' + this_shape
                    );
                }

            } else if (ndarray_module.isndarray(item) && item.dtype.indexOf('bool') < 0) {
                // item = item + (item < 0) * this_shape;
                // index[i] = np.add(item, np.mul(np.lt(item, 0), this_shape));
            }
        }
    };  // exported.normalize_index

    /**
     * Expand dimensions of an array to match with np.newaxis.
     * This expands dimensions of a given array where np.newaxis
     * are given.  np.newaxis in `index` is replaced with `0:1`.
     * This returns a view of the original array.
     * @param {ndarray} a
     * @param {object[]} index
     * @returns {ndarray} out
     */
    exported.expand_newaxis = function(a, index) {
        // Expand dimension at np.newaxis, and replace np.newaxis with Slices.
        var newaxis_pos = [];
        var i;
        for (i = 0; i < index.length; i++) {
            if (index[i] == exported.newaxis) {
                newaxis_pos.push(i);
                index[i] = new exported.Slice(0, 1, 1);
            }
        }
        for (i = 0; i < newaxis_pos.length; i++) {
            a = exported.expand_dims(a, newaxis_pos[i]);
        }
        return a;
    };  // exported.expand_newaxis
    // }}} index preprocessing

    /**
     * Return an array with contiguous memory.
     * @param {ndarray} a
     * @returns {ndarray} out
     */
    var ascontiguous = exported.ascontiguous = function(a) {
        var default_stride = helper.default_stride(a.shape);
        var i;
        var already_contiguous = true;
        for (i = 0; i < a.ndim; i++) {
            if (default_stride[i] != a.stride[i]) {
                already_contiguous = false;
                break;
            }
        }
        if (already_contiguous)
            return a;
        var ret = constructor_module.zeros(a.shape, a.dtype);
        var it = helper.iterator_from_shape(a.shape);
        var v = it.next();
        i = 0;
        while (!v.done) {
            ret.buffer[i] = get(a, v.value);
            v = it.next();
            i++;
        }
        return ret;
    };

    return exported;
}));
