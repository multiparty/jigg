global.sodium = require('libsodium-wrappers');
global.fetch = require('node-fetch');

/*
 *  Equivilant of running the following command:
 *  `node demo/party.js <circuit> <role> <input>`
 */
function run(circuit, role, input) {
  const circuitURL = 'circuits/' + circuit;

  // include JIGG library
  const { Garbler, Evaluator, bin2hex, hex2bin } = require('../../../src/jigg.js');

  // application code
  input = hex2bin(input);
  input = input.split('').reverse().map(JSON.parse);

  const progress = function (start, total) {
    console.log(role, ':', start, '/', total);
  };

  const callback = function (resolve, results) {
    console.log(results, resolve);
    results = bin2hex(results);
    console.log('Results: ' + results);
    // console.timeEnd('time');
    resolve(results);
  };

  // console.time('time');
  var promise = new Promise(function (resolve) {
    if (role === 'garbler') {
      var garbler = new Garbler(circuitURL, input, callback.bind(this, resolve), progress, 0, 0, 3001, false);
      garbler.start();
    } else if (role === 'evaluator') {
      var evaluator = new Evaluator(circuitURL, input, callback.bind(this, resolve), progress, 0, 0, 3001, false);
      evaluator.start();
    }
  });

  return promise;
}

/*
 *  Test a circuit's correctness for a known input-ouput pair
 */
function test(circuit, testvector, server) {
  // Load a test vector
  const input1 = testvector[0];
  const input2 = testvector[1];
  const answer = testvector[2];

  if (server) {
    // Start the server
    var server = require('../../../server.js');
    server.open(3001);
  }

  // Start the two parties
  const garbler_out = run(circuit, 'garbler', input1);
  const evaluator_out = run(circuit, 'evaluator', input2);

  // Compute the circuit and compare results
  return new Promise(function (resolve) {
    Promise.all([garbler_out, evaluator_out]).then(function (result) {
      console.log(result);

      if (server) {
        // Close the server
        setTimeout(function(){
          server.close();
        }, 500);
      }

      resolve([
        answer,
        result[0],
        (answer === result[0]) && (answer === result[1])
      ]);
    });
  });
}

module.exports = test;

if (process.argv.length === 4) {
  const log = console.log; console.log = Function();  // TEMPORARY anti-logging hack
  test(process.argv[2], JSON.parse(process.argv[3]), true).then(log.bind(null, process.argv[2]));
}
