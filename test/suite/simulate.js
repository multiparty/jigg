/**
 * End-to-end tests that simulate multiple parties running the protocol.
 * @module test/simulate
 */
 
'use strict';

const fs = require('fs').promises;

const bits = require('../../src/data/bits');
const circuit = require('../../src/data/circuit');
const Garbler = require('../../src/garbler');
const Evaluator = require('../../src/evaluator');

global.sodium = require('libsodium-wrappers');
global.fetch = require('node-fetch');

// Disable output from invoked components.
const simulateLog = console.log; console.log = Function();

/*
 * Run agent playing a role in the protocol.
 * @param {string} circuitFileName - Circuit file name
 * @param {string} role - Agent role ('Garbler' or 'Evaluator')
 * @param {Object} input - Bit vector representing input
 * @returns {Promise} Promise representing agent output
 */
function runAgent(circuitFileName, role, input) {
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
 * @param {string[]} filenames - File names of circuits to test
 * @param {number} index - Index of current test
 * @returns {Promise} Promise representing the completion of the tests.
 */
async function executeSimulationTests(filenames, index) {
  if (index >= filenames.length) {
    return null;
  }

  let raw = await fs.readFile('./circuits/bristol/' + filenames[index], 'utf8');
  let c = circuit.Circuit.prototype.fromBristolFashion(raw);
  let input1 = bits.random(c.input.length/2, 1);
  let input2 = bits.random(c.input.length/2, 2);
  var outEval = c.evaluate([input1, input2]);

  // Start the server.
  var server = require('../../server');
  server.open(3001);

  // Start the two parties.
  const garbler_out = runAgent(filenames[index], 'Garbler', input1);
  const evaluator_out = runAgent(filenames[index], 'Evaluator', input2);

  // Garble/evaluate the circuit and compare results.
  return new Promise(function (resolve) {
    Promise.all([garbler_out, evaluator_out]).then(function (outEtoE) {
      if (outEval.toString() == outEtoE[0].toString() &&
          outEval.toString() == outEtoE[1].toString()
         ) {
        simulateLog("Test using " + filenames[index] + " passed.");
      } else {
        simulateLog("\n*******************");
        simulateLog("Test using " + filenames[index] + " failed:");
        simulateLog("Output expected:");
        simulateLog(outEval);
        simulateLog("Outputs received:");
        simulateLog(outEtoE);
        simulateLog("*******************\n");
      }

      if (server) {
        // Close the server.
        setTimeout(function(){
          server.close();
          resolve(executeSimulationTests(filenames, index+1));
        }, 500);
      }
    });
  });
}

let filenames = [
  'universal_1bit.txt',
  'and4.txt', 'and8.txt',
  'adder_32bit.txt', 'adder_64bit.txt', 'sub64.txt',
  'comparator_32bit_signed_lt.txt',
  'zero_equal_64.txt', //'zero_equal_128.txt',
  //'mult_32x32.txt', 'mult64.txt', 'divide64.txt'
];

if (process.argv.length === 2) {
  // Run all tests.
  simulateLog("\nRunning all tests...");
  executeSimulationTests(filenames, 0);
} else if (process.argv.length === 3) {
  // Run test on a single specified file.
  simulateLog("\nRunning a single test...");
  executeSimulationTests([process.argv[2]], 0);
}

module.exports = executeSimulationTests;
