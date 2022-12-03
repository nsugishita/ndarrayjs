# ndarray

Minimal implementation of multi-dimensional arrays in javascript.
This also can load binary data in npz files.

## For users

This library loads npz files and runs simple operations on the loaded data.

```js
(async function() {
   data = await np.load("data.npz");
   // Get the shape of `z` as an array. E.g., [2, 2]
   console.log(data.z.shape);
   // Get the data as an array. E.g., [[1, 2], [3, 4]]
   console.log(data.z.tojs());
   // Compute the sum over axis 1. E.g., [3, 7]
   console.log(data.z.sum(1).tojs());
})();
```

## For developers

This uses Grunt to run tasks such as unittests.
To run Grunt for the first time, issue the following command:

```sh
docker-compose up --build
```

Next time, one can just use

```sh
docker-compose up
```

To run unittests locally (on a browser), use a http server.
If Python3 is installed, at the top of the directory, type

```sh
python3 -m http.server 9000
```

Then, open a browser and go to `localhost:9000/test/`.

## License

Copyright (c) 2020 Nagisa Sugishita Licensed under the MIT license.
