(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.reshape_module = definition();
    }
}(this, function () {
    "use strict";

    var dtype_module = require('./dtype');
    var helper = require('./helper');
    var internal = require('./internal');
    var ndarray_module = require('./ndarray');
    var constructor_module = require('./constructor');
    var indexing = require('./indexing');

    var exported = {};

    exported._set_alias = function(np) {
        var key;
        for (key in exported) {
            np[key] = exported[key];
        }
    };

    /**
     * Reshape an np.ndarray to a given shape.
     * @param {array-like} a
     * @param {int[]} axis
     * @returns {array-like} - This will be a new view object if possible;
     *                         otherwise, it will be a copy.
     */
    var reshape = exported.reshape = function(a, shape) {
        // TODO Check details.  Some shape may be invalid, or require copying data?
        var i = 0;
        var is_same_shape = true;
        // Get all arguments except the first one (which should be ndarray).
        shape = Array.prototype.slice.call(arguments, 1);
        if ((shape.length == 1) && Array.isArray(shape[0])) {
            // If there is only one argument and which is an Array.
            shape = shape[0];
        }
        if (shape.indexOf(-1) >= 0) {  // If there is an unspecified value.
            var nonnegatives = shape.slice();
            nonnegatives.splice(shape.indexOf(-1), 1);  // Remove an -1.
            var prod = internal.prod_jsarray(nonnegatives);
            if (a.size % prod != 0) {
                throw new Error(
                    'invalid shape [' + shape + '] for an array of shape [' +
                    a.shape + '].'
                );
            }
            shape[shape.indexOf(-1)] = a.size / prod;
        }
        if (shape.length == a.shape.length) {
            for (i = 0; i < shape.length; i++) {
                if (shape[i] != a.shape[i]) {
                    is_same_shape = false;
                    break;
                }
            }
        } else {
            is_same_shape = false;
        }

        if (is_same_shape) {
            // If a user requested the same shape, return the given array.
            return a;
        }

        // TODO
        // np.testing.assert_ndarray_equal(a.size,  internal.prod_jsarray(shape));
        return new ndarray_module.ndarray(a.buffer, shape, a.dtype);
    };  // np.reshape

    // Remove single-dimensional entries from the shape of an array.
    var squeeze = exported.squeeze = function(a, axis) {
        a = ndarray_module.asarray(a);
        if (axis < -a.shape.length || axis >= a.shape.length) {
            throw new Error(
                'invalid axis ' + axis + ' for ' + a.shape.length + ' dimensional array.'
            );
        } else if (axis < 0) {
            axis = axis + a.shape.length;
        }
        var buffer = a.buffer;
        var shape = a.shape.slice();
        if (shape[axis] != 1) {
            throw new Error(
                'given axis ' + axis + ' is not singvaron in shape [' +
                a.shape + '].'
            );
        }
        shape.splice(axis, 1);  // Remove an axis.
        var dtype = a.dtype;
        return new ndarray_module.ndarray(buffer, shape, dtype);
    };  // np.squeeze

    // Flatten a given array and return it's copy.
    var flatten = exported.flatten = function(a) {
        var buffer = a.buffer;
        var shape = [a.shape.reduce(function(t, v) {return t*v;})];
        var dtype = a.dtype;
        var array = new ndarray_module.ndarray(buffer, shape, dtype);
        return array;
    };  // np.flatten

    // Flatten a given array and return it's view.
    var ravel = exported.ravel = function(a) {
        return reshape(a, -1);
    };  // np.ravel

    // Return repeated array to match with a given shape.
    // Note this actually copies the data.
    // TODO Return x if possible.
    var broadcast_to = exported.broadcast_to = function(x, shape) {
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
        it = internal.iterator_from_shape(ret.shape);
        var v = it.next();
        var to_index, from_index;
        while (!v.done) {
            to_index = v.value;
            from_index = to_index.slice();
            for (i in clampled_axes) {
                from_index[clampled_axes[i]] = 0;
            }
            from_index = from_index.slice(num_paddings);
            indexing.setitem(ret, to_index, indexing.getitem(x, from_index));
            v = it.next();
        }
        return ret;
    };  // np.broadcast_to

    // Return arrays which are broadcasted against each others.
    var broadcast_arrays = exported.broadcast_arrays = function(/*arrays...*/) {
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

    // Permute the dimensions of an array. TODO
    // a : array_like
    // axes : Array of ints, optional
    var transpose = exported.transpose = function(a, axes) {
        a = ndarray_module.asarray(a);
        if (axes === undefined) {
            axes = constructor_module.arange(a.shape.length-1, -1, -1).tojs();
        }
        var numel = internal.prod_jsarray(a.shape);
        var shape = axes.map(function(x) {return a.shape[x];});
        var stride = axes.map(function(x) {return a.stride[x];});
        var dtype = a.dtype;
        return new ndarray_module.ndarray(a.buffer, shape, a.dtype, a.offset, stride);
        // var ArrayBuffer = dtype_module.arraybuffer[dtype];
        // var buffer = new ArrayBuffer(numel);
        // var indices = shape.map(function(x) {return constructor_module.arange(x).tojs();});
        // var en;
        // for (en of itertools.enumerate(itertools.product(...indices))) { // TODO
        //     var ii = en[0];
        //     var take = en[1];
        //     take = np.dot(take, stride);
        //     buffer[ii] = a.buffer[take];
        // }
        // return new ndarray_module.ndarray(buffer, shape, dtype);
    };  // np.transpose

    // Interchange two axes of an array.
    // a : array_like
    // axis1, axis2 : int
    var swapaxes = exported.swapaxes= function(a, axis1, axis2) {
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

    return exported;
}));
