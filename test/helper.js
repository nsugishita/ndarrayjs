test_numpy_is_node = typeof exports !== 'undefined';

if (test_numpy_is_node) {
    np = {};
    np.testing = require('../lib/testing.js');
    np.helper = require('../lib/helper.js');
    np.helper._set_alias(np);
}

jsarray = np.helper.jsarray;

QUnit.module('helper');

QUnit.test('constants', function(assert) {
    // qunit fails to test NaN.
    // assert.equal(np.nan, NaN, 'np.nan');
    assert.equal(np.inf, Infinity, 'np.inf');
    assert.equal(np.None, null, 'np.None');
});

(function() {
    test_definition = [
        {
            function_name: 'isnan',
            func: np.isnan,
            test_items: [
                [np.nan, true],
                [undefined, false],
                [np.None, false],
                [np.inf, false],
                [-np.inf, false],
                [0, false],
                [-1, false],
                [true, false],
                [false, false],
                [[], false],
                [{}, false],
                [[np.nan], false],
                [[np.None], false],
                [[np.inf], false],
                [[0, 1], false],
            ]
        },
        {
            function_name: 'isfinite',
            func: np.isfinite,
            test_items: [
                [np.nan, false],
                [undefined, false],
                [np.None, false],
                [np.inf, false],
                [-np.inf, false],
                [0, true],
                [-1, true],
                [-110, true],
                [0.034, true],
                [true, false],
                [false, false],
                [[], false],
                [{}, false],
                [[np.nan], false],
                [[np.None], false],
                [[np.inf], false],
                [[0, 1], false],
            ]
        },
        {
            function_name: 'isinf',
            func: np.isinf,
            test_items: [
                [np.nan, false],
                [undefined, false],
                [np.None, false],
                [np.inf, true],
                [-np.inf, true],
                [0, false],
                [-1, false],
                [-110, false],
                [0.034, false],
                [true, false],
                [false, false],
                [[], false],
                [{}, false],
                [[np.nan], false],
                [[np.None], false],
                [[np.inf], false],
                [[0, 1], false],
            ]
        },
        {
            function_name: 'isinteger',
            func: np.helper.isinteger,
            test_items: [
                [np.nan, false],
                [undefined, false],
                [np.None, false],
                [np.inf, false],
                [-np.inf, false],
                [0, true],
                [1.0, true],
                [-1, true],
                [-110, true],
                [0.034, false],
                [true, false],
                [false, false],
                [[], false],
                [{}, false],
                [[1], false],
                [[np.nan], false],
                [[np.None], false],
                [[np.inf], false],
                [[0, 1], false],
            ]
        },
        {
            function_name: 'isbinary',
            func: np.helper.isbinary,
            test_items: [
                [np.nan, false],
                [undefined, false],
                [np.None, false],
                [np.inf, false],
                [-np.inf, false],
                [0, true],
                [1.0, true],
                [-1, false],
                [-110, false],
                [0.034, false],
                [true, false],
                [false, false],
                [[], false],
                [{}, false],
                [[1], false],
                [[np.nan], false],
                [[np.None], false],
                [[np.inf], false],
                [[0, 1], false],
            ]
        },
        {
            function_name: 'isbool',
            func: np.helper.isbool,
            test_items: [
                [np.nan, false],
                [undefined, false],
                [np.None, false],
                [np.inf, false],
                [-np.inf, false],
                [0, false],
                [1.0, false],
                [-1, false],
                [-110, false],
                [0.034, false],
                [true, true],
                [false, true],
                [[], false],
                [{}, false],
                [[1], false],
                [[np.nan], false],
                [[np.None], false],
                [[np.inf], false],
                [[0, 1], false],
            ]
        },
    ];

    var run_test = function(function_name, func, test_items) {
        QUnit.test(function_name, function(assert) {
            for (i = 0; i < test_items.length; i++) {
                input = test_items[i][0];
                expected = test_items[i][1];
                if (Array.isArray(input))
                    msg = function_name + '([' + input + ']) == ' + expected;
                else if (typeof input == 'object')
                    msg = function_name + '(' + JSON.stringify(input) + ') == ' + expected;
                else
                    msg = function_name + '(' + input + ') == ' + expected;
                assert.equal(func(input), expected, msg);
            }
        });
    };

    for (i = 0; i < test_definition.length; i++) {
        function_name = test_definition[i].function_name;
        func = test_definition[i].func;
        test_items = test_definition[i].test_items;
        run_test(function_name, func, test_items);
    }
})();

(function() {
    test_definition = [
        {
            function_name: 'get_nested_array_shape',
            func: np.helper.get_nested_array_shape,
            test_items: [
                [ [4], [1] ],
                [ [1, 2, 3], [3] ],
                [ [[np.nan, 2.3], [1, 2]], [2, 2] ],
                [ [[1.1], [2], [-1]], [3, 1] ],
                [ [[[3, -1], [-2, 0]], [[2, 1], [3, 3]]], [2, 2, 2] ],
                [ [[[4], [5]], [[3], [-6]]], [2, 2, 1] ]
            ]
        },
        {
            function_name: 'trunc',
            func: np.helper.trunc,
            test_items: [
                [0, 0],
                [1, 1],
                [-2, -2],
                [0.2, 0],
                [1.2, 1],
                [21.9, 21],
                [-5.2, -5],
                [-15.01, -15],
            ]
        },
        {
            function_name: 'np.helper.jsarray.allpositive',
            func: np.helper.jsarray.allpositive,
            test_items: [
                [[0], false],
                [[1], true],
                [[0.2], true],
                [[0.2, 13, 2], true],
                [[2, 4, np.inf], true],
                [[-2], false],
                [[1, 3, -0.4], false],
                [[2, 4, 0], false],
                [[2, 4, np.nan], false],
                [[2, 4, -np.inf], false],
                [[true], false],
                [[false], false],
            ]
        },
        {
            function_name: 'np.helper.jsarray.allnonnegative',
            func: np.helper.jsarray.allnonnegative,
            test_items: [
                [[0], true],
                [[1], true],
                [[0.2], true],
                [[0.2, 13, 2], true],
                [[2, 4, np.inf], true],
                [[-2], false],
                [[1, 3, -0.4], false],
                [[2, 4, 0], true],
                [[2, 4, np.nan], false],
                [[2, 4, -np.inf], false],
                [[true], false],
                [[false], false],
            ]
        },
        {
            function_name: 'np.helper.jsarray.neg',
            func: np.helper.jsarray.neg,
            test_items: [
                [[0], [0]],
                [[1], [-1]],
                [[0.2], [-0.2]],
                [[0.2, 13, 2], [-0.2, -13, -2]],
                [[2, 4, np.inf], [-2, -4, -np.inf]],
                [[-2], [2]],
                [[1, 3, -0.4], [-1, -3, 0.4]],
                [[2, 4, 0], [-2, -4, 0]],
                [[2, 4, np.nan], [-2, -4, np.nan]],
                [[2, 4, -np.inf], [-2, -4, np.inf]],
                [[true], [false]],
                [[false], [true]],
            ]
        },
        {
            function_name: 'np.helper.jsarray.nonzero',
            func: np.helper.jsarray.nonzero,
            test_items: [
                [[0], []],
                [[0, 0, 0], []],
                [[1], [0]],
                [[0.2], [0]],
                [[0, 0.2, 13, 0], [1, 2]],
                [[np.inf, 0, -np.inf], [0, 2]],
                [[-2], [0]],
                [[true, false, false, true, false], [0, 3]],
            ]
        },
        {
            function_name: 'np.helper.jsarray.sum',
            func: np.helper.jsarray.sum,
            test_items: [
                [[0], 0],
                [[0, 0, 0], 0],
                [[1], 1],
                [[0.2], 0.2],
                [[0, 0.2, 13, 0], 13.2],
                [[np.inf, 0, np.inf], np.inf],
                [[np.inf, 0, -np.inf], np.nan],
                [[-2], -2],
                [[true, false, false, true, false], 2],
            ]
        },
        {
            function_name: 'np.helper.jsarray.prod',
            func: np.helper.jsarray.prod,
            test_items: [
                [[0], 0],
                [[0, 0, 0], 0],
                [[1], 1],
                [[0.2], 0.2],
                [[0.2, 13], 2.6],
                [[np.inf, np.inf], np.inf],
                [[np.inf, -np.inf], -np.inf],
                [[np.inf, 0], np.nan],
                [[-2], -2],
                [[true, false, false, true, false], 0],
            ]
        },
        {
            function_name: 'np.helper.jsarray.flatten',
            func: np.helper.jsarray.flatten,
            test_items: [
                [ [0], [0] ],
                [ [0, 0, 0], [0, 0, 0] ],
                [ [np.nan], [np.nan] ],
                [ [[2, 3], [np.nan, 4]], [2, 3, np.nan, 4] ],
                [ [[2, [0]], [4], [], [[np.inf]]], [2, 0, 4, np.inf] ],
                [ new BigInt64Array(4), new BigInt64Array(4) ],
                [ [], [] ],
            ]
        },
    ];

    var run_test = function(function_name, func, test_items) {
        QUnit.test(function_name, function(assert) {
            np.testing.qunit_enable_deep_equal(assert);
            for (i = 0; i < test_items.length; i++) {
                input = test_items[i][0];
                expected = test_items[i][1];
                try {
                    msg = function_name + '(' + JSON.stringify(input) + ') == ' + JSON.stringify(expected);
                } catch(e) {
                    msg = function_name + '(' + input + ') == ' + expected;
                }
                assert.deep_equal(func(input), expected, msg);
            }
        });
    };

    for (i = 0; i < test_definition.length; i++) {
        function_name = test_definition[i].function_name;
        func = test_definition[i].func;
        test_items = test_definition[i].test_items;
        run_test(function_name, func, test_items);
    }
})();

QUnit.test('iterator_from_shape', function(assert) {
    np.testing.qunit_enable_deep_equal(assert);
    var it;
    it = np.helper.iterator_from_shape([2, 3]);
    assert.deep_equal(it.next().value, [0, 0], 'iterator must generate [0, 0]');
    assert.deep_equal(it.next().value, [0, 1], 'iterator must generate [0, 1]');
    assert.deep_equal(it.next().value, [0, 2], 'iterator must generate [0, 2]');
    assert.deep_equal(it.next().value, [1, 0], 'iterator must generate [1, 0]');
    assert.deep_equal(it.next().value, [1, 1], 'iterator must generate [1, 1]');
    assert.deep_equal(it.next().value, [1, 2], 'iterator must generate [1, 2]');
    assert.ok(it.next().done, 'iterator must be exhausted');

    it = np.helper.iterator_from_shape([2, 2, 3]);
    assert.deep_equal(it.next().value, [0, 0, 0], 'iterator must generate [0, 0, 0]');
    assert.deep_equal(it.next().value, [0, 0, 1], 'iterator must generate [0, 0, 1]');
    assert.deep_equal(it.next().value, [0, 0, 2], 'iterator must generate [0, 0, 2]');
    assert.deep_equal(it.next().value, [0, 1, 0], 'iterator must generate [0, 1, 0]');
    assert.deep_equal(it.next().value, [0, 1, 1], 'iterator must generate [0, 1, 1]');
    assert.deep_equal(it.next().value, [0, 1, 2], 'iterator must generate [0, 1, 2]');
    assert.deep_equal(it.next().value, [1, 0, 0], 'iterator must generate [1, 0, 0]');
    assert.deep_equal(it.next().value, [1, 0, 1], 'iterator must generate [1, 0, 1]');
    assert.deep_equal(it.next().value, [1, 0, 2], 'iterator must generate [1, 0, 2]');
    assert.deep_equal(it.next().value, [1, 1, 0], 'iterator must generate [1, 1, 0]');
    assert.deep_equal(it.next().value, [1, 1, 1], 'iterator must generate [1, 1, 1]');
    assert.deep_equal(it.next().value, [1, 1, 2], 'iterator must generate [1, 1, 2]');
    assert.ok(it.next().done, 'iterator must be exhausted');

    it = np.helper.iterator_from_shape([4, 0]);
    assert.ok(it.next().done, 'iterator must be exhausted');
});

QUnit.test('np.helper.jsarray.get', function(assert) {
    np.testing.qunit_enable_deep_equal(assert);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4, 5], 3), 3);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4, 5], -1), 5);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4, 5], -2), 4);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4, 5], [1, 2, 1]), [1, 2, 1]);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4, 5], [-1, -2, 0]), [5, 4, 0]);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4, 5], []), []);
    assert.deep_equal(jsarray.get([np.nan, np.inf, -np.inf], [2, 0]), [-np.inf, np.nan]);
    assert.deep_equal(jsarray.get([['a'], ['b', 'c'], ['d', 'e']], [-1]), [['d', 'e']]);
    assert.deep_equal(jsarray.get([0, 1, 2, 3, 4], [true, false, true, false, true]), [0, 2, 4]);
    assert.deep_equal(jsarray.get([['a'], [], ['b']], [true, true, false]), [['a'], []]);
});

QUnit.test('jsarray.arange', function(assert) {
    np.testing.qunit_enable_deep_equal(assert);
    var array;
    array = jsarray.arange(3);
    assert.deep_equal(array, [0, 1, 2]);
    array = jsarray.arange(2, 6);
    assert.deep_equal(array, [2, 3, 4, 5]);
    array = jsarray.arange(6, 1, -1);
    assert.deep_equal(array, [6, 5, 4, 3, 2]);
    array = jsarray.arange(0, 10, 3);
    assert.deep_equal(array, [0, 3, 6, 9]);
    array = jsarray.arange(3, -3);
    assert.deep_equal(array, []);
    array = jsarray.arange(3, -3, -2);
    assert.deep_equal(array, [3, 1, -1]);
    array = jsarray.arange(-5, -3);
    assert.deep_equal(array, [-5, -4]);
});

QUnit.test('jsarray.full', function(assert) {
    np.testing.qunit_enable_deep_equal(assert);
    var array;
    array = jsarray.full([1, 2], 3);
    assert.deep_equal(array, [[3, 3]]);
    array = jsarray.full([2, 3], np.nan);
    assert.deep_equal(array, [[np.nan, np.nan, np.nan], [np.nan, np.nan, np.nan]]);
    array = jsarray.full([2, 2, 2], false);
    assert.deep_equal(array, [[[false, false], [false, false]], [[false, false], [false, false]]]);
});

QUnit.test('jsarray.dot', function(assert) {
    np.testing.qunit_enable_deep_equal(assert);
    assert.deep_equal(jsarray.dot([1, 2], [3, 4]), 11);
    assert.deep_equal(jsarray.dot([-1, 1], [3, 0]), -3);
    assert.deep_equal(jsarray.dot([0, 1, 2.5], [-1, -2, 2]), 3);
    assert.deep_equal(jsarray.dot([-1, 0, 1], [np.nan, 3, 0]), np.nan);
    assert.deep_equal(jsarray.dot([np.inf, 1, 3], [-0.5, 0, 1]), -np.inf);
});

QUnit.test('jsarray.reshape', function(assert) {
    np.testing.qunit_enable_deep_equal(assert);
    var array;
    array = jsarray.reshape([1, 2, 3, 4], [2, 2]);
    assert.deep_equal(array, [[1, 2], [3, 4]], '[[1, 2], [3, 4]]');
    array = jsarray.reshape([1, 3, 5, 7, 9, 11], [2, 3]);
    assert.deep_equal(array, [[1, 3, 5], [7, 9, 11]], '[[1, 3, 5], [7, 9, 11]]');
    array = jsarray.reshape([1, 3, 5, 7, 9, 11], [3, 1, 2]);
    assert.deep_equal(array, [[[1, 3]], [[5, 7]], [[9, 11]]], '[[[1, 3]], [[5, 7]], [[9, 11]]]');
});
