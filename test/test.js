var test_numpy_is_node = typeof exports !== 'undefined';

if (test_numpy_is_node) {
    np = require('../dist/ndarray.js');
}

QUnit.test('np.array', function(assert) {
    assert.ok(np !== undefined, 'initial test');
});
