// Read config file
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('demo/test/suite/config.json', 'utf8'));

// Import the server and test party simulator
const test = require('./test.js');
const server = require('../../../server.js');

// Start the server
server.open(3001);

// console.log('begin');
const log = console.log;
(function unit_test(i, j) {
  if (j == 1) {
    // log('start');
    // log(config[i]);
  }
  let circuit = config[i][0];
  let tvector = config[i][j];
  log(circuit, tvector);
  test(circuit, tvector).then(function (data) {
    log(' '.repeat(circuit.length), data);

    // Scan to next test
    j++;
    if (j == config[i].length) {
      i++;
      j = 1;
      // log('finish');
    }

    if (i == config.length) {
      log('done');
      server.close();
      
      // BUG: somehow there is someone listing on the non-test port
      process.exit();  // TEMPORARY fix
    } else {
      setTimeout(function () {
        // log('continue');
        unit_test(i, j);
      }, 1);
    }
  });
})(0, 1)

console.log = Function();  // TEMPORARY anti-logging hack
