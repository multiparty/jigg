/**
 * Gate (normal and garbled) data structure and associated functions.
 * @module src/gate
 */

'use strict';

const bristolOpToIGG = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

/**
 * Create a new gate data structure instance.
 * @param {number[]} wirein - The input wires index for the gate
 * @param {number} wireout - The output wire index
 * @param {string} type - The gate operation
 * @constructor
 */
function Gate(wirein, wireout, type) {
  this.wirein = wirein == null ? [] : wirein;
  this.wireout = wirein == null ? undefined : wireout;
  this.type = type == null ? 'unknown' : type;
}

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
Gate.prototype.toJSON = function () {
  return {"wirein":this.wirein, "wireout":this.wireout, "type":this.type};
};

/**
 * Create a new garbled gate data structure instance.
 * @param {string[]} values - The list of encrypted values
 * @constructor
 */
function GarbledGate(values) {
  this.values = values;
}

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
GarbledGate.prototype.toJSON = function () {
  return this.values;
};

/**
 * Create an ordered collection of garbled gates.
 * @param {Object[]} [garbledGates=[]] - The array of garbled gates.
 * @constructor
 */
function GarbledGates(garbledGates) {
  if (!garbledGates)
    garbledGates = [];
  this.garbledGates = garbledGates;
}

/**
 * Add a garbled gate to the ordered collection of garbled gates.
 */
GarbledGates.prototype.add = function (garbledGate) {
  this.garbledGates.push(garbledGate);
};

/**
 * Return garbled gates as a JSON object.
 * @returns {Object[]} The array of gates, with each gate as JSON.
 */
GarbledGates.prototype.toJSON = function () {
  return this.garbledGates.map(function (g) { return g.toJSON(); })
};

module.exports = {
  Gate: Gate,
  GarbledGate: GarbledGate,
  GarbledGates: GarbledGates,
  bristolOpToIGG: bristolOpToIGG
};
