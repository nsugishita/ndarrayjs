'use strict';

// Configure JSDoc.
// https://jsdoc.app/about-configuring-jsdoc.html

module.exports = {
    source: {
        include: ["lib", "doc/README.md"],
        excludePattern: "(^|\\/|\\\\)_",
    },
    opts: {
        destination: "./doc/html",      // same as -d ./out/html
        recurse: true,                  // same as -r
    }
}
