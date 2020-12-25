This is a memo to give a brief overview of the implementation.

- helper.js: helper methods on general issues and javascript native arrays.
    - dependencies: none
- testing.js: test utilities.
    - dependencies: none
- dtype.js: definition of data types (dtype).
    - dependencies: none
- ndarray.js: definition of ndarray and getter/setter of elements.
    - dependencies: dtype.js, helper.js
- constructor.js: methods to create ndarrays, such as np.zeros, np.arange.
    - dependencies: dtype.js, helper.js, ndarray.js
- reshape.js: functions to reshape arrays.
    - dependencies: dtype.js, helper.js, ndarray.js
- indexing.js: indexing/slicing functions.
    - dependencies: dtype.js, helper.js, ndarray.js, reshape.js
- ufunc.js: ufunc implementation.
    - dependencies: constructor.js dtype.js
- function.js: other ndarray functions such as sum or mean.
    - dependencies: constructor.js, dtype.js, indexing.js, ndarray.js,
      reshape.js, ufunc.js
- load.js: npz loader implementation
    - dependencies: dtype.js, helper.js, ndarray.js
- random.js: np.random impelmentaion.
    - dependencies: dtype.js, ndarray.js

