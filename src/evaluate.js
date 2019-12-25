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
 * @param {Object} garbledGate - The garbled gate to evaluate
 * @param {string} type - The gate operation
 * @param {number[]} wirein - The array of indices of the input wires
 * @param {number} wireout - The index of the output wire
 * @param {Object[]} wiresToLabels - Mapping from each wire index to two labels
 */
function evaluateGate(garbledGate, type, wirein, wireout, wiresToLabels) {
  const i = wirein[0];
  const j = (wirein.length === 2) ? wirein[1] : i;
  const k = (wireout != null) ? wireout : 0; // If null, just return decrypted.
  const l = 2 * wiresToLabels[i].pointer() + wiresToLabels[j].pointer();

  if (type === 'xor') {
    wiresToLabels[k] = wiresToLabels[i].xor(wiresToLabels[j]);
  } else if (type === 'not') {
    wiresToLabels[k] = wiresToLabels[i];  // Already inverted.
  } else if (type === 'and') {
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
    const gate = circuit.gate[i];
    this.evaluateGate(garbledGates[i], gate.type, gate.wirein, gate.wireout, wiresToLabels);
  }
  return wiresToLabels;
}

module.exports = {
  evaluateGate: evaluateGate,
  evaluateGates: evaluateGates
};
