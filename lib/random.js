"use strict";

module.exports._set_alias = function(np) {
};

var dtype_module = require('./dtype');
var ndarray_module = require('./ndarray');

var rand = module.exports.rand = function(/* ...sizes */) {
    var sizes = Array.prototype.slice.call(arguments, 0);
    if ((sizes.length == 1) && (Array.isArray(sizes[0]))) {
        sizes = sizes[0];
    }
    var dtype = dtype_module.float;
    var size = sizes.reduce(function(t, v) {return t*v;}, 1);
    var buffer = new dtype_module.arraybuffer[dtype](size);
    for (var i=0; i<size; i++) {
        buffer[i] = Math.random();
    }
    return new ndarray_module.ndarray(buffer, sizes, dtype);
};  // np.random.rand.


var randn = module.exports.randn = function(/* ...sizes */) {
    // Return two-list of normally distributed (pseudo) random numbers
    // using Box-Muller transform.
    var sizes = Array.prototype.slice.call(arguments, 0);
    if ((sizes.length == 1) && (Array.isArray(sizes[0]))) {
        sizes = sizes[0];
    }
    function paired_randn() {
        var u = 0;
        var v = 0;
        while(u === 0) u = Math.random();  //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        var coef = Math.sqrt(-2.0 * Math.log(u));
        var ang  = 2.0 * Math.PI * v ;
        return [coef * Math.cos(ang), coef * Math.sin(ang)];
    }
    var dtype = dtype_module.float;
    var size = sizes.reduce(function(t, v) {return t*v;}, 1);
    var buffer = new dtype_module.arraybuffer[dtype](size);
    for (var i=0; i<Math.floor(size/2); i++) {
        var pair = paired_randn();
        buffer[2*i] = pair[0];
        buffer[2*i+1] = pair[1];
    }
    if (size % 2 == 1) {
        buffer[size-1] = paired_randn()[0];
    }
    return new ndarray_module.ndarray(buffer, sizes, dtype);
};  // np.random.randn.
