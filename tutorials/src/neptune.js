const express = require('express');
const Neptune = require('neptune-notebook'); // require neptune server-side code
const jsDependencies = ['../../dist/jigg.js'];
const neptune = new Neptune(); // create a new server
neptune.addDocument('document-name1', 'path/to/markdown1', [<auto-refresh>=false], [<injected-JS-files>=[]], [<injected-CSS-files>=[]], [<injected-HTML-files>=[]]);
// ...

// Static serving: Dump document as an HTML file
neptune.writeHTML('document-name1', 'path/to/output/html');

// // Dynamic serving: supports server-side interactive code block
// neptune.start(9111);  // neptune will log to the console the urls for each document
//
// global.neptune = neptune;
// global.app = neptune.app;
// global.server = neptune.server;
//
// app.use('/static', express.static('static/'));
// app.use('/lib', express.static('../lib/'));
// app.use('/dist', express.static('../dist/'));
