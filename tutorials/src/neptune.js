const absolute_path = '/Users/newuser/Downloads/Repos/jigg/tutorials/src/';
const express = require('express');
const Neptune = require('neptune-notebook'); // Require neptune server-side code
const jsDependencies = [absolute_path+'../../dist/jigg.js'];
const neptune = new Neptune(); // Create a new server
neptune.addDocument('I2GC', absolute_path+'intro-to-garbled-circuits.md', true, jsDependencies);
// ...

// Static serving: Dump document as an HTML file
// neptune.writeHTML('Intro to Garbled Circuits', absolute_path+'../intro-to-garbled-circuits.html');

// Dynamic serving: supports server-side interactive code block
neptune.start(9122);  // neptune will log to the console the urls for each document

global.neptune = neptune;
global.app = neptune.app;
global.server = neptune.server;

app.use('/', express.static(absolute_path+'../../tutorials/'));
app.use('/static', express.static('static/'));
app.use('/lib', express.static('../lib/'));
app.use('/dist', express.static('../dist/'));
