/**
 * Circuit data structure and associated functions.
 * @module src/data/circuit
 */

'use strict';

const bits = require('./bits.js');
const gate = require('./gate.js');

/**
 * Create a new circuit data structure instance.
 * @param {number} wire_count - Number of wires in the circuit
 * @param {number} gate_count - Number of gates in the circuit
 * @param {number} value_in_count - Number of input bit vectors
 * @param {number[]} value_in_length - Length of each input bit vector
 * @param {number} value_out_count - Number of output bit vectors
 * @param {number[]} value_out_length - Length of each output bit vector
 * @param {number} wire_in_count - Number of wires representing input values
 * @param {number[]} wire_in_index - Index of each input wire
 * @param {number} wire_out_count - Number of wires representing output values
 * @param {number[]} wire_out_index - Index of each output wire
 * @param {Object[]} gate - Array of gates in the circuit
 * @constructor
 */
function Circuit(
  wire_count, gate_count,
  value_in_count, value_in_length, value_out_count, value_out_length,
  wire_in_count, wire_in_index, wire_out_count, wire_out_index,
  gate
) {
  this.wire_count = wire_count == null ? 0 : wire_count;
  this.gate_count = gate_count == null ? 0 : gate_count;
  this.value_in_count = value_in_count == null ? 0 : value_in_count;
  this.value_in_length = value_in_length == null ? [] : value_in_length;
  this.value_out_count = value_out_count == null ? 0 : value_out_count;
  this.value_out_length = value_out_length == null ? [] : value_out_length;

  // The four fields below are technically redundant but included
  // to support cleaner algorithm implementations.
  this.wire_in_count = wire_in_count == null ? 0 : wire_in_count;
  this.wire_in_index = wire_in_index == null ? [] : wire_in_index;
  this.wire_out_count = wire_out_count == null ? 0 : wire_out_count;
  this.wire_out_index = wire_out_index == null ? [] : wire_out_index;

  this.gate = gate == null ? [] : gate;
}

/**
 * Return a circuit data structure instance as a JSON object.
 * @returns {Object} Circuit data structure instance as a JSON object
 */
Circuit.prototype.toJSON = function () {
  return {
    wire_count: this.wire_count, gate_count: this.gate_count,
    value_in_count: this.value_in_count, value_in_length: this.value_in_length,
    value_out_count: this.value_out_count, value_out_length: this.value_out_length,
    wire_in_count: this.wire_in_count, wire_in_index: this.wire_in_index,
    wire_out_count: this.wire_out_count, wire_out_index: this.wire_out_index,
    gate: this.gate.map(function (g) {
      return g.toJSON();
    })
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
        .map(function (tok) {
          return tok.trim();
        });
    });
  circuit.gate_count = +parseInt(rows[0][0]);
  circuit.wire_count = +parseInt(rows[0][1]);

  // Determine total number of input and output wires.
  circuit.wire_in_count = 0;
  circuit.wire_out_count = 0;
  for (var i = 1; i < rows[1].length; i++) {
    var length = parseInt(rows[1][i]);
    circuit.value_in_count += 1;
    circuit.value_in_length.push(length);
    circuit.wire_in_count += length;
  }
  for (i = 1; i < rows[2].length; i++) {
    length = parseInt(rows[2][i]);
    circuit.value_out_count += 1;
    circuit.value_out_length.push(length);
    circuit.wire_out_count += length;
  }

  // Collect input/output wire indices for easier processing.
  for (i = 1; i <= circuit.wire_in_count; i++) {
    circuit.wire_in_index.push(i);
  }
  for (i = 1+circuit.wire_count-circuit.wire_out_count; i <= circuit.wire_count; i++) {
    circuit.wire_out_index.push(i);
  }

  // Parse the individual gates.
  for (var row = 3; row < circuit.gate_count+3; row++) {
    var tokens = rows[row];
    var gateNew = new gate.Gate();
    gateNew.wire_in_index = [1 + (+parseInt(tokens[2]))];
    if (parseInt(tokens[0]) === 2) {
      gateNew.wire_in_index.push(1 + (+parseInt(tokens[3])));
    }
    var offset = parseInt(tokens[0]);
    gateNew.wire_out_index = [1 + (+parseInt(tokens[2 + (+offset)]))];
    gateNew.operation = gate.bristolOpToIGG[tokens[3 + (+offset)]];
    circuit.gate.push(gateNew);
  }

  return circuit;
};

/**
 * Directly evaluate a circuit on an input bit vector.
 * @param {Object[]} inputs - Input bit vectors
 * @returns {Object} Output bit vector
 */
Circuit.prototype.evaluate = function (inputs) {
  var c = this;
  var wire = {};

  // Assign input bits to corresponding input wires.
  // It is assumed that the number of input wires
  // in the circuit matches the total number of bits
  // across all inputs in the inputs array.
  var circuitInputWireIndex = 0;
  for (var i = 0; i < inputs.length; i++) {
    for (var j = 0; j < inputs[i].bits.length; j++) {
      wire[c.wire_in_index[circuitInputWireIndex]] = inputs[i].bits[j];
      circuitInputWireIndex++;
    }
  }

  // Evaluate the gate.
  for (i = 0; i < c.gate_count; i++) {
    if (c.gate[i].operation === 'and') {
      wire[c.gate[i].wire_out_index[0]] =
        ((wire[c.gate[i].wire_in_index[0]] === 1) &&
         (wire[c.gate[i].wire_in_index[1]] === 1)) ?
          1 : 0;
    }
    if (c.gate[i].operation === 'xor') {
      wire[c.gate[i].wire_out_index[0]] =
        (wire[c.gate[i].wire_in_index[0]] !== wire[c.gate[i].wire_in_index[1]]) ?
          1 : 0;
    }
    if (c.gate[i].operation === 'not') {
      wire[c.gate[i].wire_out_index[0]] =
        (wire[c.gate[i].wire_in_index[0]] === 0) ?
          1 : 0;
    }
  }

  // Retrieve the output bits.
  var outputBits = [];
  for (i = 0; i < c.wire_out_count; i++) {
    outputBits.push(wire[c.wire_out_index[i]]);
  }

  return new bits.Bits(outputBits);
};

module.exports = {
  Circuit: Circuit,
  fromBristolFashion: Circuit.prototype.fromBristolFashion
};
