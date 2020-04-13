var test_numpy_is_node = typeof exports !== 'undefined';

if (test_numpy_is_node) {
    np = require('../lib/index.js');
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


QUnit.test('np.getitem', function(assert) {
    var a;
    a = np.asarray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [12], np.float);
    assert.equal(np.getitem(a, [1]), 2, 'getitem should get an element');
    assert.equal(np.getitem(a, [7]), 8, 'getitem should get an element');
    assert.equal(np.getitem(a, [-3]), 10, 'getitem should get an element');

    a = np.asarray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [2, 3, 2], np.float);
    /*
     * [[[ 1, 2],
     *   [ 3, 4],
     *   [ 5, 6]],
     *
     *  [[ 7, 8],
     *   [ 9,10],
     *   [11,12]]]
     */
    assert.equal(np.getitem(a, [0, 0, 1]), 2, 'getitem should get an element');
    assert.equal(np.getitem(a, [1, 0, 1]), 8, 'getitem should get an element');
    assert.equal(np.getitem(a, [-1, 2, -1]), 12, 'getitem should get an element');

    a = np.asarray([true, true, false, false], [2, 2], np.bool);
    /*
     * [[T, T],
     *  [F, F]]
     */
    assert.equal(np.getitem(a, [0, 0]), true, 'getitem should get an element');
    assert.equal(np.getitem(a, [1, 0]), false, 'getitem should get an element');

    a = np.asarray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [12], np.float);
    a._shape = [2, 2];
    a.offset = 3;
    a.stride = [4, -1];
    /*
     * [[4, 3],
     *  [8, 7]]
     */
    assert.equal(np.getitem(a, [0, 0]), 4, 'getitem should get an element');
    assert.equal(np.getitem(a, [0, 1]), 3, 'getitem should get an element');
    assert.equal(np.getitem(a, [1, 0]), 8, 'getitem should get an element');
    assert.equal(np.getitem(a, [1, 1]), 7, 'getitem should get an element');
});


QUnit.test('np.indexing.parse_slice', function(assert) {
    var a;
    a = np.indexing.parse_slice('3:4');
    assert.ok(a instanceof np.indexing.Slice, "'3:4' should be a slice");
    a = np.indexing.parse_slice('3:4:-1');
    assert.ok(a instanceof np.indexing.Slice, "'3:4:-1' should be a slice");
    a = np.indexing.parse_slice('30::5');
    assert.ok(a instanceof np.indexing.Slice, "'30::5' should be a slice");
    a = np.indexing.parse_slice(':-1');
    assert.ok(a instanceof np.indexing.Slice, "':-1' should be a slice");
    a = np.indexing.parse_slice(':4');
    assert.ok(a instanceof np.indexing.Slice, "':4' should be a slice");
    a = np.indexing.parse_slice('::-1');
    assert.ok(a instanceof np.indexing.Slice, "'::-1' should be a slice");
    a = np.indexing.parse_slice(30);
    assert.ok(a === undefined, "30 should not be a slice");
    a = np.indexing.parse_slice('30');
    assert.ok(a === undefined, "'30' should not be a slice");
    a = np.indexing.parse_slice(3.5);
    assert.ok(a === undefined, "'3.5' should not be a slice");
    a = np.indexing.parse_slice(null);
    assert.ok(a === undefined, "'null' should not be a slice");
    a = np.indexing.parse_slice([1, 2]);
    assert.ok(a === undefined, "'[1, 2]' should not be a slice");
});


QUnit.test('np.dtype', function(assert) {
    assert.equal(np.dtype('b'), np.int8, 'b == np.int8');

    assert.equal(np.dtype('b1'), np.bool, 'b1 == np.bool');
    assert.equal(np.dtype('bool'), np.bool, "np.dtype('bool') == np.bool");
    assert.equal(np.dtype(np.bool), np.bool, 'np.dtype(np.bool) == np.bool');

    assert.equal(np.dtype('i'), np.int, 'i == np.int');
    assert.equal(np.dtype('int'), np.int, "np.dtype('int') == np.int");
    assert.equal(np.dtype(np.int), np.int, 'np.dtype(np.int) == np.int');

    assert.equal(np.dtype('i1'), np.int8, 'i1 == np.int8');
    assert.equal(np.dtype('int8'), np.int8, "np.dtype('int8') == np.int8");
    assert.equal(np.dtype(np.int8), np.int8, 'np.dtype(np.int8) == np.int8');

    assert.equal(np.dtype('i2'), np.int16, 'i2 == np.int16');
    assert.equal(np.dtype('int16'), np.int16, "np.dtype('int16') == np.int16");
    assert.equal(np.dtype(np.int16), np.int16, 'np.dtype(np.int16) == np.int16');

    assert.equal(np.dtype('i4'), np.int32, 'i4 == np.int32');
    assert.equal(np.dtype('int32'), np.int32, "np.dtype('int32') == np.int32");
    assert.equal(np.dtype(np.int32), np.int32, 'np.dtype(np.int32) == np.int32');

    assert.equal(np.dtype('i8'), np.int64, 'i8 == np.int64');
    assert.equal(np.dtype('int64'), np.int64, "np.dtype('int64') == np.int64");
    assert.equal(np.dtype(np.int64), np.int64, 'np.dtype(np.int64) == np.int64');

    assert.equal(np.dtype('L'), np.uint, 'L == np.uint');
    assert.equal(np.dtype('uint'), np.uint, "np.dtype('uint') == np.uint");
    assert.equal(np.dtype(np.uint), np.uint, 'np.dtype(np.uint) == np.uint');

    assert.equal(np.dtype('u1'), np.uint8, 'u1 == np.uint8');
    assert.equal(np.dtype('uint8'), np.uint8, "np.dtype('uint8') == np.uint8");
    assert.equal(np.dtype(np.uint8), np.uint8, 'np.dtype(np.uint8) == np.uint8');

    assert.equal(np.dtype('u2'), np.uint16, 'u2 == np.uint16');
    assert.equal(np.dtype('uint16'), np.uint16, "np.dtype('uint16') == np.uint16");
    assert.equal(np.dtype(np.uint16), np.uint16, 'np.dtype(np.uint16) == np.uint16');

    assert.equal(np.dtype('u4'), np.uint32, 'u4 == np.uint32');
    assert.equal(np.dtype('uint32'), np.uint32, "np.dtype('uint32') == np.uint32");
    assert.equal(np.dtype(np.uint32), np.uint32, 'np.dtype(np.uint32) == np.uint32');

    assert.equal(np.dtype('f'), np.float, 'f == np.float');
    assert.equal(np.dtype('float'), np.float, "np.dtype('float') == np.float");
    assert.equal(np.dtype(np.float), np.float, 'np.dtype(np.float) == np.float');

    assert.equal(np.dtype('u8'), np.uint64, 'u8 == np.uint64');
    assert.equal(np.dtype('uint64'), np.uint64, "np.dtype('uint64') == np.uint64");
    assert.equal(np.dtype(np.uint64), np.uint64, 'np.dtype(np.uint64) == np.uint64');

    assert.equal(np.dtype('f4'), np.float32, 'f4 == np.float32');
    assert.equal(np.dtype('float32'), np.float32, "np.dtype('float32') == np.float32");
    assert.equal(np.dtype(np.float32), np.float32, 'np.dtype(np.float32) == np.float32');

    assert.equal(np.dtype('f8'), np.float64, 'f8 == np.float64');
    assert.equal(np.dtype('float64'), np.float64, "np.dtype('float64') == np.float64");
    assert.equal(np.dtype(np.float64), np.float64, 'np.dtype(np.float64) == np.float64');

    assert.throws(
        function() {np.dtype('i7');}, /invalid dtype/, "should raise an error"
    );
    assert.throws(
        function() {np.dtype('x8');}, /invalid dtype/, "should raise an error"
    );
    assert.throws(
        function() {np.dtype('i0');}, /invalid dtype/, "should raise an error"
    );
});


QUnit.test('np.helper.is_array_buffer_supported', function(assert) {
    if (np.helper.is_array_buffer_supported) {
        assert.ok(
            np.dtype.arraybuffer.float64 !== undefined,
            'ArrayBuffer of float 64 must be defined'
        );
    } else {
        assert.ok(
            np.dtype.arraybuffer.float64 === undefined,
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
