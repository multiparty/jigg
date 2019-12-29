/**
 * Stateless evaluation functions for garbled circuits protocol.
 * @module src/evaluate
 */

'use strict';

const gate = require('./data/gate');
const circuit = require('./data/circuit');
const label = require('./data/label');
const association = require('./data/association');
const crypto = require('./utils/crypto');

/**
 * Receive garbled gates and wire-to-label map from garbler.
 * @param {Object} channel - Communication channel to use
 * @param {Object} circuit - Circuit being evaluated
 * @param {number[]} input - This party's input (second/right-hand input)
 * @returns {Object[]} Array of messages from garbler
 */
function receiveMessages(channel, circuit, input) {
    const inputPair = (new Array(1 + input.length)).concat(input);
    var messages = [channel.receiveDirect('garbledGates')];

    // Receive each of the garbler's input labels.
    for (var i = 0; i < circuit.input.length / 2; i++) {
      messages.push(channel.receiveDirect('Wire' + circuit.input[i]));
    }

    // Promises to each of the evaluator's input labels.
    for (var i = circuit.input.length / 2; i < circuit.input.length; i++) {
      messages.push(channel.receiveOblivious(inputPair[circuit.input[i]]));
    }

    return messages;
}

/**
 * Process garbled gates and wire label information received from garbler.
 * @param {Object} circuit - Circuit being evaluated
 * @param {Object[]} messages - Array of messages from garbler
 * @returns {Object[]} Pair containing the received gates and wire-to-label map
 */
function processMessages(circuit, messages) {
  var garbledGates = gate.GarbledGates.prototype.fromJSONString(messages[0]);
  var wireToLabels = new association.Association();
  for (var i = 0; i < circuit.input.length; i++) {
    var j = circuit.input[i];
    wireToLabels.set(j, [label.Label(messages[j])]);
  }
  return [garbledGates, wireToLabels];
}

/**
 * Decrypt a single garbled gate; the resulting label is stored automatically and also returned.
 * @param {Object} gate - Corresponding gate from the original circuit
 * @param {Object} garbledGate - Garbled gate to evaluate
 * @param {Object} wireToLabels - Mapping from each wire index to two labels
 */
function evaluateGate(gate, garbledGate, wireToLabels) {
  const i = gate.wirein[0];
  const j = (gate.wirein.length === 2) ? gate.wirein[1] : i;
  const k = (gate.wireout != null) ? gate.wireout : 0; // If null, just return decrypted.
  const l = 2 * wireToLabels.get(i)[0].pointer() + wireToLabels.get(j)[0].pointer();

  if (gate.type === 'xor') {
    wireToLabels.set(k, [wireToLabels.get(i)[0].xor(wireToLabels.get(j)[0])]);
  } else if (gate.type === 'not') {
    wireToLabels.set(k, [wireToLabels.get(i)[0]]);  // Already inverted.
  } else if (gate.type === 'and') {
    wireToLabels.set(k, [crypto.decrypt(wireToLabels.get(i)[0], wireToLabels.get(j)[0], k, label.Label(garbledGate.get(l)))]);
  }
}

/**
 * Evaluate all the gates (stateless version).
 * @param {Object} circuit - Circuit in which to garble the gates
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @param {Object} wireToLabels - Labeled wire data structure
 * @returns {Object} Mapping from each wire index to two labels
 */
function evaluateGates(circuit, garbledGates, wireToLabels) {
  for (var i = 0; i < circuit.gates; i++) {
    this.evaluateGate(circuit.gate[i], garbledGates.get(i), wireToLabels);
  }
  return wireToLabels;
}

module.exports = {
  receiveMessages: receiveMessages,
  processMessages: processMessages,
  evaluateGate: evaluateGate,
  evaluateGates: evaluateGates
};
