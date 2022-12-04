/*
 * - about {{{
 *
 * This is a utility script to generate/load numpy arrays, apply
 * some basic operations and indexing/slicing on the data.
 * Those functionalities are exposed via `np` object.
 *
 * To use this script, one must load jszip, jszip-util (required to load
 * npz files).
 *
 * Currently, this is tested on mac os, firefox and chrome.
 * safari is not supported.  Also, iphone is not supported.
 * Other OS is not tested at all
 * (it seems big-endian machines are not supported, or it cannot
 * read data saved on little-endian machines and vice versa).
 *
 * }}}
 *
 * - np.ndarray class {{{
 *
 *   Functions generate or load data from disk/server return an instance
 *   of np.ndarray class.  An instance has `buffer`, `shape` and `dtype`
 *   attributes.  `buffer` is javascript ArrayBuffer of appropriate
 *   data type, which is given by `dtype`.  `shape` is a javascript
 *   Array of integers, specifying the shape of the array.
 *
 *   np.ndarray class supports (very limited subset of) indexing and
 *   slicing via `x(obj)` signature, namely a function call.
 *   Also, many methods defined on `np` object is accessible
 *   through attiributes on np.ndarray instances defined on its
 *   prototype, such as `np.mean` and `np.sum`.
 *
 *   }}}
 *
 * - data generation {{{
 *
 *   Currently there are following methods which returns a new
 *   np.ndarray instance:
 *
 *   + np.arange
 *   + np.zeros
 *   + np.ones
 *   + np.full
 *   + np.empty
 *   + np.zeros_like (TODO)
 *   + np.ones_like (TODO)
 *   + np.full_like (TODO)
 *   + np.empty_like (TODO)
 *   + np.random.rand
 *   + np.random.randint (TODO)
 *   + np.random.nrand
 *
 * }}}
 *
 * - data loading {{{
 *
 *   One can load data from disk/server by calling `np.load`.
 *   This returns a Promise instance.  When the promise is
 *   resolved, an object which contains arrays with their keys
 *   found in a npz file is passed.
 *
 *   Note that this returns a Promise instance, instead of actual
 *   data.  To write similar to python, one can wrap his/her
 *   code by async function and use await keyword.
 *
 *   }}}
 *
 * - indexing {{{
 *
 *   np.ndarray supports (very basic) indexing/slicing.  Here
 *   we use wording from the official numpy doc:
 *   https://docs.scipy.org/doc/numpy/user/basics.indexing.html
 *   https://docs.scipy.org/doc/numpy/reference/arrays.indexing.html
 *
 *   One can invoke indexing by `a(obj)` syntax, a function call.
 *   For example, `a(3, 5)` and `a(':', 0)` invokes basic slicing
 *   (see below) while `a(np.ge(a, 0))` invokes advanced indexing.
 *
 *   Note all indexing returns a copy of an original array.  There are
 *   no indexing which return a view.
 *
 *   + Basic slicing and indexing
 *     (below is a plan; many of them are not yet implemented)
 *     This is triggered when one of the followings are passed to
 *     an array:
 *     - an integer
 *     - slices (pass as a string, such as '2:3', '4::-1' or ':')
 *     - sequence of integers, slices, np.newaxis, elipsis.
 *
 *   + Advanced indexing: integer array
 *     Not yet suported. (TODO; below is an implementation plan)
 *     One can pass multiple index arrays, but each must be 1d or
 *     scalar. They are not allowed to combine with slices or np.newaxis.
 *     For example, if a is a (5, 4, 3) array, `a([2, 3], [2, 2])` or
 *     `a([3, 2, 3], 1)` is allowed (recall the broadcasting rule),
 *     but `a([2, 3], :, [1, 0])` is not (in the original numpy,
 *     this yields a (2, 4) array).
 *
 *   + Advanced indexing: boolean mask
 *     Not yet suported. (TODO; below is an implementation plan)
 *     Currently, one can pass only one boolean mask to an array,
 *     and cannot mix with other elements, such as slices or elispsis.
 *     Boolean masks are not necesarily have the same shape as the
 *     array to be indexed.
 *     For example, `a(np.le(a, 0))` or `a(np.eq(a(0), 1))` is allowed.
 *
 *   }}}
 *
 * - operations {{{
 *
 *   To work on arrays, there are a few operations available:
 *   + np.set
 *   + np.get
 *   + np.getitem
 *   + np.item
 *   + np.neg
 *   + np.add
 *   + np.sub
 *   + np.mul
 *   + np.div
 *   + np.pow
 *   + np.sum
 *   + np.cumsum
 *   + np.mean
 *   + np.var (TODO)
 *   + np.std (TODO)
 *   + np.prod
 *   + np.cumprod (TODO)
 *   + np.dot
 *   + np.matmul
 *   + np.max
 *   + np.min
 *   + np.clip (TODO)
 *   + np.argmax (TODO)
 *   + np.argmin (TODO)
 *   + np.all (TODO)
 *   + np.any (TODO)
 *   + np.abs
 *   + np.sqrt
 *   + np.cbrt
 *   + np.sin
 *   + np.cos
 *   + np.tan
 *   + np.asin (TODO)
 *   + np.acos (TODO)
 *   + np.atan (TODO)
 *   + np.sinh (TODO)
 *   + np.cosh (TODO)
 *   + np.tanh (TODO)
 *   + np.asinh (TODO)
 *   + np.acosh (TODO)
 *   + np.atanh (TODO)
 *   + np.exp
 *   + np.log
 *   + np.log2
 *   + np.log10
 *   + np.eq
 *   + np.le
 *   + np.ge
 *   + np.lt
 *   + np.gt
 *   + np.nonzero (TODO)
 *   + np.sort (TODO)
 *   + np.argsort (TODO)
 *   + np.astype
 *   + np.fill (TODO)
 *   + np.round
 *   + np.trunc
 *   + np.floor
 *   + np.ceil
 *   + np.minimum
 *   + np.maximum
 *   + np.repeat (TODO)
 *   + np.tile (TODO)
 *   + np.reshape
 *   + np.broadcast_to
 *   + np.broadcast_arrays
 *   + np.transpose
 *   + np.moveaxis (TODO)
 *   + np.swapaxis
 *   + np.squeeze
 *   + np.expand_dims
 *   + np.flatten
 *   + np.ravel
 *   + np.stack (TODO)
 *   + np.concatenate (TODO)
 *
 *   Note that many of the above operations return a copy, even though
 *   the name implies view.  For examples, broadcast_to returns
 *   a copy if actual reshaping is required.
 *
 *   }}}
 *
 * - debugging utilities {{{
 *
 *   To check the content of an array, one can call `x.dump`/`x.dumps`.
 *   Also, `np.testing.assert_ndarray_allclose` and `np.testing.assert_ndarray_equal`
 *   could be used to quickly check two arrays are close.
 *
 *   }}}
 *
 */

/**
 * This is the package overview, denoted by the `@packageDocumentation` tag at the end.
 *
 * In this first section, you can provide a quick summary of your package.
 *
 * @remarks
 * In the remarks section, you can expand on important concepts.
 *
 * Inside documentation comments, you can use all the features supported by the
 * {@link https://github.com/microsoft/tsdoc | TSDoc standard} such as:
 *
 * @example
 * Links:
 * {@link https://www.example.com}
 *
 * Links with custom text:
 * {@link https://www.example.com | Example.com}
 *
 * Links to declarations in your own package:
 * {@link someFunction},
 * {@link SomeClass.someMethod | someMethod from SomeClass}
 *
 * Links to declarations in other packages:
 * {@link short-time-ago#timeAgo | timeAgo function from package `short-time-ago`}
 *
 * @example
 * Inline code:
 * `ENV_VAR='true'`
 *
 * @example
 * Code blocks:
 * ```typescript
 * // someFile.ts
 *
 * const foo = 42;
 * ```
 *
 * @see {@link https://github.com/microsoft/tsdoc | TSDoc repository} for the standard
 * @see {@link https://microsoft.github.io/tsdoc | TSDoc playground} for more examples
 *
 * @packageDocumentation
 */

"use strict";

var np = module.exports;

var ndarray_module = require('./ndarray');
ndarray_module._set_alias(np);
np.dtype = require('./dtype');
np.dtype._set_alias(np);
np.indexing = require('./indexing');
np.indexing._set_alias(np);
np.reshape_module = require('./reshape');
np.reshape_module._set_alias(np);
np.constructor = require('./constructor');
np.constructor._set_alias(np);
np.load_module = require('./load');
np.load_module._set_alias(np);
np.ufunc = require('./ufunc');
np.ufunc._set_alias(np);
np.function = require('./function');
np.function._set_alias(np);
np.random = require('./random');
np.helper = require('./helper');
np.helper._set_alias(np);
np.testing = require('./testing');
var alias = require('./alias');
alias._set_ndarray_methods(np);

/**
 * Reshape an np.ndarray to a given shape.
 * @memberof ndarray
 * @param {int[]} shape
 * @returns {array-like} This will be a new view object if possible;
 *                       otherwise, it will be a copy.
 */
np.ndarray.prototype.reshape = function() {
    var shape = Array.prototype.slice.call(arguments, 0);
    return np.reshape_module.reshape(this, shape);
};

np.ndarray.prototype.get = function(index) {
    return np.indexing.get(this, index);
};

np.ndarray.prototype.set = function(index, value) {
    return np.indexing.set(this, index, value);
};

np.tojs = function(a) {
    if (a == undefined)
        return a;
    if (a instanceof np.ndarray)
        return a.tojs();
    return a;
};

np.broadcast_arrays = np.reshape_module.broadcast_arrays;
