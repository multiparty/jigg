/**
 * Stateless garbling functions for garbled circuits protocol.
 * @module src/garble
 */

'use strict';

const label = require('./data/label.js');
const gate = require('./data/gate.js');
const assignment = require('./data/assignment.js');
const random = require('./util/random.js');
const crypto = require('./util/crypto.js');

/**
 * Generate labels and encode each state of every wire
 * with a randomly generated label pair.
 * @param {Object} circuit - Circuit for which to generate labels
 * @returns {Object} Mapping from each wire index to two labels
 */
function generateWireToLabelsMap(circuit) {
  const R = label.randomLabel();  // R in {0, 1}^N.
  var wireToLabels = new assignment.Assignment();

  var i;
  for (var j = 0; j < circuit.wire_in_count; j++) {
    i = circuit.wire_in_index[j];

    var labelNew = label.randomLabel();
    wireToLabels.set(i, [labelNew, labelNew.xor(R)]);

    var point = random.randomBit();  // Generate a 'select bit' for point-and-permute sorting
    wireToLabels.get(i)[0].pointer(point);
    wireToLabels.get(i)[1].pointer(1-point);
  }

  for (i = 0; i < circuit.gate_count; i++) {
    var gate = circuit.gate[i];
    var k;
    if (gate.operation === 'xor') {
      var a = wireToLabels.get(gate.wire_in_index[0])[0];
      var b = wireToLabels.get(gate.wire_in_index[1])[0];
      k = gate.wire_out_index[0];
      wireToLabels.set(k, [
        a.xor(b).point(a.pointer() ^ b.pointer()),
        a.xor(b).xor(R).point(a.pointer() ^ b.pointer() ^ 1)
      ]);
    } else if (gate.operation === 'and') {
      k = gate.wire_out_index[0];

      var key = label.randomLabel();
      point = random.randomBit();

      wireToLabels.set(k, [key.point(point), key.xor(R).point(point ^ 1)]);
    } else if (gate.operation === 'not') {
      wireToLabels.set(gate.wire_out_index[0], [
        wireToLabels.get(gate.wire_in_index[0])[1],
        wireToLabels.get(gate.wire_in_index[0])[0]
      ]);
    } else {
      throw new Error('Unsupported gate operation \''+gate.operation+'\'');
    }
  }

  return wireToLabels;
}

/**
 * Encrypt a single gate; input and output wires must have labels at this point.
 * @param {Object} gateFromCircuit - Gate to garble
 * @param {Object} wToLs - Mapping from each wire index to two labels
 * @returns {Object} Garbled gate
 */
function garbleGate(gate_id, gateFromCircuit, wToLs) {
  const i = gateFromCircuit.wire_in_index[0];
  const j = (gateFromCircuit.wire_in_index.length === 2) ? gateFromCircuit.wire_in_index[1] : i;
  const k = gateFromCircuit.wire_out_index[0];

  if (gateFromCircuit.operation === 'xor') {
    return new gate.GateGarbled(); // Free XOR; encrypt nothing.
  } else if (gateFromCircuit.operation === 'not') {
    return new gate.GateGarbled(); // Encrypt nothing.
  } else if (gateFromCircuit.operation === 'and') {
    var t = [0,0,0,1];
    var values = [
      [crypto.encrypt(wToLs.get(i)[0], wToLs.get(j)[0], gate_id, wToLs.get(k)[t[0]])
        .toJSON(),
      (2 * wToLs.get(i)[0].pointer()) + wToLs.get(j)[0].pointer()],
      [crypto.encrypt(wToLs.get(i)[0], wToLs.get(j)[1], gate_id, wToLs.get(k)[t[1]])
        .toJSON(),
      (2 * wToLs.get(i)[0].pointer()) + wToLs.get(j)[1].pointer()],
      [crypto.encrypt(wToLs.get(i)[1], wToLs.get(j)[0], gate_id, wToLs.get(k)[t[2]])
        .toJSON(),
      (2 * wToLs.get(i)[1].pointer()) + wToLs.get(j)[0].pointer()],
      [crypto.encrypt(wToLs.get(i)[1], wToLs.get(j)[1], gate_id, wToLs.get(k)[t[3]])
        .toJSON(),
      (2 * wToLs.get(i)[1].pointer()) + wToLs.get(j)[1].pointer()]
    ];
    // Point-and-permute.  Sort by select bits.
    values = values.sort(function (c1, c2) {
      return c1[1] - c2[1];
    });
    values = values.map(function (c) {
      return c[0];
    });
    return new gate.GateGarbled(values);
  }
  // Define cases for any other gate operations here.
}

/**
 * Send mapping from input wires to their label pairs.
 * @param {Object} channel - Communication channel to use
 * @param {Object} circuit - Circuit being evaluated
 * @param {Object} wireToLabels - Mapping from each wire index to two labels
 * @param {number[]} input - This party's input (first/left-hand input)
 */
function sendInputWireToLabelsMap(channel, circuit, wireToLabels, input) {
  const inputPair = (new Array(1)).concat(input).concat(new Array(input.length));

  // Send the evaluator the first half of the input labels directly.
  for (var i = 0; i < circuit.wire_in_count/2; i++) {
    var j = circuit.wire_in_index[i]; // Index of ith input gate.
    var inputBit = (inputPair[j] === 0) ? 0 : 1;
    var label = wireToLabels.get(j)[inputBit];
    channel.sendDirect('wire['+j+']', label.toJSONString());
  }

  // Use oblivious transfer for the second half of the input labels.
  for (i = circuit.wire_in_count/2; i < circuit.wire_in_count; i++) {
    channel.sendOblivious([
      wireToLabels.get(circuit.wire_in_index[i])[0],
      wireToLabels.get(circuit.wire_in_index[i])[1]
    ]);
  }
}

/**
 * Convert the output labels (from evaluator) to bits using original labels.
 * @param {Object} circuit - Circuit being evaluated
 * @param {Object} wireToLabels - Mapping from each wire index to two labels
 * @param {Object} outputWireToLabels - Mapping from each output wire index to one label
 * @returns {number[]} Bit vector corresponding to the determined output
 */
function outputLabelsToBits(circuit, wireToLabels, outputWireToLabels) {
  var output = [];
  for (var i = 0; i < circuit.wire_out_count; i++) {
    var labelsForFalseAndTrue =
      wireToLabels
        .get(circuit.wire_out_index[i])
        .map(function (l) {
          // Drop last bits
          return l.withoutLastElement();
        });

    var outputLabel =
      outputWireToLabels
        .get(circuit.wire_out_index[i])[0] // Only one label in assignment from evaluator.
        .withoutLastElement(); // Drop last bit.

    var bit = outputLabel.getOccurrenceIndexIn(labelsForFalseAndTrue);
    output.push(bit);
  }
  return output;
}

/**
 * Garble all the gates (stateless version).
 * @param {Object} circuit - Circuit in which to garble the gates
 * @param {Object} wireToLabels - Mapping from each wire index to two labels
 * @returns {Object} Ordered collection of garbled gates
 */
function garbleGates(circuit, wireToLabels) {
  var gatesGarbled = new gate.GatesGarbled();
  for (var i = 0; i < circuit.gate_count; i++) {
    gatesGarbled.set(i, garbleGate(i, circuit.gate[i], wireToLabels));
  }
  return gatesGarbled;
}

module.exports = {
  generateWireToLabelsMap: generateWireToLabelsMap,
  garbleGate: garbleGate,
  garbleGates: garbleGates,
  sendInputWireToLabelsMap: sendInputWireToLabelsMap,
  outputLabelsToBits: outputLabelsToBits
};
