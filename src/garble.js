/**
 * Stateless garbling functions for garbled circuits protocol.
 * @module src/garble
 */

const gate = require('./data/gate.js');
const circuit = require('./data/circuit.js');
const label = require('./data/label.js');
const wireToLabelsMap = require('./data/wireToLabelsMap.js');
const random = require('./utils/random.js');
const crypto = require('./utils/crypto.js');

/**
 * Generate labels and encode each state of every wire
 * with a randomly generated label pair.
 * @param {Object} circuit - Circuit for which to generate labels
 * @returns {Object[]} Mapping from each wire index to two labels
 */
function generateWireToLabelsMap(circuit) {
  const R = label.randomLabel();  // R in {0, 1}^N.
  var wireToLabels = wireToLabelsMap.initializeWireToLabelsMap(circuit);

  for (var j = 0; j < circuit.input.length; j++) {
    var i = circuit.input[j];

    var labelNew = label.randomLabel();
    wireToLabels[i][0] = labelNew;
    wireToLabels[i][1] = labelNew.xor(R);

    var point = random.random_bit();
    wireToLabels[i][0].pointer(point);
    wireToLabels[i][1].pointer(1-point);
  }

  for (var i = 0; i < circuit.gates; i++) {
    var gate = circuit.gate[i];
    var k;
    if (gate.type === 'xor') {
      var a = wireToLabels[gate.wirein[0]][0];
      var b = wireToLabels[gate.wirein[1]][0];
      k = gate.wireout;

      wireToLabels[k][0] = a.xor(b).point(a.pointer() ^ b.pointer());
      wireToLabels[k][1] = a.xor(b).xor(R).point(a.pointer() ^ b.pointer() ^ 1);
    } else if (gate.type === 'and') {
      k = gate.wireout;

      var key = label.randomLabel();
      point = random.random_bit();

      wireToLabels[k][0] = key.point(point);
      wireToLabels[k][1] = key.xor(R).point(point ^ 1);
    } else if (gate.type === 'not') {
      wireToLabels[gate.wireout][0] = wireToLabels[gate.wirein[0]][1];
      wireToLabels[gate.wireout][1] = wireToLabels[gate.wirein[0]][0];
    } else {
      throw new Error('Unsupported gate type \''+gate.type+'\'');
    }
  }

  return wireToLabels;
}

/**
 * Encrypt a single gate; input and output wires must have labels at this point.
 * @param {Object} gateFromCircuit - Gate to garble
 * @param {Object[]} wToLs - Mapping from each wire index to two labels
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
      [crypto.encrypt(wToLs[i][0], wToLs[j][0], k, wToLs[k][t[0]]).stringify(), (2 * wToLs[i][0].pointer()) + wToLs[j][0].pointer()],
      [crypto.encrypt(wToLs[i][0], wToLs[j][1], k, wToLs[k][t[1]]).stringify(), (2 * wToLs[i][0].pointer()) + wToLs[j][1].pointer()],
      [crypto.encrypt(wToLs[i][1], wToLs[j][0], k, wToLs[k][t[2]]).stringify(), (2 * wToLs[i][1].pointer()) + wToLs[j][0].pointer()],
      [crypto.encrypt(wToLs[i][1], wToLs[j][1], k, wToLs[k][t[3]]).stringify(), (2 * wToLs[i][1].pointer()) + wToLs[j][1].pointer()]
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
 * @param {Object[]} wireToLabels - Mapping from each wire index to two labels
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
 * @param {Object[]} wireToLabels - Mapping from each wire index to two labels
 * @param {number[]} input - This party's input (first/left-hand input)
 * @param {Object[]} messages - Array of messages from garbler
 */
function sendInputWireToLabelsMap(channel, circuit, wireToLabels, input) {
    const inputPair = (new Array(1)).concat(input).concat(new Array(input.length));

    // Send the evaluator the first half of the input labels directly.
    for (var i = 0; i < circuit.input.length/2; i++) {
      var j = circuit.input[i]; // Index of ith input gate.
      channel.sendDirect('Wire'+j, wireToLabels[j][((inputPair[j] == 0) ? 0 : 1)].stringify());
    }

    // Use oblivious transfer for the second half of the input labels.
    for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
      channel.sendOblivious([
        wireToLabels[circuit.input[i]][0], 
        wireToLabels[circuit.input[i]][1]
      ]);
    }
}

module.exports = {
  generateWireToLabelsMap: generateWireToLabelsMap,
  garbleGate: garbleGate,
  garbleGates: garbleGates,
  sendInputWireToLabelsMap: sendInputWireToLabelsMap
};
