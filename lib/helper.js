"use strict";

let helper = {};

/**
 * Version number of IE or 0 in another browser or node.
 * https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie
 */
helper.msieversion = (function() {
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
helper.is_es6_supported = (helper.msieversion == 0 || helper.msieversion == 11);


/**
 * Return the current runtime mode.
 * To change the mode, use helper.es5mode or helper.es6mode.
 * @returns {string} Current runtime mode, 'es6' or 'es5'.
 */
helper.get_mode = function() {
    return mode;
};


/**
 * Switch to ES6-free routines.
 */
helper.es5mode = function() {
    mode = 'es5';
};  // helper.es5mode


/**
 * Switch to ES6-leveraged routines.
 * This throws an error if one call this method on non-compatible environement,
 * such as IE of version 10 or earlier.
 */
helper.es6mode = function() {
    if (0 < helper.msieversion && helper.msieversion < 11) {
        throw new Error('not supported on this runtime.');
    }
    mode = 'es6';
};  // helper.es5mode


/* Store the current runtime mode. */
let mode = helper.is_es6_supported ? 'es6' : 'es5';

helper.is_array_buffer_supported =
    (helper.msieversion == 0 || helper.msieversion >= 10);

/* globals BigUint64Array */
/* globals BigInt64Array */
if (typeof Uint8Array != 'undefined')
    helper.ArrayBufferUint8 = Uint8Array;
else
    helper.ArrayBufferUint8 = undefined;
if (typeof Uint16Array != 'undefined')
    helper.ArrayBufferUint16 = Uint16Array;
else
    helper.ArrayBufferUint16 = undefined;
if (typeof Uint32Array != 'undefined')
    helper.ArrayBufferUint32 = Uint32Array;
else
    helper.ArrayBufferUint32 = undefined;
if (typeof BigUint64Array != 'undefined')
    helper.ArrayBufferUint64 = BigUint64Array;
else
    helper.ArrayBufferUint64 = undefined;
if (typeof Int8Array != 'undefined')
    helper.ArrayBufferInt8 = Int8Array;
else
    helper.ArrayBufferInt8 = undefined;
if (typeof Int16Array != 'undefined')
    helper.ArrayBufferInt16 = Int16Array;
else
    helper.ArrayBufferInt16 = undefined;
if (typeof Int32Array != 'undefined')
    helper.ArrayBufferInt32 = Int32Array;
else
    helper.ArrayBufferInt32 = undefined;
if (typeof BigInt64Array != 'undefined')
    helper.ArrayBufferInt64 = BigInt64Array;
else
    helper.ArrayBufferInt64 = undefined;
if (typeof Float32Array != 'undefined')
    helper.ArrayBufferFloat32 = Float32Array;
else
    helper.ArrayBufferFloat32 = undefined;
if (typeof Float64Array != 'undefined')
    helper.ArrayBufferFloat64 = Float64Array;
else
    helper.ArrayBufferFloat64 = undefined;


module.exports = helper;
