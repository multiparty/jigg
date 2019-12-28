/**
 * End-to-end tests that simulate multiple parties running the protocol.
 * @module test/simulate.js
 */

const bits = require('../../src/data/bits.js');
const circuit = require('../../src/data/circuit.js');
const Garbler = require('../../src/garbler.js');
const Evaluator = require('../../src/evaluator.js');

global.sodium = require('libsodium-wrappers');
global.fetch = require('node-fetch');

/*
 * Equivalent of running the following command:
 *   `node demo/party.js <circuit> <role> <input>`
 */
function run(circuitFileName, role, input) {
  const circuitPathURL = 'circuits/bristol/' + circuitFileName;

  const progress = function (start, total) {
    console.log(role, ':', start, '/', total);
  };

  const callback = function (resolve, results) {
    console.log(results, resolve);
    console.log('Results: ' + results);
    // console.timeEnd('time');
    resolve(results);
  };

  // console.time('time');
  var promise = new Promise(function (resolve) {
    if (role === 'Garbler') {
      var garbler = new Garbler(circuitPathURL, input, callback.bind(this, resolve), progress, 0, 0, 3001, false);
      garbler.start();
    } else if (role === 'Evaluator') {
      var evaluator = new Evaluator(circuitPathURL, input, callback.bind(this, resolve), progress, 0, 0, 3001, false);
      evaluator.start();
    }
  });

  return promise;
}

/*
 *  Test a circuit's correctness for a known input-output pair.
 */
function test() { //circuit, testvector) {
  // Load a test vector
  //const input1 = testvector[0];
  //const input2 = testvector[1];
  //const answer = testvector[2];

  var input1 = bits.random(2, 1);
  var input2 = bits.random(2, 2);
  input1.bits = [1, 0];
  input2.bits = [1, 1];
  var answer = "0";
  var and4_path = "and4.txt";
  //var and4_bristol = "3 7\n4 1 1 1 1\n1 1\n2 1 0 1 4 AND\n2 1 2 3 5 AND\n2 1 4 5 6 AND";
  //var circuit = circuit.Circuit.prototype.fromBristolFashion(and4_bristol);

  // Start the server.
  var server = require('../../server.js');
  server.open(3001);

  // Start the two parties.
  const garbler_out = run(and4_path, 'Garbler', input1);
  const evaluator_out = run(and4_path, 'Evaluator', input2);

  // Garble/evaluate the circuit and compare results.
  return new Promise(function (resolve) {
    Promise.all([garbler_out, evaluator_out]).then(function (result) {
      console.log(result);

      if (server) {
        // Close the server.
        setTimeout(function(){
          server.close();
        }, 500);
      }

      resolve([
        result[0],
        (answer.toString() === result[0].toString()) &&
        (answer.toString() === result[1].toString())
      ]);
    });
  });
}

test();

module.exports = test;

/*if (process.argv.length === 4) {
  const log = console.log; console.log = Function();  // TEMPORARY anti-logging hack
  test(process.argv[2], JSON.parse(process.argv[3]), true).then(log.bind(null, process.argv[2]));
}*/
