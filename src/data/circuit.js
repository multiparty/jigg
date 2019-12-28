/**
 * Circuit data structure and associated functions.
 * @module src/data/circuit
 */

'use strict';

const bits = require('./bits.js');
const gate = require('./gate.js');
const socket = require('../comm/socket.js');

const bytes = 16;

/**
 * Create a new circuit data structure instance.
 * @param {number} wires - Number of wires in the circuit
 * @param {number} gates - Number of gates in the circuit
 * @param {number[]} input - Input wires for the entire circuit
 * @param {number[]} output - Output wires for the entire circuit
 * @param {Object[]} gate - Array of gates in the circuit
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
 * @param {string} raw - Circuit specification in Bristol Fashion
 * @returns {Object} Circuit data structure instance
 */
Circuit.prototype.fromBristolFashion = function (raw) {
  var circuit = new Circuit();

  var rows =
    raw.split('\n').map(function (line) {
      return line.split(' ')
                 .map(function (tok) { return tok.trim(); });
    });
  circuit.gates = +parseInt(rows[0][0]);
  circuit.wires = +parseInt(rows[0][1]);

  // Determine total number of input and output wires.
  var input_num = 0, output_num = 0;
  for (var i = 1; i < rows[1].length; i++) {
    input_num += parseInt(rows[1][i]);
  }
  for (var i = 1; i < rows[2].length; i++) {
    output_num += parseInt(rows[2][i]);
  }

  // Collect input and output wire indices.
  for (var i = 1; i <= input_num; i++) {
    circuit.input.push(i);
  }
  for (var i = 1+circuit.wires-output_num; i <= circuit.wires; i++) {
    circuit.output.push(i);
  }

  // Parse the individual gates.
  for (var row = 3; row < circuit.gates+3; row++) {
    var tokens = rows[row];
    var gate_new = new gate.Gate();
    gate_new.wirein = [1 + (+parseInt(tokens[2]))];
    if (parseInt(tokens[0]) === 2) {
      gate_new.wirein.push(1 + (+parseInt(tokens[3])));
    }
    var offset = parseInt(tokens[0]);
    gate_new.wireout = 1 + (+parseInt(tokens[2 + (+offset)]));
    gate_new.type = gate.bristolOpToIGG[tokens[3 + (+offset)]];
    circuit.gate.push(gate_new);
  }

  return circuit;
}

/**
 * Directly evaluate a circuit on an input bit vector.
 * @param {Object[]} inputs - Input bit vectors
 * @returns {Object} Output bit vector
 */
Circuit.prototype.evaluate = function (inputs) {
  
  var c = this;
  var wires = {};
  
  // Assign input bits to corresponding input wires.
  var circuitInputWireIndex = 0;
  for (var i = 0; i < inputs.length; i++) {
    for (var j = 0; j < inputs[i].bits.length; j++) {
      wires[c.input[circuitInputWireIndex]] = inputs[i].bits[j];
      circuitInputWireIndex++;
    }
  }

  // Evaluate the gates.
  for (var i = 0; i < c.gates; i++) {
    if (c.gate[i].type == 'and') {
      wires[c.gate[i].wireout] =
        ((wires[c.gate[i].wirein[0]] == 1) &&
         (wires[c.gate[i].wirein[1]] == 1)) ?
        1 : 0;
    }
    if (c.gate[i].type == 'xor') {
      wires[c.gate[i].wireout] =
        (wires[c.gate[i].wirein[0]] != wires[c.gate[i].wirein[1]]) ?
        1 : 0;
    }
    if (c.gate[i].type == 'not') {
      wires[c.gate[i].wireout] =
        (wires[c.gate[i].wirein[0]] == 0) ?
        1 : 0;
    }
  }

  // Retrieve the output bits.
  var outputBits = [];
  for (var i = 0; i < c.output.length; i++) {
    outputBits.push(wires[c.output[i]]);
  }

  return new bits.Bits(outputBits);
}

module.exports = {
  Circuit: Circuit,
  circuit_load_bristol: circuit_load_bristol
};
