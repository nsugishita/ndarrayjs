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
        assert.equal(a.shape.length, 2);
        assert.equal(a.shape[0], 2);
        assert.equal(a.shape[1], 3);
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
        assert.equal(a.shape.length, 3);
        assert.equal(a.shape[0], 1);
        assert.equal(a.shape[1], 3);
        assert.equal(a.shape[2], 2);
    }

    if (np.helper.is_es6_supported) {
        impl();
    }
    np.helper.es5mode();
    impl();
});
