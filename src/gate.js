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
 * Get the value of the garbled gate at the specified index.
 * @param {number} index - The index of the desired value
 * @returns {string} The value at the specified index
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
 * @param {Object[]} [garbledGates=[]] - The array of garbled gates
 * @constructor
 */
function GarbledGates(garbledGates) {
  if (!garbledGates)
    garbledGates = [];
  this.garbledGates = garbledGates;
}

/**
 * Add a garbled gate to the ordered collection of garbled gates.
 * @param {Object} garbledGate - The garbled gate to add
 */
GarbledGates.prototype.add = function (garbledGate) {
  this.garbledGates.push(garbledGate);
};

/**
 * Allocate space for the number of garbled gates in the collection.
 * @param {number} number - The expected number of gates
 */
GarbledGates.prototype.allocate = function (number) {
  this.garbledGates = Array(number);
};

/**
 * Insert a gate into a specific entry in the collection.
 * @param {number} index - The index at which to insert the supplied gate
 * @param {Object} garbledGate - The garbled gate to insert
 */
GarbledGates.prototype.insert = function (index, garbledGate) {
  this.garbledGates[index] = garbledGate;
};

/**
 * Retrieve the garbled gate at the specified index.
 * @param {number} index - The index of the desired gate
 * @param {Object} garbledGate - The gate at the specified index
 */
GarbledGates.prototype.get = function (index) {
  return this.garbledGates[index];
};

/**
 * Return garbled gates as a JSON object.
 * @returns {Object[]} The array of gates, with each gate as JSON
 */
GarbledGates.prototype.toJSON = function () {
  return this.garbledGates.map(function (g) { return g.toJSON(); })
};

/**
 * Build an ordered collection of garbled gates from its JSON representation.
 * @param {Object[]} json - The array of gates, with each gate as JSON
 * @returns {Object} The ordered collection of garbled gates
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
