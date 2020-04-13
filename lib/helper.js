"use strict";

let np = {};
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

    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
        // If Internet Explorer, return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
    } else {
        // If another browser, return 0
        return 0;
    }
})();


/* True if es6 __proto__ is available. */
np.helper.is_es6_supported = (np.helper.msieversion == 0 || np.helper.msieversion == 11);


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

/* globals BigUint64Array */
/* globals BigInt64Array */
if (typeof Uint8Array != 'undefined')
    np.helper.ArrayBufferUint8 = Uint8Array;
else
    np.helper.ArrayBufferUint8 = undefined;
if (typeof Uint16Array != 'undefined')
    np.helper.ArrayBufferUint16 = Uint16Array;
else
    np.helper.ArrayBufferUint16 = undefined;
if (typeof Uint32Array != 'undefined')
    np.helper.ArrayBufferUint32 = Uint32Array;
else
    np.helper.ArrayBufferUint32 = undefined;
if (typeof BigUint64Array != 'undefined')
    np.helper.ArrayBufferUint64 = BigUint64Array;
else
    np.helper.ArrayBufferUint64 = undefined;
if (typeof Int8Array != 'undefined')
    np.helper.ArrayBufferInt8 = Int8Array;
else
    np.helper.ArrayBufferInt8 = undefined;
if (typeof Int16Array != 'undefined')
    np.helper.ArrayBufferInt16 = Int16Array;
else
    np.helper.ArrayBufferInt16 = undefined;
if (typeof Int32Array != 'undefined')
    np.helper.ArrayBufferInt32 = Int32Array;
else
    np.helper.ArrayBufferInt32 = undefined;
if (typeof BigInt64Array != 'undefined')
    np.helper.ArrayBufferInt64 = BigInt64Array;
else
    np.helper.ArrayBufferInt64 = undefined;
if (typeof Float32Array != 'undefined')
    np.helper.ArrayBufferFloat32 = Float32Array;
else
    np.helper.ArrayBufferFloat32 = undefined;
if (typeof Float64Array != 'undefined')
    np.helper.ArrayBufferFloat64 = Float64Array;
else
    np.helper.ArrayBufferFloat64 = undefined;


module.exports = np;
