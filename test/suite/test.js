global.sodium = require('libsodium-wrappers-sumo');
global.fetch = require('node-fetch');

/*
 *  Equivilant of running the following command:
 *  `node demo/party.js <circuit> <role> <input>`
 */
function run(circuit, role, input, debug) {
  const circuitURL = 'circuits/' + circuit;

  // include JIGG library
  const { Agent, utils } = require('../../src/jigg.js');
  const { Bits, bin2hex, hex2bin } = utils;

  // application code
  input = hex2bin(input);
  input = input.split('').reverse().map(JSON.parse);

  const progress = function (start, total) {
    console.log(role, ':', start, '/', total);
  };

  const callback = function (resolve, results) {
    console.log(results.toString(), resolve);
    results = bin2hex(results.toString());
    console.log('Results: ' + results);
    // console.timeEnd('time');
    resolve(results);
  };

  // console.time('time');
  var promise = new Promise(function (resolve) {
    if (role === 'garbler') {
      var garbler = new Agent("Garbler", circuitURL, new Bits(input), callback.bind(this, resolve), progress, 0, 0, 3001, debug);
      garbler.start();
    } else if (role === 'evaluator') {
      var evaluator = new Agent("Evaluator", circuitURL, new Bits(input), callback.bind(this, resolve), progress, 0, 0, 3001, debug);
      evaluator.start();
    }
  });

  return promise;
}

/*
 *  Test a circuit's correctness for a known input-ouput pair
 */
function test(circuit, testvector, server, debug) {
  // Load a test vector
  const input1 = testvector[0];
  const input2 = testvector[1];
  const answer = testvector[2];

  if (server) {
    // Start the server
    var server = require('../../server.js');
    server.open(3001);
  }

  // Start the two parties
  const garbler_out = run(circuit, 'garbler', input1, debug);
  const evaluator_out = run(circuit, 'evaluator', input2, debug);

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

if (process.argv.length >= 4) {
  const log = console.log;
  let debug = true;
  if (process.argv[4] != 'vv') {
    console.log = Function();  // TEMPORARY anti-logging hack
    debug = false;
  }
  test(process.argv[2], JSON.parse(process.argv[3]), true, debug).then(log.bind(null, process.argv[2]));
}
