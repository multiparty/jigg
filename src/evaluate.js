/**
 * Stateless evaluation functions for garbled circuits protocol.
 * @module src/evaluate
 */

const gate = require('./data/gate.js');
const circuit = require('./data/circuit.js');
const label = require('./data/label.js');
const garble = require('./garble.js');
const crypto = require('./utils/crypto.js');

/**
 * Process garbled gates and wire label information received from garbler.
 * @param {Object} circuit - Circuit being evaluated
 * @param {Object[]} messages - Array of messages from garbler
 * @returns {Object[]} Pair containing the received gates and wire-to-label map
 */
function processMessages(circuit, messages) {
  var garbledGates = gate.GarbledGates.prototype.fromJSON(JSON.parse(messages[0]));
  var wireToLabel = garble.initializeWiresToLabels(circuit);
  for (var i = 0; i < circuit.input.length; i++) {
    var j = circuit.input[i];
    wireToLabel[j] = label.Label(messages[j]);
  }
  return [garbledGates, wireToLabel];
}

/**
 * Decrypt a single garbled gate; the resulting label is stored automatically and also returned.
 * @param {Object} gate - Corresponding gate from the original circuit
 * @param {Object} garbledGate - Garbled gate to evaluate
 * @param {Object[]} wiresToLabels - Mapping from each wire index to two labels
 */
function evaluateGate(gate, garbledGate, wiresToLabels) {
  const i = gate.wirein[0];
  const j = (gate.wirein.length === 2) ? gate.wirein[1] : i;
  const k = (gate.wireout != null) ? gate.wireout : 0; // If null, just return decrypted.
  const l = 2 * wiresToLabels[i].pointer() + wiresToLabels[j].pointer();

  if (gate.type === 'xor') {
    wiresToLabels[k] = wiresToLabels[i].xor(wiresToLabels[j]);
  } else if (gate.type === 'not') {
    wiresToLabels[k] = wiresToLabels[i];  // Already inverted.
  } else if (gate.type === 'and') {
    wiresToLabels[k] = crypto.decrypt(wiresToLabels[i], wiresToLabels[j], k, label.Label(garbledGate.get(l)));
  }
}

/**
 * Evaluate all the gates (stateless version).
 * @param {Object} circuit - The circuit in which to garble the gates
 * @param {Object[]} wiresToLabels - The labeled wire data structure
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @returns {Object[]} Mapping from each wire index to two labels
 */
function evaluateGates(circuit, wiresToLabels, garbledGates) {
  for (var i = 0; i < circuit.gates; i++) {
    this.evaluateGate(circuit.gate[i], garbledGates.get(i), wiresToLabels);
  }
  return wiresToLabels;
}

module.exports = {
  processMessages: processMessages,
  evaluateGate: evaluateGate,
  evaluateGates: evaluateGates
};
