/**
 * Generation of garbled gate files for circuits.
 * @module test/suite/generate
 */

'use strict';

const fs = require('fs');

const circuit = require('../../src/data/circuit');
const garble = require('../../src/garble');

/*
 * Test a circuit's correctness for a known input-output pair.
 * @param {string[]} filenames - File names of circuits
 * @param {number} index - File name to process next
 * @returns {Promise} Promise representing the rest of the process
 */
async function generateGarbledGates(filenames, index) {
  await sodium.ready;
  if (index >= filenames.length) {
    return null;
  }

  var timeStart = (new Date()).getTime();
  let raw = await fs.promises.readFile('./circuits/bristol/' + filenames[index] + '.txt', 'utf8');
  let c = circuit.fromBristolFashion(raw);

  let wToLs_G = garble.generateWireToLabelsMap(c);
  let assignmentPathAndFile = './circuits/gg/' + filenames[index] + '.assignment.json';
  fs.promises.writeFile(assignmentPathAndFile, wToLs_G.toJSONString());

  let gatesGarbled_G = garble.garbleGates(c, wToLs_G);
  let ggPathAndFile = './circuits/gg/' + filenames[index] + '.gg.json';
  fs.promises.writeFile(ggPathAndFile, gatesGarbled_G.toJSONString());

  var timeEnd = (new Date()).getTime();
  console.log('  * generated ' + filenames[index] + '.*.json (' + (timeEnd-timeStart) + 'ms)')

  return new Promise(function (resolve) {
    setTimeout(function(){
      resolve(generateGarbledGates(filenames, index+1));
    }, 500);
  });
}

let filenames = [
  'logic-bristol-test', 'logic-universal-1-bit',
  'logic-and-4-bit', 'logic-and-8-bit',
  'arith-add-32-bit-old', 'arith-add-64-bit-old',
  'arith-add-64-bit-truncated',
  'arith-sub-64-bit',
  'arith-mul-32-bit-old',
  'arith-mul-64-bit', 'arith-mul-64-bit-truncated',
  'arith-div-64-bit',
  'compare-eq-zero-64-bit',
  'compare-lt-32-bit-signed-old',
  'compare-lt-32-bit-unsigned-old',
  'compare-lteq-32-bit-signed-old',
  'compare-lteq-32-bit-unsigned-old',
  'aes-128',
  'sha-256'
];

if (process.argv.length === 2) {
  // Generate all garbled gate files.
  console.log("\nGenerating garbled gates for all circuits:");
  try { fs.mkdirSync('./circuits/gg/'); } catch (err) {}
  generateGarbledGates(filenames, 0);
}

module.exports = generateGarbledGates;
