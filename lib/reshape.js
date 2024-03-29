"use strict";

var dtype_module = require('./dtype');
var helper = require('./helper');
var jsarray = helper.jsarray;
var ndarray_module = require('./ndarray');
var constructor_module = require('./constructor');

module.exports._set_alias = function(np) {
    var key;
    for (key in module.exports) {
        if (key.startsWith('_'))
            continue;
        np[key] = module.exports[key];
    }
};

/**
 * Return an array with contiguous memory.
 * @param {ndarray} a
 * @returns {ndarray} out
 */
var ascontiguous = module.exports.ascontiguous = function(a) {
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
        ret.buffer[i] = ndarray_module.getitem(a, v.value);
        v = it.next();
        i++;
    }
    return ret;
};

/**
 * Reduce as many dimensions as possible without copying data.
 * @param {array-like} a
 * @returns {array-like} array with reduced dimensions.
 */
var _merge_dims = module.exports._merge_dims = function(a) {
    var i, n = a.ndim;
    var shape = a.shape.slice();
    var stride = a.stride.slice();
    for (i = 0; i < n - 1; i++) {
        if (stride[n - i - 1] * shape[n - i - 1] == stride[n - i - 2]) {
            shape[n - i - 1] *= shape[n - i - 2];
            shape.splice(n - i - 2, 1);
            stride.splice(n - i - 2, 1);
        }
    }
    return new ndarray_module.ndarray(a.buffer, shape, a.dtype, a.offset, stride);
};

/**
 * Compute strides of a reshaped array.
 * If reshaping is not possible without copying, this returns undefined.
 * @param {array-like} a - array to be reshaped
 * @param {int[]} shape - new shape
 * @returns {int[]} strides or undefined
 */
var _get_reshaped_stride = module.exports._get_reshaped_stride = function(a, shape) {
    var current_axis = a.ndim - 1;
    var current_factor = 1;
    var i;
    // Number of dimensions of the new array after removing those of size 1.
    var n;
    // For each axis in the new array, store the `original` axis in `a`.
    var original_axis = [];
    var remaining_shape = a.shape[current_axis];
    var ret = [];
    // stride of the i-th axis (after removing dimensions of 1) in
    // the new array will be
    // stride_factor[i] * a.stride[original_axis[i]].
    var stride_factor = [];
    // Remove dimensions of size 1.
    var stripped_shape = shape.filter(function(x) {return x != 1;});
    n = stripped_shape.length;
    for (i = 0; i < n ; i++) {
        if (remaining_shape % stripped_shape[n - i - 1] != 0) {
            return undefined;
        } else if (remaining_shape == stripped_shape[n - i - 1]) {
            original_axis.unshift(current_axis);
            stride_factor.unshift(current_factor);
            current_axis -= 1;
            current_factor = 1;
            remaining_shape = a.shape[current_axis];
        } else {
            original_axis.unshift(current_axis);
            stride_factor.unshift(current_factor);
            current_factor *= stripped_shape[n - i - 1];
            remaining_shape /= stripped_shape[n - i - 1];
        }
    }
    for (i = 0; i < stride_factor.length; i++) {
        ret.push(stride_factor[i] * a.stride[original_axis[i]]);
    }
    // Now, put the dimensions of size 1 back.
    // For convenience, first append the last element at the end.
    // We'll remove this later.
    ret.push(ret[ret.length - 1]);
    for (i = 0; i < shape.length; i++) {
        if (shape[i] == 1) {
            ret.splice(i, 0, ret[i]);
        }
    }
    // Remove the extra element added at the end.
    ret.splice(ret.length-1, 1);
    return ret;
};

/**
 * Reshape an np.ndarray to a given shape.
 * @param {array-like} a
 * @param {int[]} shape
 * @returns {array-like} - This will be a new view object if possible;
 *                         otherwise, it will be a copy.
 */
var reshape = module.exports.reshape = function(a, shape) {
    var i = 0;
    var is_same_shape = true;
    var stride;
    var nonnegatives;
    var prod;
    // Get all arguments except the first one (which should be ndarray).
    shape = Array.prototype.slice.call(arguments, 1);
    if ((shape.length == 1) && Array.isArray(shape[0])) {
        // If there is only one argument and which is an Array.
        shape = shape[0];
    }
    if (shape.indexOf(-1) >= 0) {  // If there is an unspecified value.
        nonnegatives = shape.slice();
        nonnegatives.splice(shape.indexOf(-1), 1);  // Remove an -1.
        prod = jsarray.prod(nonnegatives);
        if (a.size % prod != 0) {
            throw new Error(
                'invalid shape [' + shape + '] for an array of shape [' +
                a.shape + '].'
            );
        }
        shape[shape.indexOf(-1)] = a.size / prod;
    }
    // Reduce dimensions of `a`.
    a = _merge_dims(a);
    stride = _get_reshaped_stride(a, shape);
    if (stride !== undefined) {  // We can reshape `a` without copying data.
        return new ndarray_module.ndarray(
            a.buffer, shape, a.dtype, a.offset, stride
        );
    } else {  // We need to copy `a` so that the data is contiguous.
        a = ascontiguous(a);
        return new ndarray_module.ndarray(a.buffer, shape, a.dtype);
    }
};  // reshape

// Remove single-dimensional entries from the shape of an array.
var squeeze = module.exports.squeeze = function(a, axis) {
    var i;
    var shape = a.shape.slice(), stride = a.stride.slice();
    a = ndarray_module.asarray(a);
    if (axis === undefined) {
        for (i = 0; i < a.ndim; i++) {
            if (a.shape[a.ndim - i - 1] == 1) {
                shape.splice(a.ndim - i - 1, 1);
                stride.splice(a.ndim - i - 1, 1);
            }
        }
    } else {
        if (axis < -a.shape.length || axis >= a.shape.length) {
            throw new Error(
                'invalid axis ' + axis + ' for ' + a.shape.length + ' dimensional array.'
            );
        } else if (axis < 0) {
            axis = axis + a.shape.length;
        }
        if (shape[axis] != 1) {
            throw new Error(
                'given axis ' + axis + ' is not singvaron in shape [' +
                a.shape + '].'
            );
        }
        shape.splice(axis, 1);  // Remove an axis.
        stride.splice(axis, 1);  // Remove an axis.
    }
    return ndarray_module.asarray(a.buffer, shape, a.dtype, a.offset, stride);
};  // np.squeeze

// Flatten a given array and return its view or copy.
var flatten = module.exports.flatten = function(a) {
    return module.exports.reshape(a, a.size);
};  // np.flatten

// Flatten a given array and return its view or copy.
var ravel = module.exports.ravel = module.exports.flatten;

// Return repeated array to match with a given shape.
// Note this actually copies the data.
// TODO Return x if possible.
var broadcast_to = module.exports.broadcast_to = function(x, shape) {
    var i, it, ret;
    x = ndarray_module.asarray(x);
    if (x.shape.length > shape.length) {
        throw new Error('dimension mismatch.  expected at least ' + x.shape.length +
            ' but got ' + shape.length
        );
    } else if (x.shape.length == 0) {
        ret = constructor_module.zeros(shape, dtype_module.float);
        for (i = 0; i < ret.buffer.length; i++) {
            ret.buffer[i] = x.buffer[0];
        }
        return ret;
    }
    var x_shape = x.shape.slice();
    var num_paddings = shape.length - x.shape.length;
    for (i = 0; i < num_paddings; i++) {
        x_shape = [1].concat(x_shape);
    }
    var clampled_axes = [];
    for (i = 0; i < shape.length; i++) {
        if (x_shape[i] != shape[i]) {
            if (x_shape[i] != 1) {
                throw new Error(
                    'cannot broadcast an array of shape ' + x.shape +
                    ' to shape ' + shape
                );
            }
            clampled_axes.push(i);
        }
    }
    ret = constructor_module.zeros(shape, x.dtype);
    it = helper.iterator_from_shape(ret.shape);
    var v = it.next();
    var to_index, from_index;
    while (!v.done) {
        to_index = v.value;
        from_index = to_index.slice();
        for (i in clampled_axes) {
            from_index[clampled_axes[i]] = 0;
        }
        from_index = from_index.slice(num_paddings);
        ndarray_module.setitem(ret, to_index, ndarray_module.getitem(x, from_index));
        v = it.next();
    }
    return ret;
};  // np.broadcast_to

// Return arrays which are broadcasted against each others.
var broadcast_arrays = module.exports.broadcast_arrays = function(/*arrays...*/) {
    var arrays = Array.prototype.slice.call(arguments, 0);
    if ((arrays.length == 1) && (Array.isArray(arrays[0]))) {
        arrays = arrays[0];
    }
    arrays = arrays.map(function(a) {return ndarray_module.asarray(a);});
    var shapes = arrays.map(function(a) {return a.shape;});
    var ndim = Math.max.apply(undefined, shapes.map(function(s) {return s.length;}));
    var extended_shapes = [];
    var i, j;
    for (i in shapes) {
        var num_paddings = ndim - shapes[i].length;
        var extended_shape = shapes[i].slice();
        for (j = 0; j < num_paddings; j++) {
            extended_shape = [1].concat(extended_shape);
        }
        extended_shapes.push(extended_shape);
    }
    var new_shape = [];
    var getter = function(i) {
        return function(x) {
            return x[i];
        };
    };
    for (i = 0; i < ndim; i++) {
        var dims = extended_shapes.map(getter(i));
        var max_dims = Math.max.apply(undefined, dims);
        for (j = 0; j < arrays.length; j++) {
            if ((extended_shapes[j][i] != 1) & (extended_shapes[j][i] != max_dims)) {
                var msg = 'cannot broadcast arrays of shapes ';
                for (var s in shapes) {
                    if (s > 0)
                        msg += ', ';
                    msg += '[' + shapes[s] + ']';
                }
                throw new Error(msg);
            }
        }
        new_shape.push(max_dims);
    }
    return arrays.map(function(a) {return broadcast_to(a, new_shape);});
};  // np.broadcast_arrays

// Permute the dimensions of an array.
// a : array_like
// axes : Array of ints, optional
var transpose = module.exports.transpose = function(a, axes) {
    a = ndarray_module.asarray(a);
    if (axes === undefined) {
        axes = constructor_module.arange(a.shape.length-1, -1, -1).tojs();
    }
    var numel = jsarray.prod(a.shape);
    var shape = axes.map(function(x) {return a.shape[x];});
    var stride = axes.map(function(x) {return a.stride[x];});
    var dtype = a.dtype;
    return new ndarray_module.ndarray(a.buffer, shape, a.dtype, a.offset, stride);
};  // np.transpose

// Interchange two axes of an array.
// a : array_like
// axis1, axis2 : int
var swapaxes = module.exports.swapaxes= function(a, axis1, axis2) {
    var ndim = a.shape.length;
    if ((axis1 < -ndim) || (axis1 >= ndim) || (axis2 < -ndim) || (axis2 >= ndim)) {
        throw new Error(
            'invalid axis ' + axis1 + ' and ' + axis2 + ' for ' + ndim +
            ' dimensional array'
        );
    }
    if (axis1 < 0) {
        axis1 = axis1 + ndim;
    }
    if (axis2 < 0) {
        axis2 = axis2 + ndim;
    }
    var axes = constructor_module.arange(a.shape.length).tojs();
    axes[axis1] = axis2;
    axes[axis2] = axis1;
    return transpose(a, axes);
};  // np.swapaxes
