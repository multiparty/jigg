/**
 * Circuit data structure and associated functions.
 * @module src/circuit
 */

'use strict';

const socket = require('./lib/socket.js');

const bytes = 16;
const types = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

/**
 * Parse a raw string representation of a circuit that uses the
 * Bristol Fashion format into a circuit data structure.
 * @param {string} raw - The circuit specification in Bristol Fashion.
 * @returns {Object} The circuit represented as JSON.
 */
function circuit_parse_bristol(raw) {
  var circuit = {
    wires: 0, gates: 0,
    input: [], output: [],
    gate: []
  };

  const rows = raw.split('\n').map(function (ln) { return ln.split(' '); });
  circuit.gates = +rows[0][0];
  circuit.wires = +rows[0][1];

  if (rows[1][0] != 2) {
    // Asymmetric inputs.
  }

  for (var i = 1; i <= rows[1][0] * rows[1][1]; i++) {
    circuit.input.push(i);
  }

  for (var i = 1+circuit.wires-(rows[2][0]*rows[2][1]); i <= circuit.wires; i++) {
    circuit.output.push(i);
  }

  // Parse the individual gates.
  for (var row = 3; row < circuit.gates+3; row++) {
    var tokens = rows[row];
    var gate = {wirein: [], wireout: undefined, type: 'unknown'};
    gate.wirein = [1 + (+tokens[2])];
    if (parseInt(tokens[0]) === 2) {
      gate.wirein.push(1 + (+tokens[3]));
    }
    gate.wireout = 1 + (+tokens[2 + (+tokens[0])]);
    gate.type = types[tokens[3 + (+tokens[0])]];
    circuit.gate.push(gate);
  }

  return circuit;
}

/**
 * Obtain circuit from the specific URL.
 * @param {string} path - The URL path.
 * @param {number} port - The port to use.
 * @returns {Promise} Promise object that represents the circuit object.
 */
function circuit_load_bristol(path, port) {
  return new Promise(function (resolve) {
    socket.geturl(path, 'text', port).then(function (txt) {
      resolve(circuit_parse_bristol(txt));
    });
  });
}

module.exports = {
  circuit_parse_bristol: circuit_parse_bristol,
  circuit_load_bristol: circuit_load_bristol
};
