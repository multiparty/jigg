/**
 * Gate (normal and garbled) data structure and associated functions.
 * @module src/data/gate
 */

'use strict';

const bristolOpToIGG = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

/**
 * Create a new gate data structure instance.
 * @param {number[]} wirein - Input wires indices for the gate
 * @param {number} wireout - Output wire index
 * @param {string} type - Gate operation
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
 * @param {string[]} values - List of encrypted garbled gate values
 * @constructor
 */
function GarbledGate(values) {
  this.values = values;
}

/**
 * Get the value of the garbled gate at the specified index.
 * @param {number} index - Index of the desired value
 * @returns {string} Value at the specified index
 */
GarbledGate.prototype.get = function (index) {
  return this.values[index];
};

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
GarbledGate.prototype.toJSON = function () {
  return this.values;
};

/**
 * Create an ordered collection of garbled gates.
 * @param {Object[]} [garbledGates=[]] - Array of garbled gates
 * @constructor
 */
function GarbledGates(garbledGates) {
  if (!garbledGates)
    garbledGates = [];
  this.garbledGates = garbledGates;
}

/**
 * Add a garbled gate to the ordered collection of garbled gates.
 * @param {Object} garbledGate - Garbled gate to add
 */
GarbledGates.prototype.add = function (garbledGate) {
  this.garbledGates.push(garbledGate);
};

/**
 * Allocate space for the number of garbled gates in the collection.
 * @param {number} number - Expected number of gates
 */
GarbledGates.prototype.allocate = function (number) {
  this.garbledGates = Array(number);
};

/**
 * Insert a gate into a specific entry in the collection.
 * @param {number} index - Index at which to insert the supplied gate
 * @param {Object} garbledGate - Garbled gate to insert
 */
GarbledGates.prototype.insert = function (index, garbledGate) {
  this.garbledGates[index] = garbledGate;
};

/**
 * Retrieve the garbled gate at the specified index.
 * @param {number} index - Index of the desired gate
 * @param {Object} garbledGate - Gate at the specified index
 */
GarbledGates.prototype.get = function (index) {
  return this.garbledGates[index];
};

/**
 * Return garbled gates as a JSON object.
 * @returns {Object[]} Array of gates, with each gate as JSON
 */
GarbledGates.prototype.toJSON = function () {
  return this.garbledGates.map(function (g) { return g.toJSON(); })
};

/**
 * Build an ordered collection of garbled gates from its JSON representation.
 * @param {Object[]} json - Array of gates, with each gate as JSON
 * @returns {Object} Ordered collection of garbled gates
 */
GarbledGates.prototype.fromJSON = function (json) {
  return new GarbledGates(json.map(function (vs) { return new GarbledGate(vs); }));
};

module.exports = {
  Gate: Gate,
  GarbledGate: GarbledGate,
  GarbledGates: GarbledGates,
  bristolOpToIGG: bristolOpToIGG
};
