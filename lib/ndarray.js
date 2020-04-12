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
    return ndarray(buffer, shape, dtype);
};


/**
 * Array object to represent a multidimensional, homogeneous array.
 * This is not supposed to be called.  Use np.array or np.asarray
 * to create a new array from a buffer/Array.
 * For developers, this is not supposed to be called
 * with new operator (it does not harm but it is pointless).
 * This returns a callable instance, which inherit ndarray if possible.
 * @param {buffer|Array|ndarray} buffer - Object holding data.
 * @param {int[]} shape - Shape of created array.
 * @param {string} dtype - Data type of elements.
 * @returns {ndarray} A new array with given data, possibly inherited from ndarray.
 */
let ndarray = function(buffer, shape, dtype) {
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

    instance.buffer = buffer;
    instance._shape = shape;
    instance.dtype = dtype;

    // Seems we can't copy setters/getters from prototype
    // when __proto__ is not available.
    // To be safe, let's define them here.
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

    Object.defineProperty(instance, 'shape', {
        set(x) {
            // Maybe we should check the new shape here.
            this._shape = x;
        },
        get() {
            return this._shape;
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
