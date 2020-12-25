(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.function = definition();
    }
}(this, function () {
    "use strict";

    var dtype_module = require('./dtype');
    var reshape_module = require('./reshape');
    var ndarray_module = require('./ndarray');
    var constructor_module = require('./constructor');
    var internal = require('./internal');
    var indexing = require('./indexing');
    var ufunc = require('./ufunc');

    var exported = {};

    exported._set_alias = function(np) {
        var key;
        for (key in exported) {
            np[key] = exported[key];
        }
    };

    // Sum of array elements over a given axis.
    // axis, dtype and out are optional.
    // To only specify dtype, and leave axis unspecified,
    // one can call `np.sum(a, np.None, dtype)` (not yet implemented).
    var sum = exported.sum = function(x, axis, dtype, out) {
        var it, v, ret, new_shape, value, from_index, to_index;
        x = ndarray_module.asarray(x);
        dtype = (dtype == undefined) ? dtype_module.float : dtype;
        var shape = x.shape;
        if ((axis == undefined) || axis == '_') {
            x = reshape_module.ravel(x).tojs();
            return x.reduce(function(t, v) {return t+v;}, 0.0);
        } else {
            new_shape = shape.slice();
            new_shape.splice(axis, 1);
            // Create an array to store the result.
            ret = constructor_module.zeros(new_shape, dtype);
            it = internal.iterator_from_shape(x.shape);
            v = it.next();
            while (!v.done) {
                from_index = v.value;
                to_index = from_index.slice();
                to_index.splice(axis, 1);
                value = indexing.getitem(x, from_index);
                indexing.setitem(ret, to_index, indexing.getitem(ret, to_index) + value);
                v = it.next();
            }
            return ret;
        }
    };  // np.sum

    var cumsum = exported.cumsum = function(x, axis, dtype, out) {
        var i, tmp;
        x = ndarray_module.asarray(x);
        dtype = (dtype == undefined) ? dtype_module.float : dtype;
        if (axis == undefined) {
            dtype = dtype || x.dtype;
            x = reshape_module.ravel(np.asarray(x));
            if (out === undefined)
                out = np.zeros(x.shape, dtype=dtype);
            tmp = 0;
            for (i=0; i<x.shape[0]; i++) {
                tmp = tmp + indexing.getitem(x, [i]);
                indexing.setitem(out, [i], tmp);
            }

            return out;
        } else {
            throw new Error('not implemented');
        }
    };  // np.cumsum

    // Return the product of array elements over a given axis.
    // axis, dtype and out are optional.
    // To only specify dtype, and leave axis unspecified,
    // one can call `np.sum(a, np.None, dtype)` (not yet implemented).
    var prod = exported.prod = function(x, axis, dtype) {
        var it, v, ret, new_shape, value, from_index, to_index;
        x = ndarray_module.asarray(x);
        dtype = (dtype == undefined) ? dtype_module.float : dtype;
        var shape = x.shape;
        if ((axis == undefined) || axis == '_') {
            x = reshape_module.ravel(x).tojs();
            return x.reduce(function(t, v) {return t*v;}, 1.0);
        } else {
            new_shape = shape.slice();
            new_shape.splice(axis, 1);
            // Create an array to store the result.
            ret = constructor_module.ones(new_shape, dtype);
            it = internal.iterator_from_shape(x.shape);
            v = it.next();
            while (!v.done) {
                from_index = v.value;
                to_index = from_index.slice();
                to_index.splice(axis, 1);
                value = indexing.getitem(x, from_index);
                indexing.setitem(ret, to_index, indexing.getitem(ret, to_index) * value);
                v = it.next();
            }
            return ret;
        }
    };  // np.prod

    // Return dot product of two arrays.
    var dot = exported.dot = function(x, y) {
        if (x instanceof np.ndarray) {
            x = x.buffer;
        } else if (typeof(x) == 'number') {
            x = [x];
        }
        if (y instanceof np.ndarray) {
            y = y.buffer;
        } else if (typeof(y) == 'number') {
            y = [y];
        }
        return internal.dot_jsarray(x, y);
    };  // np.dot

    // Return a matrix product of two arrays.
    var matmul = exported.matmul = function(x, y, out) {
        if (out !== undefined) {
            throw new Error('out argument in np.matmul is not yet implemented');
        }
        x = ndarray_module.asarray(x);
        y = ndarray_module.asarray(y);
        var x_1d = false;
        var y_1d = false;
        if (x.shape.length == 1) {
            x = indexing.expand_dims(x, 0);
            x_1d = true;
        }
        if (y.shape.length == 1) {
            y = indexing.expand_dims(y, 1);
            y_1d = true;
        }
        // Now x has shape (*, a, b) and y has shape (*, b, c).
        // Reshape x into (*, a, 1, b) and transpose/reshape y into (*, 1, c, b)
        // Now broadcast x and y, and compute x * y, which has shape (*, a, c, b).
        // By summing the last axis, we get (*, a, c).
        x = indexing.expand_dims(x, -2);  // (*, a, 1, b)
        y = indexing.expand_dims(reshape_module.swapaxes(y, -1, -2), -3);  // (*, 1, c, b)
        var tmp = reshape_module.broadcast_arrays(x, y);
        x = tmp[0];  // (*, a, c, b)
        y = tmp[1];  // (*, a, c, b)
        out = sum(ufunc.mul(x, y), -1);  // (*, a, c)
        if (x_1d) {
            out = reshape_module.squeeze(out, -2);
        }
        if (y_1d) {
            out = reshape_module.squeeze(out, -1);
        }
        return out;
    };  // np.matmul

    // Compute the arithmetic mean along the specified axis.
    var mean = exported.mean = function(x, axis, dtype, out) {
        if (out != undefined) {
            throw new Error('out argument is not yet implemented');
        }
        x = ndarray_module.asarray(x);
        var sumed = sum(x, axis, dtype, out);
        if ((axis === undefined) || (axis == '_')) {
            return sumed / x.size;
        } else {
            return ufunc.div(sumed, x.shape[axis]);
        }
    };  // np.mean

    // Return the maximum of an array or maximum along an axis.
    var max = exported.max = function(x, axis, dtype, out) {
        var it, v, ret, new_shape, value, from_index, to_index;
        x = ndarray_module.asarray(x);
        dtype = (dtype == undefined) ? dtype_module.float : dtype;
        var shape = x.shape;
        if ((axis == undefined) || axis == '_') {
            return Math.max.apply(undefined, reshape_module.ravel(x).tojs());
        } else {
            new_shape = shape.slice();
            new_shape.splice(axis, 1);
            // Create an array to store the result.
            ret = constructor_module.full(new_shape, min(x), dtype);
            it = internal.iterator_from_shape(x.shape);
            v = it.next();
            while (!v.done) {
                from_index = v.value;
                to_index = from_index.slice();
                to_index.splice(axis, 1);
                value = indexing.getitem(x, from_index);
                indexing.setitem(ret, value, Math.max(indexing.getitem(ret, to_index), value));
                v = it.next();
            }
            return ret;
        }
    };  // np.max

    // Return the minimum of an array or minimum along an axis.
    var min = exported.min = function(x, axis, dtype, out) {
        var it, v, ret, new_shape, value, from_index, to_index;
        x = ndarray_module.asarray(x);
        dtype = (dtype == undefined) ? dtype_module.float : dtype;
        var shape = x.shape;
        if ((axis == undefined) || axis == '_') {
            return Math.min.apply(undefined, reshape_module.ravel(x).tojs());
        } else {
            new_shape = shape.slice();
            new_shape.splice(axis, 1);
            // Create an array to store the result.
            ret = constructor_module.full(new_shape, max(x), dtype);
            it = internal.iterator_from_shape(x.shape);
            v = it.next();
            while (!v.done) {
                from_index = v.value;
                to_index = from_index.slice();
                to_index.splice(axis, 1);
                value = indexing.getitem(x, from_index);
                indexing.setitem(ret, value, Math.min(indexing.getitem(ret, to_index), value));
                v = it.next();
            }
            return ret;
        }
    };  // np.min

    return exported;
}));
