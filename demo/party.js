global.sodium = require('libsodium-wrappers');
global.fetch = require('node-fetch');

// command line arguments
var args = process.argv;
var role = args[3];
var input = args[4];
const circuitURL = 'circuits/' + args[2];

// include JIGG library
const { Garbler, Evaluator, bin2hex, hex2bin } = require('../src/jigg.js');

// application code
input = hex2bin(input);
input = input.split('').reverse().map(JSON.parse);

const progress = function (start, total) {
  console.log('Progress', start, '/', total);
};

const callback = function (results) {
  results = bin2hex(results);
  console.log('Results: ' + results);
  console.timeEnd('time');
  // process.exit();
};

console.time('time');
if (role === 'garbler') {
  var garbler = new Garbler(circuitURL, input, callback, progress, 0, 0);
  garbler.start();
} else if (role === 'evaluator') {
  var evaluator = new Evaluator(circuitURL, input, callback, progress, 0, 0);
  evaluator.start();
}
