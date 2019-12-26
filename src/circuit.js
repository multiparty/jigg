/**
 * Circuit data structure and associated functions.
 * @module src/circuit
 */

'use strict';

const gate = require('./gate.js');
const socket = require('./lib/socket.js');

const bytes = 16;

/**
 * Create a new circuit data structure instance.
 * @param {number} wires - The number of wires in the circuit
 * @param {number} gates - The number of gates in the circuit
 * @param {number[]} input - The input wires for the entire circuit
 * @param {number[]} output - The output wires for the entire circuit
 * @param {Object[]} gate - The array of gates in the circuit
 * @constructor
 */
function Circuit(wires, gates, input, output, gate) {
  this.wires = wires == null ? 0 : wires;
  this.gates = gates == null ? 0 : gates;
  this.input = input == null ? [] : input;
  this.output = output == null ? [] : output;
  this.gate = gate == null ? [] : gate;
}

/**
 * Return a circuit data structure instance as a JSON object.
 * @returns {Object} Circuit data structure instance as a JSON object
 */
Circuit.prototype.toJSON = function () {
  return {
    wires: this.wires, gates: this.gates,
    input: this.input, output: this.output,
    gate: this.gate.map(function (g) { return g.toJSON(); })
  };
};

/**
 * Parse a raw string representation of a circuit that uses the
 * Bristol Fashion format into a circuit data structure.
 * @param {string} raw - The circuit specification in Bristol Fashion.
 * @returns {Object} The circuit represented as JSON.
 */
function circuit_parse_bristol(raw) {
  var circuit = new Circuit();

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
    var gate_new = new gate.Gate();
    gate_new.wirein = [1 + (+tokens[2])];
    if (parseInt(tokens[0]) === 2) {
      gate_new.wirein.push(1 + (+tokens[3]));
    }
    gate_new.wireout = 1 + (+tokens[2 + (+tokens[0])]);
    gate_new.type = gate.bristolOpToIGG[tokens[3 + (+tokens[0])]];
    circuit.gate.push(gate_new);
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
  Circuit: Circuit,
  circuit_parse_bristol: circuit_parse_bristol,
  circuit_load_bristol: circuit_load_bristol
};
