global.sodium = require('libsodium-wrappers');
global.fetch = require('node-fetch');

const hexutils = require('../src/utils/hexutils');
const jigg = require('../src/jigg');

// Command line arguments.
var args = process.argv;
var role = args[2];
var input = args[3];
const circuitURL = 'circuits/bristol/sha256.txt';

// Application code.
input = hexutils.hex2bin(input);
input = input.split('').reverse().map(JSON.parse);

const progress = function (start, total) {
  console.log('Progress', start, '/', total);
};

const callback = function (results) {
  results = hexutils.bin2hex(results);
  console.log('Results: ' + results);
  console.timeEnd('time');
};

console.time('time');
if (role === 'garbler') {
  var garbler = new jigg.Agent('Garbler', circuitURL, input, callback, progress, 0, 0);
  garbler.start();
} else if (role === 'evaluator') {
  var evaluator = new jigg.Agent('Evaluator', circuitURL, input, callback, progress, 0, 0);
  evaluator.start();
}
