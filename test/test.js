var test_numpy_is_node = typeof exports !== 'undefined';

if (test_numpy_is_node) {
    np = require('../dist/ndarray.js');
}

QUnit.test('np.ndarray', function(assert) {
    if (np.helper.is_es6_supported) {
        assert.ok(
            np.ndarray !== undefined,
            'np.ndarray must be available on ES6 compatible runtime'
        );
    }
    np.helper.es5mode();
    assert.ok(
        np.ndarray === undefined,
        'np.ndarray must be undefined on ES5 mode'
    );
});


QUnit.test('np.asarray', function(assert) {
    function impl() {
        let a = np.asarray([1, 2, 3, 4, 5, 6], [2, 3], 'float32');
        np.testing.assert_allclose(a.shape, [2, 3], {assert: assert});
        assert.throws(
            function() {
                np.asarray([1, 2, 3, 4, 5], [2, 3], 'float32');
            },
            /invalid shape/,
            "should raise an error on invalid shape"
        );
        assert.throws(
            function() {
                a.shape = [5];
            },
            /invalid shape/,
            "should raise an error on invalid shape"
        );
        a.shape = [1, 3, 2];
        np.testing.assert_allclose(a.shape, [1, 3, 2], {assert: assert});
    }

    if (np.helper.is_es6_supported) {
        impl();
    }
    np.helper.es5mode();
    impl();
});


QUnit.test('np.isndarray', function(assert) {
    let a = np.asarray([1, 2, 3, 4, 5, 6], [2, 3], 'float32');
    assert.ok(np.isndarray(a), 'np.ndarray must return true for ndarray.');
    assert.ok(
        !np.isndarray([1, 2, 3]), 'np.ndarray must return false for js native Array.');
    assert.ok(!np.isndarray([]), 'np.ndarray must return false for js native Array.');
});


QUnit.test('np.helper.is_array_buffer_supported', function(assert) {
    if (np.helper.is_array_buffer_supported) {
        assert.ok(
            np.helper.ArrayBufferFloat64 !== undefined,
            'ArrayBuffer of float 64 must be defined'
        );
    } else {
        assert.ok(
            np.helper.ArrayBufferFloat64 === undefined,
            'ArrayBuffer of float 64 must be undefined'
        );
    }
});


QUnit.test('np.testing.assert_arraylike', function(assert) {
    np.testing.assert_arraylike([1, Infinity, 3]);
    np.testing.assert_arraylike([[1, Infinity, 3]]);
    np.testing.assert_arraylike([[[1], [Infinity], [3]]]);
    np.testing.assert_arraylike([[[1, 3], [Infinity, Infinity], [3, 1]]]);
    np.testing.assert_arraylike([[[-1]], [[2]], [[0]], [[4]]]);
    np.testing.assert_arraylike([]);

    assert.throws(
        function() {
            np.testing.assert_arraylike([1, {}, 3]);
        },
        /invalid objects/,
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_arraylike([1, [], 3]);
        },
        /mixed numeric and arrays/,
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_arraylike([1, [1], 3]);
        },
        /mixed numeric and arrays/,
        "should raise an error"
    );
});


QUnit.test('np.testing.assert_allclose', function(assert) {
    np.testing.assert_allclose([-1, 2, 0, 4], [-1, 2, 0, 4]);
    np.testing.assert_allclose([[-1, 2], [0, 4]], [[-1, 2], [0, 4]]);
    np.testing.assert_allclose(
        [[[-1]], [[2]], [[0]], [[4]]], [[[-1]], [[2]], [[0]], [[4]]]);
    np.testing.assert_allclose([], []);
    np.testing.assert_allclose([-1, NaN, 0, 4], [-1, NaN, 0, 4]);
    np.testing.assert_allclose([-1, Infinity, 0, 4], [-1, Infinity, 0, 4]);
    np.testing.assert_allclose([-1, -Infinity, 0, 4], [-1, -Infinity, 0, 4]);

    assert.throws(
        function() {
            np.testing.assert_allclose([-1, 2, 4], [-1, 2, 3]);
        },
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_allclose([-1, 2, 4], [-1, 2]);
        },
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_allclose([[-1, 2, 4]], [-1, 2, 3]);
        },
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_allclose([-1, 2, 0], [-1, 2, NaN]);
        },
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_allclose([-1, 2, Infinity], [-1, 2, NaN]);
        },
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_allclose([-1, 2, Infinity], [-1, 2, -Infinity]);
        },
        "should raise an error"
    );
    assert.throws(
        function() {
            np.testing.assert_allclose([-1, 2, 0], [-1, 2, -Infinity]);
        },
        "should raise an error"
    );
});
