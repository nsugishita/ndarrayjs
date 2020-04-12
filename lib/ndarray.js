"use strict";

let helper = require('./helper.js');

/**
 * Return a new ndarray instance with given data.
 * This create a new ndarray instance.  Given data is copied and stored
 * in the new ndarray instance.
 * @param {buffer|Array|ndarray} buffer - Object holding data.
 * @param {int[]} shape - Shape of created array.
 * @param {string} dtype - Data type of elements.
 * @returns {ndarray} New ndarray.
 */
let array = function(buffer, shape, dtype) {
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
let asarray = function(buffer, shape, dtype) {
    return ndarray(shape, dtype, buffer);
};


/**
 * Array object to represent a multidimensional, homogeneous array.
 * This is not supposed to be called.  Use np.array or np.asarray
 * to create a new array from a buffer/Array.
 * For developers, this is not supposed to be called
 * with new operator (it does not harm but it is pointless).
 * This returns a callable instance, which inherit ndarray if possible.
 * @param {int[]} shape - Shape of created array.
 * @param {string} dtype - Data type of elements.
 * @param {buffer|Array|ndarray} buffer - Object holding data.
 * @param {int} [offset=0] - Offset of array data in buffer.
 * @param {int[]} [stride] - Strides of data in memory.
 * @param {bool} [check=true] - Check whether given data is consistent or not.
 * @returns {ndarray} A new array with given data, possibly inherited from ndarray.
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

    if (helper.get_mode() == 'es6') {
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
        for (let i=0; i<shape.length-1; i++) {
            stride.push(tmp);
            tmp *= shape[shape.length-i-1];
        }
    }

    instance._shape = shape;
    instance.dtype = dtype;
    instance.buffer = buffer;
    instance.offset = offset;
    instance.stride = stride;

    if (check) {
        check_shape(shape);
    }

    // Seems we can't copy setters/getters from prototype
    // when __proto__ is not available.
    // To be safe, let's define them here.
    Object.defineProperty(instance, 'shape', {
        set(shape) {
            check_shape(shape);
            this._shape = shape;
        },
        get() {
            return this._shape;
        }
    });

    Object.defineProperty(instance, 'size', {
        get() {
            return from_shape_to_size(this.shape);
        }
    });

    Object.defineProperty(instance, 'ndim', {
        get() {
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


module.exports = {
    array: array,
    asarray: asarray,
    ndarray: ndarray
};
