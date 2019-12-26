/**
 * Stateless garbling functions for garbled circuits protocol.
 * @module src/garble
 */

const gate = require('./data/gate.js');
const circuit = require('./data/circuit.js');
const label = require('./data/label.js');
const randomutils = require('./utils/random.js');
const crypto = require('./utils/crypto.js');

/**
 * Initialize the data structure for labeled wires.
 * @param {Object} circuit - Circuit for which to generate labels
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
 * @param {Object} circuit - Circuit for which to generate labels
 * @returns {Object[]} Mapping from each wire index to two labels
 */
function generateWiresToLabels(circuit) {
  const R = randomutils.random();  // R in {0, 1}^N.
  var wiresToLabels = initializeWiresToLabels(circuit);

  for (var j = 0; j < circuit.input.length; j++) {
    var i = circuit.input[j];

    var labelNew = randomutils.random();
    wiresToLabels[i][0] = labelNew;
    wiresToLabels[i][1] = labelNew.xor(R);

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
 * @param {Object} gateFromCircuit - Gate to garble
 * @param {Object[]} wiresToLabels - Mapping from each wire index to two labels
 * @returns {Object} Garbled gate
 */
function garbleGate(gateFromCircuit, wsToLs) {
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
      [crypto.encrypt(wsToLs[i][0], wsToLs[j][0], k, wsToLs[k][t[0]]).stringify(), (2 * wsToLs[i][0].pointer()) + wsToLs[j][0].pointer()],
      [crypto.encrypt(wsToLs[i][0], wsToLs[j][1], k, wsToLs[k][t[1]]).stringify(), (2 * wsToLs[i][0].pointer()) + wsToLs[j][1].pointer()],
      [crypto.encrypt(wsToLs[i][1], wsToLs[j][0], k, wsToLs[k][t[2]]).stringify(), (2 * wsToLs[i][1].pointer()) + wsToLs[j][0].pointer()],
      [crypto.encrypt(wsToLs[i][1], wsToLs[j][1], k, wsToLs[k][t[3]]).stringify(), (2 * wsToLs[i][1].pointer()) + wsToLs[j][1].pointer()]
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
 * @param {Object[]} wiresToLabels - Mapping from each wire index to two labels
 * @returns {Object} Ordered collection of garbled gates
 */
function garbleGates(circuit, wiresToLabels) {
  var garbledGates = new gate.GarbledGates();
  for (var i = 0; i < circuit.gates; i++) {
    garbledGates.add(garbleGate(circuit.gate[i], wiresToLabels));
  }
  return garbledGates;
}

module.exports = {
  initializeWiresToLabels: initializeWiresToLabels,
  generateWiresToLabels: generateWiresToLabels,
  garbleGate: garbleGate,
  garbleGates: garbleGates
};
