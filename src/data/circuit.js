/**
 * Circuit data structure and associated functions.
 * @module src/data/circuit
 */

'use strict';

const bits = require('./bits');
const gate = require('./gate');
const socket = require('../comm/socket');

const bytes = 16;

/**
 * Create a new circuit data structure instance.
 * @param {number} wire_count - Number of wires in the circuit
 * @param {number} gate_count - Number of gates in the circuit
 * @param {number} input_count - Number of input bit vectors
 * @param {number[]} input_lengths - Length of each input bit vector
 * @param {number} output_count - Number of output bit vectors
 * @param {number[]} output_lengths - Length of each output bit vector
 * @param {Object[]} gates - Array of gates in the circuit
 * @constructor
 */
function Circuit(
    wire_count, gate_count,
    input_count, input_lengths, output_count, output_lengths, gates
  ) {
  this.wire_count = wire_count == null ? 0 : wire_count;
  this.gate_count = gate_count == null ? 0 : gate_count;
  this.input_count = input_count == null ? 0 : input_count;
  this.input_lengths = input_lengths == null ? [] : input_lengths;
  this.output_count = output_count == null ? 0 : output_count;
  this.output_lengths = output_lengths == null ? [] : output_lengths;
  this.input_wires = []; // This is redundant information.
  this.output_wires = []; // This is redundant information.
  this.gates = gates == null ? [] : gates;
}

/**
 * Return a circuit data structure instance as a JSON object.
 * @returns {Object} Circuit data structure instance as a JSON object
 */
Circuit.prototype.toJSON = function () {
  return {
    wire_count: this.wire_count, gate_count: this.gate_count,
    input_count: this.input_count, input_lengths: this.input_lengths,
    output_count: this.output_count, output_lengths: this.output_lengths,
    input_wires: this.input_wires, output_wires: this.output_wires,
    gates: this.gates.map(function (g) { return g.toJSON(); })
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
  circuit.gate_count = +parseInt(rows[0][0]);
  circuit.wire_count = +parseInt(rows[0][1]);

  // Determine total number of input and output wires.
  var inputWireCount = 0, outputWireCount = 0;
  for (var i = 1; i < rows[1].length; i++) {
    var length = parseInt(rows[1][i]);
    circuit.input_count += 1;
    circuit.input_lengths.push(length);
    inputWireCount += length;
  }
  for (var i = 1; i < rows[2].length; i++) {
    var length = parseInt(rows[2][i]);
    circuit.output_count += 1;
    circuit.output_lengths.push(length);
    outputWireCount += length;
  }

  // Collect input/output wire indices for easier processing.
  for (var i = 1; i <= inputWireCount; i++) {
    circuit.input_wires.push(i);
  }
  for (var i = 1+circuit.wire_count-outputWireCount; i <= circuit.wire_count; i++) {
    circuit.output_wires.push(i);
  }

  // Parse the individual gates.
  for (var row = 3; row < circuit.gate_count+3; row++) {
    var tokens = rows[row];
    var gateNew = new gate.Gate();
    gateNew.input_wires = [1 + (+parseInt(tokens[2]))];
    if (parseInt(tokens[0]) === 2) {
      gateNew.input_wires.push(1 + (+parseInt(tokens[3])));
    }
    var offset = parseInt(tokens[0]);
    gateNew.output_wire = 1 + (+parseInt(tokens[2 + (+offset)]));
    gateNew.operation = gate.bristolOpToIGG[tokens[3 + (+offset)]];
    circuit.gates.push(gateNew);
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
      wires[c.input_wires[circuitInputWireIndex]] = inputs[i].bits[j];
      circuitInputWireIndex++;
    }
  }

  // Evaluate the gates.
  for (var i = 0; i < c.gate_count; i++) {
    if (c.gates[i].operation == 'and') {
      wires[c.gates[i].output_wire] =
        ((wires[c.gates[i].input_wires[0]] == 1) &&
         (wires[c.gates[i].input_wires[1]] == 1)) ?
        1 : 0;
    }
    if (c.gates[i].operation == 'xor') {
      wires[c.gates[i].output_wire] =
        (wires[c.gates[i].input_wires[0]] != wires[c.gates[i].input_wires[1]]) ?
        1 : 0;
    }
    if (c.gates[i].operation == 'not') {
      wires[c.gates[i].output_wire] =
        (wires[c.gates[i].input_wires[0]] == 0) ?
        1 : 0;
    }
  }

  // Retrieve the output bits.
  var outputBits = [];
  for (var i = 0; i < c.output_wires.length; i++) {
    outputBits.push(wires[c.output_wires[i]]);
  }

  return new bits.Bits(outputBits);
}

module.exports = {
  Circuit: Circuit,
  fromBristolFashion: Circuit.prototype.fromBristolFashion
};
