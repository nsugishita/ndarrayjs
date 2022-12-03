# ndarray

Minimal implementation of multi-dimensional arrays in javascript.
This also can load binary data in npz files.

## For developers

This uses Grunt to run tasks such as unittests.
To run Grunt for the first time, issue the following command:

```
docker-compose up --build
```

Next time, one can just use

```
docker-compose up
```

To run unittests locally (on a browser), use a http server.
If Python3 is installed, at the top of the directory, type

```
python3 -m http.server 9000
```

Then, open a browser and go to `localhost:9000/test/`.

## License

Copyright (c) 2020 Nagisa Sugishita Licensed under the MIT license.
