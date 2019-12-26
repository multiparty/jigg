/**
 * Stateless garbling functions for garbled circuits protocol.
 * @module src/garble
 */

const Label = require('./lib/label.js');
const gate = require('./gate.js');
const circuit = require('./circuit.js');
const randomutils = require('./utils/random.js');
const crypto = require('./utils/crypto.js');

/**
 * Initialize the data structure for labeled wires.
 * @param {Object} circuit - The circuit for which to generate labels
 * @returns {Object[]} Mapping from each wire index to two labels
 */
function initializeWiresToLabels(circuit) {
  var wiresToLabels = [null];
  for (var i = 0; i < circuit.wires; i++) {
    wiresToLabels.push([]);
  }
  return wiresToLabels;
}

/**
 * Generate labels and encode each state of every wire
 * with a randomly generated label.
 * @param {Object} circuit - The circuit for which to generate labels
 * @returns {Object[]} Mapping from each wire index to two labels
 */
function generateWiresToLabels(circuit) {
  const R = randomutils.random();  // R in {0, 1}^N.
  var wiresToLabels = initializeWiresToLabels(circuit);

  for (var j = 0; j < circuit.input.length; j++) {
    var i = circuit.input[j];

    var label = randomutils.random();
    wiresToLabels[i][0] = label;
    wiresToLabels[i][1] = label.xor(R);

    var point = randomutils.random_bit();
    wiresToLabels[i][0].pointer(point);
    wiresToLabels[i][1].pointer(1-point);
  }

  for (var i = 0; i < circuit.gates; i++) {
    var gate = circuit.gate[i];
    var k;
    if (gate.type === 'xor') {
      var a = wiresToLabels[gate.wirein[0]][0];
      var b = wiresToLabels[gate.wirein[1]][0];
      k = gate.wireout;

      wiresToLabels[k][0] = a.xor(b).point(a.pointer() ^ b.pointer());
      wiresToLabels[k][1] = a.xor(b).xor(R).point(a.pointer() ^ b.pointer() ^ 1);
    } else if (gate.type === 'and') {
      k = gate.wireout;

      var key = randomutils.random();
      point = randomutils.random_bit();

      wiresToLabels[k][0] = key.point(point);
      wiresToLabels[k][1] = key.xor(R).point(point ^ 1);
    } else if (gate.type === 'not') {
      wiresToLabels[gate.wireout][0] = wiresToLabels[gate.wirein[0]][1];
      wiresToLabels[gate.wireout][1] = wiresToLabels[gate.wirein[0]][0];
    } else {
      throw new Error('Unsupported gate type \''+gate.type+'\'');
    }
  }

  return wiresToLabels;
}

/**
 * Encrypt a single gate; input and output wires must have labels at this point.
 * @param {Object} gate - The gate to garble
 * @param {Object[]} wiresToLabels - Mapping from each wire index to two labels
 */
function garbleGate(gate, wsToLs) {
  const i = gate.wirein[0];
  const j = (gate.wirein.length === 2) ? gate.wirein[1] : i;
  const k = gate.wireout;

  if (gate.type === 'xor') {
    return 'xor';  // Free XOR; encrypt nothing.
  } else if (gate.type === 'not') {
    return 'not';
  } else {  // if (gate.type === 'and') {
    var t = [0,0,0,1];
    return [
      [crypto.encrypt(wsToLs[i][0], wsToLs[j][0], k, wsToLs[k][t[0]]).stringify(), (2 * wsToLs[i][0].pointer()) + wsToLs[j][0].pointer()],
      [crypto.encrypt(wsToLs[i][0], wsToLs[j][1], k, wsToLs[k][t[1]]).stringify(), (2 * wsToLs[i][0].pointer()) + wsToLs[j][1].pointer()],
      [crypto.encrypt(wsToLs[i][1], wsToLs[j][0], k, wsToLs[k][t[2]]).stringify(), (2 * wsToLs[i][1].pointer()) + wsToLs[j][0].pointer()],
      [crypto.encrypt(wsToLs[i][1], wsToLs[j][1], k, wsToLs[k][t[3]]).stringify(), (2 * wsToLs[i][1].pointer()) + wsToLs[j][1].pointer()]
    ].sort(function (c1, c2) {  // Point-and-permute.
      return c1[1] - c2[1];
    }).map(function (c) {
      return c = c[0];
    });
  }
  // Define cases for any other gate types here.
}

/**
 * Garble all the gates (stateless version).
 * @param {Object} circuit - The circuit in which to garble the gates
 * @param {Object[]} wiresToLabels - Mapping from each wire index to two labels
 * @returns {Object[]} The garbled gates.
 */
function garbleGates(circuit, wiresToLabels) {
  var garbledGates = [];
  for (var i = 0; i < circuit.gates; i++) {
    garbledGates.push(garbleGate(circuit.gate[i], wiresToLabels));
  }
  return garbledGates;
}

module.exports = {
  initializeWiresToLabels: initializeWiresToLabels,
  generateWiresToLabels: generateWiresToLabels,
  garbleGate: garbleGate,
  garbleGates: garbleGates
};
