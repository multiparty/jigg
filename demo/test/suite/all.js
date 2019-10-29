// Read config file
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('demo/test/suite/config.json', 'utf8'));

// Import node party simulation
const test = require('./test.js');

// Start the server
var server = require('../../../server.js');

console.log('begin');
const log = console.log;
(function unit_test(i) {
  log('start', config[i]);
  let circuit = config[i][0];
  let tvector = config[i][1];
  test(circuit, tvector).then(function (data) {
    log(data);
    if (++i < config.length) {
      setTimeout(function () {
        log('continue');
        unit_test(i);
      }, 1);
    } else {
      log('done');
      server.close();
    }
  });
})(0)

console.log = Function();  // TEMPORARY anti-logging hack
