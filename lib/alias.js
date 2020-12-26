module.exports = (function() {
    "use strict";
    var exported = {};

    exported._set_ndarray_methods = function(np) {
        var mapping = [
            ['neg', np.ufunc.neg],
            ['add', np.ufunc.add],
            ['sub', np.ufunc.sub],
            ['mul', np.ufunc.mul],
            ['div', np.ufunc.div],
            ['mod', np.ufunc.mod],
            ['pow', np.ufunc.pow],
            ['abs', np.ufunc.abs],
            ['sqrt', np.ufunc.sqrt],
            ['cbrt', np.ufunc.cbrt],
            ['sin', np.ufunc.sin],
            ['cos', np.ufunc.cos],
            ['tan', np.ufunc.tan],
            ['exp', np.ufunc.exp],
            ['log', np.ufunc.log],
            ['log2', np.ufunc.log2],
            ['log10', np.ufunc.log10],
            ['eq', np.ufunc.eq],
            ['le', np.ufunc.le],
            ['ge', np.ufunc.ge],
            ['lt', np.ufunc.lt],
            ['gt', np.ufunc.gt],
            ['round', np.ufunc.round],
            ['trunc', np.ufunc.trunc],
            ['floor', np.ufunc.floor],
            ['ceil', np.ufunc.ceil],
            ['minimum', np.ufunc.minimum],
            ['maximum', np.ufunc.maximum],
            ['sum', np.function.sum],
            ['cumsum', np.function.cumsum],
            ['prod', np.function.prod],
            ['dot', np.function.dot],
            ['matmul', np.function.matmul],
            ['mean', np.function.mean],
            ['max', np.function.mean],
            ['min', np.function.min],
        ];
        var i, method_name, func;
        var set_method = function(method_name, func) {
            np.ndarray.prototype[method_name] = function() {
                var args = [this].concat(Array.prototype.slice.call(arguments, 0));
                return func.apply(undefined, args);
            };
        };
        for (i = 0; i < mapping.length; i++) {
            method_name = mapping[i][0];
            func = mapping[i][1];
            set_method(method_name, func);
        }
    };

    return exported;
})();
