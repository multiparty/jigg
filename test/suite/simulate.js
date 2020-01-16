/**
 * End-to-end tests that simulate multiple parties running the protocol.
 * @module test/suite/simulate
 */
 
'use strict';

const fs = require('fs').promises;

const bits = require('../../src/data/bits');
const circuit = require('../../src/data/circuit');
const jigg = require('../../src/jigg');

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
      var garbler = new jigg.Agent('Garbler', circuitPathURL, input, callback.bind(this, resolve), progress, 0, 0, 3001, false);
      garbler.start();
    } else if (role === 'Evaluator') {
      var evaluator = new jigg.Agent('Evaluator', circuitPathURL, input, callback.bind(this, resolve), progress, 0, 0, 3001, false);
      evaluator.start();
    }
  });

  return promise;
}

/*
 * Test a circuit's correctness for a known input-output pair.
 * @param {string[]} filenames - File names of circuits to test
 * @param {number} index - Index of current test
 * @returns {Promise} Promise representing the completion of the tests.
 */
async function executeSimulationTests(filenames, index) {
  if (index >= filenames.length) {
    return null;
  }

  let raw = await fs.readFile('./circuits/bristol/' + filenames[index], 'utf8');
  let c = circuit.fromBristolFashion(raw);

  var inputs = [];
  for (var j = 0; j < c.value_in_count; j++) {
    inputs.push(bits.random(c.value_in_length[j], index+j+1));
  }
  var outEval = c.evaluate(inputs);

  // Split inputs into two halves (to be divided
  // between garbler and evaluator agents).
  var bs = [];
  for (var i = 0; i < inputs.length; i++)
    bs = bs.concat(inputs[i].bits);
  var input1 = new bits.Bits(bs.slice(0, bs.length/2));
  var input2 = new bits.Bits(bs.slice(bs.length/2, bs.length));

  // Start the server.
  var server = require('../../server');
  server.open(3001);
  var timeStart = (new Date()).getTime();

  // Start the two parties.
  const garblerOut = runAgent(filenames[index], 'Garbler', input1);
  const evaluatorOut = runAgent(filenames[index], 'Evaluator', input2);

  // Garble/evaluate the circuit and compare results.
  return new Promise(function (resolve) {
    Promise.all([garblerOut, evaluatorOut]).then(function (outEtoE) {
      if (outEval.toString() == outEtoE[0].toString() &&
          outEval.toString() == outEtoE[1].toString()
         ) {
        var timeEnd = (new Date()).getTime();
        simulateLog("Test using " + filenames[index] + " passed (" + (timeEnd-timeStart) + "ms).");
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
  'logic-universal-1-bit.txt',
  'logic-and-4-bit.txt', 'logic-and-8-bit.txt',
  'arith-add-32-bit-old.txt'
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
