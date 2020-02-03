// Read config file
const fs = require('fs');
const tpath = process.argv.length === 3 ? process.argv[2] : 'test/suite/defaults.json';
console.log(tpath);
const config = JSON.parse(fs.readFileSync(tpath, 'utf8'));

// Import the server and test party simulator
const test = require('./test.js');
const server = require('../../server.js');

// Start the server
server.open(3001);

console.log('Testing ' + config.length + ' circuits');
const log = console.log;
let problems = 0;
(function unit_test(i, j) {
  if (j == 1) {
    // starting config[i]
  }
  let circuit = config[i][0];
  let tvector = config[i][j];
  log(circuit, tvector);
  test(circuit, tvector).then(function (data) {
    log(' '.repeat(circuit.length), data);
    problems += data[2] === false;

    // Scan to next test
    j++;
    if (j == config[i].length) {
      i++;
      j = 1;
      // goto next
    }

    if (i == config.length) {
      log('Completed with ' + problems + ' problem' + (problems === 1 ? '.' : 's.'));
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
