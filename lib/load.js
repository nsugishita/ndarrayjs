
(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.load_module = definition();
    }
}(this, function () {
    "use strict";

    var dtype_module = require('./dtype');
    var ndarray_module = require('./ndarray');
    var helper = require('./helper');

    var exported = {};

    var is_node = typeof exports !== 'undefined';

    var fs = require('fs');

    // If this is run on Node.js, load required libraries here.
    // Otherwise (run on a browser), make sure to load jszip, jszip-utils
    // and itertools as well.
    if (is_node) {
        // var itertools = require('./itertools.js');
        var JSZip = require('../node_modules/jszip/dist/jszip.min');
        var JSZipUtils = require('../node_modules/jszip-utils/dist/jszip-utils.min');
    }

    exported._set_alias = function(np) {
        np.load = exported.load;
    };

    // Return a string of a given binary array of char codes.
    var array_to_string = exported.array_to_string = function(array, length) {
        if (length == undefined) {
            length = array.length;
        }
        var result = "";
        for(var i = 0; i < length; i++) {
            result += String.fromCharCode(array[i]);
        }
        return result;
    };  // array_to_string


    // Parse binary data in a npy file and return a np.ndarray object.
    var parse_binary = exported.parse_binary = function(arraybuffer) {
        // The format is described in the documentaion of numpy:
        // https://docs.scipy.org/doc/numpy/reference/generated/numpy.lib.format.html
        var data = new Uint8Array(arraybuffer);
        if (data[0] != 0x93 || array_to_string(data.slice(1, 6)) != 'NUMPY') {
            throw new Error('invalid magic string 0x93NUMPY');
        }
        var version_major = data[6];
        var version_minor = data[7];
        // data_length is a little-endian unsigned short int.
        var data_length = data[8] + data[9]*256;
        if (data[10+data_length-1] != 10) {
            throw new Error(
                'Failed to load header. Terminal symbol LF (10) is expected but ' +
                data[10+data_length-1] + ' was found.'
            );
        }
        var header = array_to_string(data.slice(10, 10+data_length-1));
        header = header.replace('(', '[');
        header = header.replace('),', ']');
        header = header.replace(',]', ']');  // If shape is (n,)
        header = header.replace('True', 'true');
        header = header.replace('False', 'false');
        header = header.replace(/'/g, '"');
        // e.g.,
        // {"descr": "<f8", "fortran_order": false, "shape": [3, 4] }
        // {"descr": "<f8", "fortran_order": false, "shape": [3, 4, 3] }
        // {"descr": "<i8", "fortran_order": false, "shape": [2, 5] }
        // {"descr": "|b1", "fortran_order": false, "shape": [2, 5] }
        header = JSON.parse(header);
        if (header.descr[0] == '>') {
            console.log('WARNING! Big-endian data is not tested.');
        }
        if ('|<>'.indexOf(header.descr[0]) >= 0) {
            header.descr = header.descr.substr(1);
        }
        var dtype = dtype_module.char_to_dtype[header.descr];
        var ArrayBuffer = dtype_module.arraybuffer[dtype];
        header.size = header.shape.reduce(function(t, v) {return t*v;}, 1);
        if (header.fortran_order) {
            throw new Error('fortran ordered data is not supported.');
        }
        var buffer = new ArrayBuffer(arraybuffer.slice(10+data_length));
        var shape = header.shape;
        return new ndarray_module.ndarray(buffer, shape, dtype);
    };  // parse_binary


    // Return a Promise to load a npz file.
    // This takes a path to a npz file and reads the contents.
    // This returns a Promise and when it is resolved,
    // the loaded data is passed as an object.
    // One can check the loaded arrays by `Object.keys(data)`.
    exported.load = function(path) {
        var zip_promise;
        var names;
        // First create promise which load a zip file.
        // if (is_node) {
        if (fs.hasOwnProperty('readFileSync')) {
            zip_promise = JSZip.loadAsync(fs.readFileSync(path));
        } else {
            zip_promise  = new JSZip.external.Promise(function(resolve, reject) {
                JSZipUtils.getBinaryContent(path, function(err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }).then(function(data) {
                return JSZip.loadAsync(data);
            });
        }
        return zip_promise.then(function(zip) {
            // Extract names from the file and read all of them.
            names = Object.keys(zip.files).map(function(x) {return x.replace('.npy', '');});
            return Promise.all(
                Object.values(zip.files).map(function(x) {return x.async("arraybuffer");})
            );
        }).then(function(arraybuffers) {
            // This `arrays` is an Object of arrays, which is to be returned.
            var arrays = {};
            for (var i=0; i<names.length; i++)
                arrays[names[i]] = parse_binary(arraybuffers[i]);
            return arrays;
        });
    };  // np.load

    return exported;
}));
