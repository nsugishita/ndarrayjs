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


module.exports = helper;
