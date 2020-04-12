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
    if (np.helper.is_es6_supported) {
        let a = np.asarray([1, 2, 3, 4, 5, 6], [2, 3], 'float32');
        assert.equal(a.shape.length, 2);
        assert.equal(a.shape[0], 2);
        assert.equal(a.shape[1], 3);
    }
    np.helper.es5mode();
    let a = np.asarray([1, 2, 3, 4, 5, 6], [2, 3], 'float32');
    assert.equal(a.shape.length, 2);
    assert.equal(a.shape[0], 2);
    assert.equal(a.shape[1], 3);
});
