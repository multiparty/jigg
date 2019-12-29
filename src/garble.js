/**
 * Stateless garbling functions for garbled circuits protocol.
 * @module src/garble
 */

'use strict';

const gate = require('./data/gate');
const circuit = require('./data/circuit');
const label = require('./data/label');
const association = require('./data/association');
const random = require('./utils/random');
const crypto = require('./utils/crypto');

/**
 * Generate labels and encode each state of every wire
 * with a randomly generated label pair.
 * @param {Object} circuit - Circuit for which to generate labels
 * @returns {Object} Mapping from each wire index to two labels
 */
function generateWireToLabelsMap(circuit) {
  const R = label.randomLabel();  // R in {0, 1}^N.
  var wireToLabels = new association.Association();

  for (var j = 0; j < circuit.input.length; j++) {
    var i = circuit.input[j];

    var labelNew = label.randomLabel();
    wireToLabels.set(i, [labelNew, labelNew.xor(R)])

    var point = random.random_bit();
    wireToLabels.get(i)[0].pointer(point);
    wireToLabels.get(i)[1].pointer(1-point);
  }

  for (var i = 0; i < circuit.gates; i++) {
    var gate = circuit.gate[i];
    var k;
    if (gate.type === 'xor') {
      var a = wireToLabels.get(gate.wirein[0])[0];
      var b = wireToLabels.get(gate.wirein[1])[0];
      k = gate.wireout;
      wireToLabels.set(k, [
        a.xor(b).point(a.pointer() ^ b.pointer()),
        a.xor(b).xor(R).point(a.pointer() ^ b.pointer() ^ 1)
      ]);
    } else if (gate.type === 'and') {
      k = gate.wireout;

      var key = label.randomLabel();
      point = random.random_bit();

      wireToLabels.set(k, [key.point(point), key.xor(R).point(point ^ 1)]);
    } else if (gate.type === 'not') {
      wireToLabels.set(gate.wireout, [
        wireToLabels.get(gate.wirein[0])[1],
        wireToLabels.get(gate.wirein[0])[0]
      ]);
    } else {
      throw new Error('Unsupported gate type \''+gate.type+'\'');
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
function garbleGate(gateFromCircuit, wToLs) {
  const i = gateFromCircuit.wirein[0];
  const j = (gateFromCircuit.wirein.length === 2) ? gateFromCircuit.wirein[1] : i;
  const k = gateFromCircuit.wireout;

  if (gateFromCircuit.type === 'xor') {
    return new gate.GarbledGate('xor');  // Free XOR; encrypt nothing.
  } else if (gateFromCircuit.type === 'not') {
    return new gate.GarbledGate('not');
  } else {  // if (gateFromCircuit.type === 'and') {
    var t = [0,0,0,1];
    var values = [
      [crypto.encrypt(wToLs.get(i)[0], wToLs.get(j)[0], k, wToLs.get(k)[t[0]]).compactString(), (2 * wToLs.get(i)[0].pointer()) + wToLs.get(j)[0].pointer()],
      [crypto.encrypt(wToLs.get(i)[0], wToLs.get(j)[1], k, wToLs.get(k)[t[1]]).compactString(), (2 * wToLs.get(i)[0].pointer()) + wToLs.get(j)[1].pointer()],
      [crypto.encrypt(wToLs.get(i)[1], wToLs.get(j)[0], k, wToLs.get(k)[t[2]]).compactString(), (2 * wToLs.get(i)[1].pointer()) + wToLs.get(j)[0].pointer()],
      [crypto.encrypt(wToLs.get(i)[1], wToLs.get(j)[1], k, wToLs.get(k)[t[3]]).compactString(), (2 * wToLs.get(i)[1].pointer()) + wToLs.get(j)[1].pointer()]
    ];
    values = values.sort(function (c1, c2) {  // Point-and-permute.
      return c1[1] - c2[1];
    })
    values = values.map(function (c) { return c = c[0]; });
    return new gate.GarbledGate(values);
  }
  // Define cases for any other gate types here.
}

/**
 * Garble all the gates (stateless version).
 * @param {Object} circuit - Circuit in which to garble the gates
 * @param {Object} wireToLabels - Mapping from each wire index to two labels
 * @returns {Object} Ordered collection of garbled gates
 */
function garbleGates(circuit, wireToLabels) {
  var garbledGates = new gate.GarbledGates();
  for (var i = 0; i < circuit.gates; i++) {
    garbledGates.add(garbleGate(circuit.gate[i], wireToLabels));
  }
  return garbledGates;
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
  for (var i = 0; i < circuit.input.length/2; i++) {
    var j = circuit.input[i]; // Index of ith input gate.
    var inputBit = (inputPair[j] == 0) ? 0 : 1;
    var label = wireToLabels.get(j)[inputBit];
    channel.sendDirect('Wire'+j, JSON.stringify(label.toJSON()));
  }

  // Use oblivious transfer for the second half of the input labels.
  for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
    channel.sendOblivious([
      wireToLabels.get(circuit.input[i])[0], 
      wireToLabels.get(circuit.input[i])[1]
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
  for (var i = 0; i < circuit.output.length; i++) {
    var labelsForFalseAndTrue =
      wireToLabels
        .get(circuit.output[i])
        .map(function (l) { return l.withoutLastElement(); }); // Drop last bits.

    var outputLabel =
      outputWireToLabels
        .get(circuit.output[i])
        [0] // Only one label in association from evaluator.
        .withoutLastElement(); // Drop last bit.

    var bit = outputLabel.getOccurrenceIndexIn(labelsForFalseAndTrue);
    output.push(bit);
  }
  return output;
}

module.exports = {
  generateWireToLabelsMap: generateWireToLabelsMap,
  garbleGate: garbleGate,
  garbleGates: garbleGates,
  sendInputWireToLabelsMap: sendInputWireToLabelsMap,
  outputLabelsToBits: outputLabelsToBits
};
