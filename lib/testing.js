"use strict";

let np = {};

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
    let exit_hook = () => {};
    if (assert !== undefined && options._nested_call === undefined) {
        exit_hook = () => assert.ok(true, 'given object is array-like');
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

    let exit_hook = () => {};
    if (assert !== undefined && options._nested_call === undefined) {
        exit_hook = () => assert.ok(true, 'given objects are close');
    }
    let fail_hook;
    if (assert) {
        fail_hook = (msg) => {assert.ok(false, msg);};
    } else {
        fail_hook = (msg) => {throw new Error(msg);};
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
            fail_hook('x has length ' + x.length + ' but y has length ' + y.length);
            return;
        }
        for (let i=0; i<x.length; i++) {
            try {
                np.testing.assert_allclose(x[i], y[i], options);
            } catch(e) {
                fail_hook('element ' + i + ' is not close.  ' + x[i] + ' vs ' + y[i]);
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
                "given scalars does not match.  " + String(x) + " != " + String(y);
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
        return Array.isArray(x) || typeof x == 'number' || typeof x == 'boolean';
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


/* If this is run on Node.js, export the module. */
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = np.testing;
  }
  exports.np = np.testing;
}
