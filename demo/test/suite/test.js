global.sodium = require('libsodium-wrappers');
global.fetch = require('node-fetch');

// TEMPORARY subprocess dependency
const { spawn } = require('child_process');

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
      var garbler = new Garbler(circuitURL, input, callback.bind(this, resolve), progress, 0, 0, false);
      garbler.start();
    } else if (role === 'evaluator') {
      var evaluator = new Evaluator(circuitURL, input, callback.bind(this, resolve), progress, 0, 0, false);
      evaluator.start();
    }
  });

  return promise;
}

/*
 *  Test a circuit's correctness for a known input-ouput pair
 */
function test(circuit, testvector) {
  // Load a test vector
  const input1 = testvector[0];
  const input2 = testvector[1];
  const answer = testvector[2];

  // Start the server
  var server = require('../../../server.js');

  // Compute the circuit and compare results
  return new Promise(function (resolve) {
    const garbler_out = run(circuit, 'garbler', input1);

    const evaluator_out = run(circuit, 'evaluator', input2);
    // spawn('node', ['demo/party.js', circuit, 'evaluator', input2]);
    // Why don't these ^^^ run the same?

    Promise.all([garbler_out/*, evaluator_out*/]).then(function (result) {
      console.log(result);

      setTimeout(function(){
        server.close();
      }, 500);

      resolve([
        answer,
        result[0],
        (answer === result[0]) /*&& (answer === result[1])*/
      ]);
    });
  });
}

// test('bristol_circuit.txt', [
//     '0',
//     '0',
//     '2'
// ]).then(console.log.bind(null, 'unit test'));

// test('zero_equal.txt', [
//   '00000000',
//   '00000000',
//   '1'
// ]).then(console.log.bind(null, 'unit test'));

// test('aes256.txt', [
//   '0000000000000000000000000000000000000000000000000000000000000000',
//   '0000000000000000000000000000000000000000000000000000000000000000',
//   'da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8'
// ]);


module.exports = test;

if (process.argv.length === 4) {
  test(process.argv[2], JSON.parse(process.argv[3])).then(console.log.bind(null, process.argv[2]));
}

console.log = Function();  // TEMPORARY anti-logging hack
