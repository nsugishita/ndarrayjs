(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.ndarray_module = definition();
    }
}(this, function () {
    "use strict";

    var dtype_module = require('./dtype');
    var helper = require('./helper');
    var internal = require('./internal');

    var exported = {};

    exported._set_alias = function(np) {
        np.ndarray = exported.ndarray;
        np.asarray = exported.asarray;
        np.isndarray = exported.isndarray;
    };

    var ndarray;
    /**
     * Array object to represent a multidimensional, homogeneous array.
     * This is not supposed to be called by a user.  Use np.array or
     * np.asarray to create a new array from a buffer/Array.
     * For developers, this is a function constructor so make sure to use
     * the new operator.
     * @param {buffer|Array|ndarray} buffer - Object holding data.
     * @param {int[]} shape - Shape of created array.
     * @param {string} dtype - Data type of elements.
     * @param {int} [offset=0] - Offset of array data in buffer.
     * @param {int[]} [stride] - Strides of data in memory.
     * @param {Boolean} [check=true] - Check whether given data is consistent or not.
     * @returns {ndarray} A new array with given data.
     */
    ndarray = exported.ndarray = function(buffer, shape, dtype, offset, stride, check) {
        // TODO Check properties.
        if (offset == undefined) {
            offset = 0;
        }
        if (stride == undefined) {
            stride = internal.default_stride(shape);
        }
        this.shape = shape;
        if (shape.length >= 1) {
            this.size = shape.reduce(function (acc, val) {return acc * val;});
        } else {
            this.size = 1;
        }
        this.ndim = shape.length;
        if (dtype == undefined) {
            this.dtype = dtype_module.float;
        } else {
            this.dtype = dtype;
        }
        if (!isNaN(buffer)) {
            var tmp = buffer;
            buffer = new dtype_module.arraybuffer[this.dtype](1);
            buffer[0] = tmp;
        }
        this.buffer = buffer;
        this.offset = offset;
        this.stride = stride;
        this.__ndarray__ = true;
    };

    ndarray.prototype.tojs = function() {
        if (this.shape.length == 0) {
            return this.buffer[0];
        } else {
            return internal.reshape_jsarray(
                this.buffer, this.shape, this.offset, this.stride
            );
        }
    };

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
    exported.asarray = function(buffer, shape, dtype, offset, stride, check) {
        if (exported.isndarray(buffer)) {
            if (dtype === undefined) {
                return buffer;
            } else {
                return exported.astype(buffer, dtype);  // TODO
            }
        }
        dtype = dtype || dtype_module.float;
        var flattened = internal.flatten_jsarray(buffer);
        if (helper.use_arraybuffer()) {
            if (Array.isArray(buffer)) {
                if (!Array.isArray(shape)) {
                    shape = helper.get_nested_array_shape(
                        buffer, {throw_if_fail: true});
                }
                var TypedArray = dtype_module.arraybuffer[dtype];
                buffer = new TypedArray(flattened.length);
                var i;
                for (i = 0; i < flattened.length; i++) {
                    buffer[i] = flattened[i];
                }
                return new ndarray(buffer ,shape, dtype, offset, stride, check);
            } else if (helper.isTypedArray(buffer)) {
                shape = shape || [buffer.length];
                return new ndarray(buffer, shape, dtype, offset, stride, check);
            } else if (!isNaN(buffer)) {
                shape = shape || [];
                return new ndarray(buffer, shape, dtype, offset, stride, check);
            } else {
                throw new Error('invalid argument ' + (typeof buffer));
            }
        } else {
            if (!Array.isArray(shape)) {
                shape = helper.get_nested_array_shape(
                    buffer, {throw_if_fail: true});
            }
            return new ndarray(flattened, shape, dtype, offset, stride, check);
        }
    };  // np.asarray

    exported.isndarray = function(a) {
        return (a !== null) && (a !== undefined) && (a.__ndarray__ !== undefined);
    };

    // /**
    //  * Reshape an np.ndarray to a given shape.
    //  * @param {array-like} a
    //  * @param {int[]} axis
    //  * @returns {array-like} - This will be a new view object if possible;
    //  *                         otherwise, it will be a copy.
    //  *
    //  * It is not always possible to change the shape of an array without
    //  * copying the data. If you want an error to be raised when the data
    //  * is copied, you should assign the new shape to the shape attribute
    //  * of the array.
    //  */
    // exported.reshape = function(a, shape) {
    //     var i = 0;
    //     var is_same_shape = true;
    //     // Get all arguments except the first one (which should be ndarray).
    //     shape = Array.prototype.slice.call(arguments, 1);
    //     if ((shape.length == 1) && Array.isArray(shape[0])) {
    //         // If there is only one argument and which is an Array.
    //         shape = shape[0];
    //     }
    //     if (shape.indexOf(-1) >= 0) {  // If there is an unspecified value.
    //         var nonnegatives = shape.slice();
    //         nonnegatives.splice(shape.indexOf(-1), 1);  // Remove an -1.
    //         var prod = internal.prod_jsarray(nonnegatives);
    //         if (a.size % prod != 0) {
    //             throw new Error(
    //                 'invalid shape [' + shape + '] for an array of shape [' +
    //                 a.shape + '].'
    //             );
    //         }
    //         shape[shape.indexOf(-1)] = a.size / prod;
    //     }
    //     if (shape.length == a.shape.length) {
    //         for (i = 0; i < shape.length; i++) {
    //             if (shape[i] != a.shape[i]) {
    //                 is_same_shape = false;
    //                 break;
    //             }
    //         }
    //     } else {
    //         is_same_shape = false;
    //     }
    //
    //     if (is_same_shape) {
    //         // If a user requested the same shape, return the given array.
    //         return a;
    //     }
    //
    //     // >> Old version
    //     // // If a is not contiguous, make an copy.
    //     // // TODO Even if a is not contiguous, we can make a view
    //     // // (for example, from [5, 4, 3] to [5, 2, 2, 3]).
    //     // a = exported.ascontiguousarray(a);  // TODO
    //     // a.shape = shape;
    //     // a.sride = 0;  // TODO
    //     // return a;
    //     // <<
    //
    //     // TODO
    //     // np.testing.assert_ndarray_equal(a.size,  internal.prod_jsarray(shape));
    //     return new ndarray(a.buffer, shape, a.dtype);
    // };  // np.reshape

    // ndarray.prototype.reshape = function() {
    //     var reshape_module = require('./reshape');
    //     var shape = Array.prototype.slice.call(arguments, 0);
    //     return reshape_module.reshape(this, shape);
    // };

    return exported;
}));
