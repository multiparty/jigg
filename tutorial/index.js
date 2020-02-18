const express = require('express');
const Neptune = require('neptune-notebook'); // Require neptune server-side code

const neptune = new Neptune(); // Create a new server
neptune.app.use('/document/src', express.static(__dirname + '/src'));
neptune.app.use('/dist', express.static(__dirname + '/../dist/'));
neptune.app.use('/circuits/bristol', express.static(__dirname + '/../circuits/bristol'));

neptune.addDocument('intro', __dirname + '/intro.md', true, [__dirname + '/../dist/jigg.js']);

// Static serving: Dump document as an HTML file
// neptune.writeHTML('Intro to Garbled Circuits', absolute_path+'../intro-to-garbled-circuits.html');

// Dynamic serving: supports server-side interactive code block
neptune.start(9122);  // neptune will log to the console the urls for each document

// Global variables that can be accessed from within the code of documents on the server side
global.httpServer = neptune.server;
global.JIGG = require('../src/jigg.js');

global.getCode = function (name) {
  const fs = require('fs');
  return fs.readFileSync(__dirname + '/../circuits/bristol/'+name, 'utf-8');
};
global.getAnd4Circuit = global.getCode.bind(null, 'and-4.txt');
global.getSha256Circuit = global.getCode.bind(null, 'sha-256-reverse.txt');
