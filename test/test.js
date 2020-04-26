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
        var a;
        a = np.asarray([1, 2, 3, 4, 5, 6], [2, 3], np.float32);
        np.testing.assert_allclose(a.shape, [2, 3], {assert: assert});
        if (np.helper.use_arraybuffer()) {
            assert.ok(a.buffer instanceof Float32Array);
        } else {
            assert.ok(Array.isArray(a.buffer));
        }
        assert.throws(
            function() {
                np.asarray([1, 2, 3, 4, 5], [2, 3], np.float32);
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

        a = np.asarray([[1, 2, 3], [2, 3, 4], [3, 2, 3]], 0, np.int32);
        np.testing.assert_allclose(a.shape, [3, 3]);
        if (np.helper.use_arraybuffer()) {
            assert.ok(a.buffer instanceof Int32Array);
        } else {
            assert.ok(Array.isArray(a.buffer));
        }
    }

    if (np.helper.is_es6_supported) {
        impl();
    }
    np.helper.use_arraybuffer(false);
    impl();
});


QUnit.test('np.isndarray', function(assert) {
    let a = np.asarray([1, 2, 3, 4, 5, 6], [2, 3], 'float32');
    assert.ok(np.isndarray(a), 'np.ndarray must return true for ndarray.');
    assert.ok(
        !np.isndarray([1, 2, 3]), 'np.ndarray must return false for js native Array.');
    assert.ok(!np.isndarray([]), 'np.ndarray must return false for js native Array.');
});


QUnit.test('np.arange', function(assert) {
    var a;
    a = np.arange(5);
    np.testing.assert_allclose(a.shape, [5], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [0, 1, 2, 3, 4], {assert: assert});
    assert.equal(a.dtype, np.int);

    a = np.arange(2, 4);
    np.testing.assert_allclose(a.shape, [2], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [2, 3], {assert: assert});
    assert.equal(a.dtype, np.int);

    a = np.arange(2, 10, 3);
    np.testing.assert_allclose(a.shape, [3], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [2, 5, 8], {assert: assert});
    assert.equal(a.dtype, np.int);

    a = np.arange(17, 8, -3, np.float);
    np.testing.assert_allclose(a.shape, [3], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [17, 14, 11], {assert: assert});
    assert.equal(a.dtype, np.float);
});


QUnit.test('np.zeros', function(assert) {
    var a;
    a = np.zeros(5);
    np.testing.assert_allclose(a.shape, [5], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [0, 0, 0, 0, 0], {assert: assert});
    assert.equal(a.dtype, np.float);

    a = np.zeros([2, 3]);
    np.testing.assert_allclose(a.shape, [2, 3], {assert: assert});
    np.testing.assert_allclose(
        np.helper.Arrayfrom(a.buffer), [0, 0, 0, 0, 0, 0], {assert: assert});
    assert.equal(a.dtype, np.float);

    a = np.zeros([2, 2, 3], np.int);
    np.testing.assert_allclose(a.shape, [2, 2, 3], {assert: assert});
    np.testing.assert_allclose(
        np.helper.Arrayfrom(a.buffer),
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        {assert: assert}
    );
    assert.equal(a.dtype, np.int);
});


QUnit.test('np.ones', function(assert) {
    var a;
    a = np.ones(5);
    np.testing.assert_allclose(a.shape, [5], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [1, 1, 1, 1, 1], {assert: assert});
    assert.equal(a.dtype, np.float);

    a = np.ones([2, 3]);
    np.testing.assert_allclose(a.shape, [2, 3], {assert: assert});
    np.testing.assert_allclose(
        np.helper.Arrayfrom(a.buffer), [1, 1, 1, 1, 1, 1], {assert: assert});
    assert.equal(a.dtype, np.float);

    a = np.ones([2, 2, 3], np.int);
    np.testing.assert_allclose(a.shape, [2, 2, 3], {assert: assert});
    np.testing.assert_allclose(
        np.helper.Arrayfrom(a.buffer),
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        {assert: assert}
    );
    assert.equal(a.dtype, np.int);
});


QUnit.test('np.full', function(assert) {
    var a;
    a = np.full(5, 7);
    np.testing.assert_allclose(a.shape, [5], {assert: assert});
    np.testing.assert_allclose(np.helper.Arrayfrom(a.buffer), [7, 7, 7, 7, 7], {assert: assert});
    assert.equal(a.dtype, np.int);

    a = np.full([2, 3], 2.5);
    np.testing.assert_allclose(a.shape, [2, 3], {assert: assert});
    np.testing.assert_allclose(
        np.helper.Arrayfrom(a.buffer), [2.5, 2.5, 2.5, 2.5, 2.5, 2.5], {assert: assert});
    assert.equal(a.dtype, np.float);

    a = np.full([2, 2, 3], 3, np.float);
    np.testing.assert_allclose(a.shape, [2, 2, 3], {assert: assert});
    np.testing.assert_allclose(
        np.helper.Arrayfrom(a.buffer),
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        {assert: assert}
    );
    assert.equal(a.dtype, np.float);
});


QUnit.test('np.get', function(assert) {
    // TODO Add more advanced test, such as slices, newaxis and elipsis.
    var a;
    a = np.asarray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [12], np.float);
    a.shape = [3, 4];
    a.stride = [4, 1];
    assert.equal(a(0, 0), 1);
    assert.equal(a(0, 1), 2);
    assert.equal(a(0, 2), 3);
    assert.equal(a(0, 3), 4);
    assert.equal(a(1, 0), 5);
    assert.equal(a(1, 1), 6);
    assert.equal(a(1, 2), 7);
    assert.equal(a(1, 3), 8);
    assert.equal(a(2, 0), 9);
    assert.equal(a(2, 1),10);
    assert.equal(a(2, 2),11);
    assert.equal(a(2, 3),12);

    assert.equal(a(0)(0), 1);
    assert.equal(a(0)(1), 2);
    assert.equal(a(0)(2), 3);
    assert.equal(a(0)(3), 4);
    assert.equal(a(1)(0), 5);
    assert.equal(a(1)(1), 6);
    assert.equal(a(1)(2), 7);
    assert.equal(a(1)(3), 8);
    assert.equal(a(2)(0), 9);
    assert.equal(a(2)(1),10);
    assert.equal(a(2)(2),11);
    assert.equal(a(2)(3),12);

    a = np.asarray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [12], np.float);
    a.shape = [2, 3, 2];
    a.stride = [6, 2, 1];
    assert.equal(a(0, 0, 0), 1);
    assert.equal(a(0, 0, 1), 2);
    assert.equal(a(0, 1, 0), 3);
    assert.equal(a(0, 1, 1), 4);
    assert.equal(a(0, 2, 0), 5);
    assert.equal(a(0, 2, 1), 6);
    assert.equal(a(1, 0, 0), 7);
    assert.equal(a(1, 0, 1), 8);
    assert.equal(a(1, 1, 0), 9);
    assert.equal(a(1, 1, 1),10);
    assert.equal(a(1, 2, 0),11);
    assert.equal(a(1, 2, 1),12);

    assert.equal(a(0)(0, 0), 1);
    assert.equal(a(0)(0, 1), 2);
    assert.equal(a(0)(1, 0), 3);
    assert.equal(a(0)(1, 1), 4);
    assert.equal(a(0)(2, 0), 5);
    assert.equal(a(0)(2, 1), 6);
    assert.equal(a(1)(0, 0), 7);
    assert.equal(a(1)(0, 1), 8);
    assert.equal(a(1)(1, 0), 9);
    assert.equal(a(1)(1, 1),10);
    assert.equal(a(1)(2, 0),11);
    assert.equal(a(1)(2, 1),12);

    assert.equal(a(0, 0)(0), 1);
    assert.equal(a(0, 0)(1), 2);
    assert.equal(a(0, 1)(0), 3);
    assert.equal(a(0, 1)(1), 4);
    assert.equal(a(0, 2)(0), 5);
    assert.equal(a(0, 2)(1), 6);
    assert.equal(a(1, 0)(0), 7);
    assert.equal(a(1, 0)(1), 8);
    assert.equal(a(1, 1)(0), 9);
    assert.equal(a(1, 1)(1),10);
    assert.equal(a(1, 2)(0),11);
    assert.equal(a(1, 2)(1),12);

    assert.equal(a(0)(0)(0), 1);
    assert.equal(a(0)(0)(1), 2);
    assert.equal(a(0)(1)(0), 3);
    assert.equal(a(0)(1)(1), 4);
    assert.equal(a(0)(2)(0), 5);
    assert.equal(a(0)(2)(1), 6);
    assert.equal(a(1)(0)(0), 7);
    assert.equal(a(1)(0)(1), 8);
    assert.equal(a(1)(1)(0), 9);
    assert.equal(a(1)(1)(1),10);
    assert.equal(a(1)(2)(0),11);
    assert.equal(a(1)(2)(1),12);
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


QUnit.test('np.apply_advanced_indexing', function(assert) {
    var a, b;
    var S = np.indexing.Slice;
    a = np.arange(24);
    a._shape = [2, 3, 4];
    a.stride = [12, 4, 1];
    b =np.indexing.apply_basic_indexing(a, [1, new S(0, 3, 2), new S(3, 1, -1)]);
    console.log(b.shape);
    console.log(b.stride);
    assert.ok(true);
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


QUnit.test('np.indexing.strip_commans', function(assert) {
    var a;
    a = ['3,-1,4:5'];
    np.indexing.strip_commans(a);
    np.testing.assert_allclose(a, ['3', '-1', '4:5'], {assert: assert});
    a = [np.newaxis, '4:5', 4];
    np.indexing.strip_commans(a);
    np.testing.assert_allclose(a, [np.newaxis, '4:5', 4], {assert: assert});
    a = [np.newaxis, '1,:,4'];
    np.indexing.strip_commans(a);
    np.testing.assert_allclose(a, [np.newaxis, '1', ':', '4'], {assert: assert});
});


QUnit.test('np.indexing.use_newaxis_and_elipsis', function(assert) {
    var a;
    a = [2, 4, '4:2'];
    np.indexing.use_newaxis_and_elipsis(a);
    np.testing.assert_allclose(
        a,
        [2, 4, '4:2'],
        {assert: assert}
    );

    a = [undefined, ':', '...', 3, null];
    np.indexing.use_newaxis_and_elipsis(a);
    np.testing.assert_allclose(
        a,
        [np.newaxis, ':', np.Elipsis, 3, np.newaxis],
        {assert: assert}
    );

    a = [undefined, '...'];
    np.indexing.use_newaxis_and_elipsis(a);
    np.testing.assert_allclose(
        a,
        [np.newaxis, np.Elipsis],
        {assert: assert}
    );
});


QUnit.test('np.indexing.is_string_integer', function(assert) {
    assert.ok(np.indexing.is_string_integer('80'), "'80' is integer");
    assert.ok(np.indexing.is_string_integer('0'), "'0' is integer");
    assert.ok(np.indexing.is_string_integer('-1'), "'-1' is integer");
    assert.ok(!np.indexing.is_string_integer('02'), "'02' is not integer");
    assert.ok(!np.indexing.is_string_integer('-01'), "'-01' is not integer");
    assert.ok(!np.indexing.is_string_integer('00'), "'00' is not integer");
    assert.ok(!np.indexing.is_string_integer('1.0'), "'1.0' is not integer");
    assert.ok(!np.indexing.is_string_integer('.0'), "'.0' is not integer");
    assert.ok(!np.indexing.is_string_integer('1a'), "'1a' is not integer");
    assert.ok(!np.indexing.is_string_integer('a'), "'a' is not integer");
    assert.ok(!np.indexing.is_string_integer('-'), "'-' is not integer");
});


QUnit.test('np.indexing.parse_integer_and_slice', function(assert) {
    var a;

    a = [4, '1', '3:4', np.newaxis, 0];
    np.indexing.parse_integer_and_slice(a);
    np.testing.assert_allclose(
        a, [4, 1, new np.indexing.Slice(3, 4), np.newaxis, 0], {assert: assert});

    a = [0, null, ':', np.Elipsis, ':'];
    np.indexing.parse_integer_and_slice(a);
    np.testing.assert_allclose(
        a,
        [0, null, new np.indexing.Slice(), np.Elipsis, new np.indexing.Slice()],
        {assert: assert}
    );

    assert.throws(
        function() {
            np.indexing.parse_integer_and_slice([0, 'null', ':']);
        },
        /invalid item/,
        "should raise an error"
    );

    assert.throws(
        function() {
            np.indexing.parse_integer_and_slice(['1.2:']);
        },
        /invalid item/,
        "should raise an error"
    );

    assert.throws(
        function() {
            np.indexing.parse_integer_and_slice(['1.2']);
        },
        /invalid item/,
        "should raise an error"
    );
});


QUnit.test('np.indexing.expand_elipsis', function(assert) {
    var a, expected, slice;
    slice = new np.indexing.Slice();

    a = [1, 3, np.Elipsis, -1];
    np.indexing.expand_elipsis(a, [10, 20, 30, 40]);
    expected = [1, 3, slice, -1];
    np.testing.assert_allclose(a, expected, {assert: assert});

    a = [1, 3, np.Elipsis];
    np.indexing.expand_elipsis(a, [10, 20, 30, 40]);
    expected = [1, 3, slice, slice];
    np.testing.assert_allclose(a, expected, {assert: assert});

    a = [np.Elipsis, new np.indexing.Slice(1, 2)];
    np.indexing.expand_elipsis(a, [10, 20, 30, 40]);
    expected = [slice, slice, slice, new np.indexing.Slice(1, 2)];
    np.testing.assert_allclose(a, expected, {assert: assert});

    assert.throws(
        function() {
            a = [np.Elipsis, new np.indexing.Slice(1, 2), np.Elipsis];
            np.indexing.expand_elipsis(a, [10, 20, 30, 40]);
        },
        /more than one Elipsis found/,
        "should raise an error"
    );
});


QUnit.test('np.indexing.normalize_index', function(assert) {
    var a, expected, slice;
    slice = new np.indexing.Slice();

    a = [1, 2, -2, 0];
    np.indexing.normalize_index(a, [10, 20, 30, 40]);
    expected = [1, 2, 28, 0];
    np.testing.assert_allclose(a, expected, {assert: assert});

    a = [-5, np.newaxis, -1, np.newaxis];
    np.indexing.normalize_index(a, [10, 20]);
    expected = [5, np.newaxis, 19, np.newaxis];
    np.testing.assert_allclose(a, expected, {assert: assert});

    a = [-5];
    np.indexing.normalize_index(a, [20]);
    expected = [15];
    np.testing.assert_allclose(a, expected, {assert: assert});

    assert.throws(
        function() {
            a = [-10, 3];
            np.indexing.normalize_index(a, [5, 5]);
        },
        /out of range/,
        "should raise an error"
    );

    assert.throws(
        function() {
            a = [10, 3];
            np.indexing.normalize_index(a, [5, 5]);
        },
        /out of range/,
        "should raise an error"
    );

    assert.throws(
        function() {
            a = [0, new np.indexing.Slice(10, 1)];
            np.indexing.normalize_index(a, [5, 5]);
        },
        /out of range/,
        "should raise an error"
    );

    assert.throws(
        function() {
            a = [0, new np.indexing.Slice(-10, 1)];
            np.indexing.normalize_index(a, [5, 5]);
        },
        /out of range/,
        "should raise an error"
    );
});


QUnit.test('np.indexing.add_tail', function(assert) {
    var a, expected, slice;
    slice = new np.indexing.Slice();

    a = [1, 3, -1];
    np.indexing.add_tail(a, [10, 20, 30, 40]);
    expected = [1, 3, -1, slice];
    np.testing.assert_allclose(a, expected, {assert: assert});

    a = [-1];
    np.indexing.add_tail(a, [10, 20, 30, 40]);
    expected = [-1, slice, slice, slice];
    np.testing.assert_allclose(a, expected, {assert: assert});

    a = [new np.indexing.Slice(1)];
    np.indexing.add_tail(a, [10, 20, 30, 40]);
    expected = [a[0], slice, slice, slice];
    np.testing.assert_allclose(a, expected, {assert: assert});

    assert.throws(
        function() {
            a = [1, 2, new np.indexing.Slice(1), 3, 4];
            np.indexing.add_tail(a, [10, 20, 30, 40]);
        },
        /too many/,
        "should raise an error"
    );
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
