(function (root, definition) {
    "use strict";
    if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        if (typeof root.np === 'undefined')
            root.np = {};
        root.np.testing = definition();
    }
}(this, function () {
    "use strict";

    /*
    ** @param a, b        - values (Object, RegExp, Date, etc.)
    ** @returns {boolean} - true if a and b are the object or same primitive value or
    **                      have the same properties with the same values
    */
    var assert_deep_equal = function(a, b, options) {
        options = options || {};
        var assert = options.assert;
        var comment = options.comment;
        var res = false;
        try {
            _assert_deep_equal_impl(a, b);
            res = true;
        } catch(e) {
            if (assert) {
                assert.ok(false, e.message);
            } else {
                throw e;
            }
        }
        if (assert && res) {
            if (comment) {
                assert.ok(true, comment);
            } else {
                assert.ok(true, 'assert: ' + a + ' = ' + b);
            }
        }
    };

    var qunit_enable_deep_equal = function(assert) {
        assert.deep_equal = function(a, b, comment) {
            return assert_deep_equal(a, b, {assert: assert, comment: comment});
        };
    };

    var _assert_deep_equal_impl = function(a, b) {
        // If a and b reference the same value, return true
        if (a === b) return true;

        // If a and b aren't the same type, return false
        if (typeof a != typeof b) {
            throw new Error("type mismatch: " + (typeof a) + " vs " + (typeof b));
        }

        // Already know types are the same, so if type is number
        // and both NaN, return true
        if (typeof a == 'number' && isNaN(a) && isNaN(b)) return true;

        // Helper to return a value's internal object [[Class]]
        // That this returns [object Type] even for primitives
        function getClass(obj) {
            return Object.prototype.toString.call(obj);
        }

        // Get internal [[Class]]
        var aClass = getClass(a);
        var bClass = getClass(b);

        // Return false if not same class
        if (aClass != bClass) {
            throw new Error("class mismatch: " + aClass + " vs " + bClass);
        }

        var avalue, bvalue;

        // If they're Boolean, String or Number objects, check values
        if (aClass == '[object Boolean]' || aClass == '[object String]' || aClass == '[object Number]') {
            avalue = a.valueOf();
            bvalue = b.valueOf();
            if (avalue != bvalue) {
                throw new Error("value mismatch: " + avalue + " vs " + bvalue);
            } else {
                return true;
            }
        }

        // If they're RegExps, Dates or Error objects, check stringified values
        if (aClass == '[object RegExp]' || aClass == '[object Date]' || aClass == '[object Error]') {
            avalue = a.toString();
            bvalue = b.toString();
            if (avalue != bvalue) {
                throw new Error("value mismatch: " + avalue + " vs " + bvalue);
            } else {
                return true;
            }
        }

        // Otherwise they're Objects, Functions or Arrays or some kind of host object
        if (typeof a == 'object' || typeof a == 'function') {

            // For functions, check stringigied values are the same
            // Almost certainly false if a and b aren't trivial
            // and are different functions
            if (aClass == '[object Function]' && a.toString() != b.toString()) return false;

            var aKeys = Object.keys(a);
            var bKeys = Object.keys(b);

            // If they don't have the same number of keys, return false
            if (aKeys.length != bKeys.length) {
                throw new Error('key mismatch: ' + aKeys + " vs " + bKeys);
            }

            // Check they have the same keys
            var does_b_has = function(key) {
                return b.hasOwnProperty(key);
            };
            if (!aKeys.every(does_b_has)) {
                throw new Error('key mismatch: ' + aKeys + " vs " + bKeys);
            }

            // Check key values;
            var key;
            var msg;
            for (key in a) {
                try {
                    _assert_deep_equal_impl(a[key], b[key]);
                } catch(e) {
                    msg = e.message;
                    if (msg.startsWith('[')) {
                        e.message = "[" + key + "." + e.message.substr(1);
                        throw e;
                    } else {
                        e.message = "[" + key + "] " + e.message;
                        throw e;
                    }
                }
            }
            return true;
        }
        throw new Error("Unknown types: " + (typeof a) + " and " + (typeof b));
    };

    return {
        assert_deep_equal: assert_deep_equal,
        qunit_enable_deep_equal: qunit_enable_deep_equal
    };
}));
