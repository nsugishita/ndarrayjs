"use strict";

var dtype_module = require('./dtype');
var constructor_module = require('./constructor');
var reshape_module = require('./reshape');

module.exports._set_alias = function(np) {
    var key;
    for (key in module.exports) {
        np[key] = module.exports[key];
    }
};

// Given input types and allowed ufunc input dtypes, determine the output dtypes.
// input_types must be an Array of np.dtype.
// rules must be an Array of [input_dtypes, dtype], where input_dtypes
// is an Array of np.dtype and dtype is np.dtype.
// This returns an object {in: an Array of np.dtype, out: np.dtype}.
// in gives the casted input_types and out is the
// dtype of the result.
module.exports.get_ufunc_dtype_rule = function(input_types, rules) {
    var i;
    if (input_types.length == 1) {
        for (i = 0; i < rules.length; i++) {
            if (input_types[0] == rules[i][0][0]) {
                // Given input types are found in rules.
                return {
                    in: rules[i][0],
                    out: rules[i][1],
                };
            }
        }
        // Need casting. TODO
        var castable_types = dtype_module.castable_types[input_types[0]];
        for (i = 0; i < rules.length; i++) {
            if (dtype_module.can_cast(input_types[0], rules[i][0][0])) {
                // This rule has input which is castable from a current input type.
                return {
                    in: rules[i][0],
                    out: rules[i][1],
                };
            }
        }
        throw new Error('cannot find rules for input dtype ' + input_types[0] + '.');
    } else if (input_types.length == 2) {
        for (i = 0; i < rules.length; i++) {
            if (input_types[0] == rules[i][0] && input_types[1] == rules[i][1]) {
                // Given input types are found in rules.
                return {
                    in: rules[i][0],
                    out: rules[i][1],
                };
            }
        }
        // Need casting.
        for (i = 0; i < rules.length; i++) {
            if (dtype_module.can_cast(input_types[0], rules[i][0][0]) &&
                    dtype_module.can_cast(input_types[1], rules[i][0][1])) {
                // This rule has input which is castable from a current input type.
                return {
                    in: rules[i][0],
                    out: rules[i][1],
                };
            }
        }
        throw new Error('cannot find rules for input dtype ' + input_types[0] + '.');
    }
};  // get_resulting_dtype
var get_ufunc_dtype_rule = module.exports.get_ufunc_dtype_rule;

// Create unary ufunc.
// dtype_rule is an Array of [input_types, output_type], where input_types
// is an Array of dtypes and output_type is a dtype.
var unary_ufunc_factory = function(func, dtype_rule) {
    var ufunc = function(x, out) {
        var rule, i;
        if (out === undefined) {
            rule = get_ufunc_dtype_rule([x.dtype], dtype_rule);
            out = constructor_module.zeros(x.shape, rule.out);
        }
        for (i = 0; i < out.buffer.length; i++) {
            out.buffer[i] = func(x.buffer[i]);
        }
        return out;
    };
    return ufunc;
};  // np.unary_ufunc_factory

// Create unary ufunc.
// dtype_rule is an Array of [input_types, output_type], where input_types
// is an Array of dtypes and output_type is a dtype.
var binary_ufunc_factory = function(func, dtype_rule) {
    var ufunc = function(x, y, out) {
        var tmp = reshape_module.broadcast_arrays(x, y);
        x = tmp[0];
        y = tmp[1];
        if (out === undefined) {
            var rule = get_ufunc_dtype_rule([x.dtype, y.dtype], dtype_rule);
            out = constructor_module.zeros(x.shape, rule.out);
        }
        for (var i=0; i<out.buffer.length; i++) {
            out.buffer[i] = func(x.buffer[i], y.buffer[i]);
        }
        return out;
    };
    return ufunc;
};  // binary_ufunc_factory

// Define typical ufunc dtype rules.
var dtype_rule_binary_same_kind = [
    [[dtype_module.bool, dtype_module.bool], dtype_module.bool],
    [[dtype_module.int8, dtype_module.int8], dtype_module.int8],
    [[dtype_module.int16, dtype_module.int16], dtype_module.int16],
    [[dtype_module.int32, dtype_module.int32], dtype_module.int32],
    [[dtype_module.int64, dtype_module.int64], dtype_module.int64],
    [[dtype_module.uint8, dtype_module.uint8], dtype_module.uint8],
    [[dtype_module.uint16, dtype_module.uint16], dtype_module.uint16],
    [[dtype_module.uint32, dtype_module.uint32], dtype_module.uint32],
    [[dtype_module.uint64, dtype_module.uint64], dtype_module.uint64],
    [[dtype_module.float32, dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64, dtype_module.float64], dtype_module.float64],
];

var dtype_rule_binary_float = [
    [[dtype_module.bool, dtype_module.bool], dtype_module.float32],
    [[dtype_module.int8, dtype_module.int8], dtype_module.float32],
    [[dtype_module.int16, dtype_module.int16], dtype_module.float32],
    [[dtype_module.int32, dtype_module.int32], dtype_module.float32],
    [[dtype_module.int64, dtype_module.int64], dtype_module.float64],
    [[dtype_module.uint8, dtype_module.uint8], dtype_module.float32],
    [[dtype_module.uint16, dtype_module.uint16], dtype_module.float32],
    [[dtype_module.uint32, dtype_module.uint32], dtype_module.float32],
    [[dtype_module.uint64, dtype_module.uint64], dtype_module.float64],
    [[dtype_module.float32, dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64, dtype_module.float64], dtype_module.float64],
];

var dtype_rule_binary_mod = [
    [[dtype_module.bool, dtype_module.bool], dtype_module.int8],
    [[dtype_module.int8, dtype_module.int8], dtype_module.int8],
    [[dtype_module.int16, dtype_module.int16], dtype_module.int16],
    [[dtype_module.int32, dtype_module.int32], dtype_module.int32],
    [[dtype_module.int64, dtype_module.int64], dtype_module.int64],
    [[dtype_module.uint8, dtype_module.uint8], dtype_module.uint8],
    [[dtype_module.uint16, dtype_module.uint16], dtype_module.uint16],
    [[dtype_module.uint32, dtype_module.uint32], dtype_module.uint32],
    [[dtype_module.uint64, dtype_module.uint64], dtype_module.uint64],
    [[dtype_module.float32, dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64, dtype_module.float64], dtype_module.float64],
];

var dtype_rule_binary_eq= [
    [[dtype_module.float64, dtype_module.float64], dtype_module.bool],
];

var dtype_rule_unary_same_kind = [
    [[dtype_module.bool], dtype_module.bool],
    [[dtype_module.int8], dtype_module.int8],
    [[dtype_module.int16], dtype_module.int16],
    [[dtype_module.int32], dtype_module.int32],
    [[dtype_module.int64], dtype_module.int64],
    [[dtype_module.uint16], dtype_module.uint16],
    [[dtype_module.uint32], dtype_module.uint32],
    [[dtype_module.uint64], dtype_module.uint64],
    [[dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64], dtype_module.float64],
];

var dtype_rule_unary_signed_same_kind = [
    [[dtype_module.int8], dtype_module.int8],
    [[dtype_module.int16], dtype_module.int16],
    [[dtype_module.int32], dtype_module.int32],
    [[dtype_module.int64], dtype_module.int64],
    [[dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64], dtype_module.float64],
];

var dtype_rule_unary_float = [
    [[dtype_module.int8], dtype_module.float32],
    [[dtype_module.int16], dtype_module.float32],
    [[dtype_module.int32], dtype_module.float32],
    [[dtype_module.int64], dtype_module.float64],
    [[dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64], dtype_module.float64],
];

var dtype_rule_unary_round = [
    [[dtype_module.bool], dtype_module.float32],  // Not sure but we are following the original rule.
    [[dtype_module.int8], dtype_module.int8],
    [[dtype_module.int16], dtype_module.int16],
    [[dtype_module.int32], dtype_module.int32],
    [[dtype_module.int64], dtype_module.int64],
    [[dtype_module.uint16], dtype_module.uint16],
    [[dtype_module.uint32], dtype_module.uint32],
    [[dtype_module.uint64], dtype_module.uint64],
    [[dtype_module.float32], dtype_module.float32],
    [[dtype_module.float64], dtype_module.float64],
];

module.exports.neg = unary_ufunc_factory(
    function(x) {return x * -1;}, dtype_rule_unary_signed_same_kind
);
module.exports.add = binary_ufunc_factory(
    function(x, y) {return x + y;}, dtype_rule_binary_same_kind
);
module.exports.sub = binary_ufunc_factory(
    function(x, y) {return x - y;}, dtype_rule_binary_same_kind
);
module.exports.mul = binary_ufunc_factory(
    function(x, y) {return x * y;}, dtype_rule_binary_same_kind
);
module.exports.div = binary_ufunc_factory(
    function(x, y) {return x / y;}, dtype_rule_binary_float
);
module.exports.mod = binary_ufunc_factory(
    function(x, y) {return x % y;}, dtype_rule_binary_mod
);
module.exports.pow = binary_ufunc_factory(Math.pow, dtype_rule_binary_float);
module.exports.abs = unary_ufunc_factory(Math.abs, dtype_rule_unary_signed_same_kind);
module.exports.sqrt = unary_ufunc_factory(Math.sqrt, dtype_rule_unary_float);
module.exports.cbrt = unary_ufunc_factory(Math.cbrt, dtype_rule_unary_float);
module.exports.sin = unary_ufunc_factory(Math.sin, dtype_rule_unary_float);
module.exports.cos = unary_ufunc_factory(Math.cos, dtype_rule_unary_float);
module.exports.tan = unary_ufunc_factory(Math.tan, dtype_rule_unary_float);
module.exports.exp = unary_ufunc_factory(Math.exp, dtype_rule_unary_float);
module.exports.log = unary_ufunc_factory(Math.log, dtype_rule_unary_float);
module.exports.log2 = unary_ufunc_factory(
    function(x) {return Math.log(x) * Math.LOG2E;}, dtype_rule_unary_float
);
module.exports.log10 = unary_ufunc_factory(
    function(x) {return Math.log(x) * Math.LOG10E;}, dtype_rule_unary_float
);
module.exports.eq = binary_ufunc_factory(
    function(x, y) {return x == y;}, dtype_rule_binary_eq
);
module.exports.le = binary_ufunc_factory(
    function(x, y) {return x <= y;}, dtype_rule_binary_eq
);
module.exports.ge = binary_ufunc_factory(
    function(x, y) {return x >= y;}, dtype_rule_binary_eq
);
module.exports.lt = binary_ufunc_factory(
    function(x, y) {return x < y;}, dtype_rule_binary_eq
);
module.exports.gt = binary_ufunc_factory(
    function(x, y) {return x > y;}, dtype_rule_binary_eq
);
module.exports.round = unary_ufunc_factory(Math.round, dtype_rule_unary_round);
module.exports.trunc = unary_ufunc_factory(Math.trunc, dtype_rule_unary_round);
module.exports.floor = unary_ufunc_factory(Math.floor, dtype_rule_unary_round);
module.exports.ceil = unary_ufunc_factory(Math.ceil, dtype_rule_unary_round);
module.exports.minimum = binary_ufunc_factory(Math.min, dtype_rule_binary_same_kind);
module.exports.maximum = binary_ufunc_factory(Math.max, dtype_rule_binary_same_kind);
