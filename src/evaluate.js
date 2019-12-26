/**
 * Stateless evaluation functions for garbled circuit protocol.
 * @module src/evaluate
 */

const Label = require('./lib/label.js');
const gate = require('./gate.js');
const circuit = require('./circuit.js');
const crypto = require('./utils/crypto.js');

/**
 * Decrypt a single garbled gate; the resulting label is stored automatically and also returned.
 * @param {Object} gate - The corresponding gate from the original circuit
 * @param {Object} garbledGate - The garbled gate to evaluate
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
    wiresToLabels[k] = crypto.decrypt(wiresToLabels[i], wiresToLabels[j], k, Label(garbledGate[l]));
  }
}

/**
 * Evaluate all the gates (stateless version).
 * @param {Object} circuit - The circuit in which to garble the gates
 * @param {Object[]} wiresToLabels - The labeled wire data structure
 * @param {Object[]} garbledGates - The garbled gates
 * @returns {Object[]} Mapping from each wire index to two labels
 */
function evaluateGates(circuit, wiresToLabels, garbledGates) {
  for (var i = 0; i < circuit.gates; i++) {
    this.evaluateGate(circuit.gate[i], garbledGates[i], wiresToLabels);
  }
  return wiresToLabels;
}

module.exports = {
  evaluateGate: evaluateGate,
  evaluateGates: evaluateGates
};
