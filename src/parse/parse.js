// Parses bristol fashion text circuits into Circuit objects

'use strict';

/*
 * Bristol fashion has the following format:
 * <GATE COUNT> <WIRE_COUNT>
 * <INPUT COUNT> <FIRST INPUT BIT SIZE> <SECOND INPUT BIT SIZE> ...
 * <OUTPUT COUNT> <FIRST OUTPUT SIZE> <SECOND OUTPUT SIZE> ...
 * <GATE INPUT COUNT> <GATE OUTPUT COUNT> <INPUT WIRE INDEX> ... <OUTPUT WIRE INDEX> ... <GATE OPERATION>
 * ...
 */

const Circuit = require('../modules/circuit.js');
const Gate = require('../modules/gate.js');

const RECOGNIZED_OPERATIONS = ['AND', 'XOR', 'INV', 'NOT'];

module.exports = function (text) {
  const rows = text.split('\n').filter(function (line) {
    const tmp = line.trim();
    return !(tmp.startsWith('#') || tmp.length === 0);
  }).map(function (line) {
    return line.split(' ').map(function (token) {
      return token.trim();
    });
  });

  // Begin parsing input/output meta data
  const wireCount = parseInt(rows[0][1]);
  const inputs = rows[1].slice(1);
  const outputs = rows[2].slice(1);

  // Sanity Checks
  if (rows[2][0] !== '1' || outputs.length !== 1) {
    throw new Error('Circuit has multiple outputs! Unsupported');
  }
  if (rows[1][0] !== '2' || inputs.length !== 2) {
    throw new Error('Circuit does not have exactly 2 inputs! Unsupported');
  }
  if (rows.length !== parseInt(rows[0][0]) + 3) {
    throw new Error('Circuit has inconsistent number of lines compared to gates count');
  }

  // Create empty circuit object
  const circuit = new Circuit(wireCount, parseInt(inputs[0]), parseInt(inputs[1]), parseInt(outputs[0]));

  // Parse the individual gates
  for (let r = 3; r < rows.length; r++) {
    const tokens = rows[r];

    const inputCount = parseInt(tokens[0]);
    const outputCount = parseInt(tokens[1]);
    const operation = tokens[tokens.length-1];

    if (RECOGNIZED_OPERATIONS.indexOf(operation) === -1) {
      throw new Error('Unrecognized gate: ' + operation)
    }
    if (outputCount !== 1) {
      throw new Error('Gate ' + r + ' does not have exactly 1 output!');
    }

    const output = parseInt(tokens[2 + inputCount]);
    const inputs = tokens.slice(2, 2 + inputCount).map(function (e) {
      return parseInt(e);
    });
    const gate = new Gate(r - 3, operation, inputs, output);

    if ((operation === 'INV' || operation === 'NOT') && (inputs.length !== 1)) {
      throw new Error(operation + ' Gate ' + r + ' does not have exactly 1 input!');
    }
    if ((operation === 'AND' || operation === 'XOR') && (inputs.length !== 2)) {
      throw new Error('Gate ' + r + ' does not have exactly 2 inputs!');
    }

    circuit.gates.push(gate);
  }

  return circuit;
};
