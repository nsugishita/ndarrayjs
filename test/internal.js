var testing = require('../lib/testing.js');
var np = {};
np.internal = require('../lib/internal.js');

QUnit.module('internal');

QUnit.test('iterator_from_shape', function(assert) {
    testing.qunit_enable_deep_equal(assert);
    var it;
    it = np.internal.iterator_from_shape([2, 3]);
    assert.deep_equal(it.next().value, [0, 0], 'iterator must generate [0, 0]');
    assert.deep_equal(it.next().value, [0, 1], 'iterator must generate [0, 1]');
    assert.deep_equal(it.next().value, [0, 2], 'iterator must generate [0, 2]');
    assert.deep_equal(it.next().value, [1, 0], 'iterator must generate [1, 0]');
    assert.deep_equal(it.next().value, [1, 1], 'iterator must generate [1, 1]');
    assert.deep_equal(it.next().value, [1, 2], 'iterator must generate [1, 2]');
    assert.ok(it.next().done, 'iterator must be exhausted');

    it = np.internal.iterator_from_shape([2, 2, 3]);
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

    it = np.internal.iterator_from_shape([4, 0]);
    assert.ok(it.next().done, 'iterator must be exhausted');
});

QUnit.test('iterator_from_shape', function(assert) {
    testing.qunit_enable_deep_equal(assert);
    var array;
    array = np.internal.reshape_jsarray([1, 2, 3, 4], [2, 2]);
    assert.deep_equal(array, [[1, 2], [3, 4]], '[[1, 2], [3, 4]]');
    array = np.internal.reshape_jsarray([1, 3, 5, 7, 9, 11], [2, 3]);
    assert.deep_equal(array, [[1, 3, 5], [7, 9, 11]], '[[1, 3, 5], [7, 9, 11]]');
    array = np.internal.reshape_jsarray([1, 3, 5, 7, 9, 11], [3, 1, 2]);
    assert.deep_equal(array, [[[1, 3]], [[5, 7]], [[9, 11]]], '[[[1, 3]], [[5, 7]], [[9, 11]]]');
});
