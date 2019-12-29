/**
 * Gate (normal and garbled) data structure and associated functions.
 * @module src/data/gate
 */

'use strict';

const bristolOpToIGG = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

/**
 * Create a new gate data structure instance.
 * @param {number[]} input_wires - Input wires indices for the gate
 * @param {number} output_wire - Output wire index
 * @param {string} operation - Gate operation
 * @constructor
 */
function Gate(input_wires, output_wire, operation) {
  this.input_wires = input_wires == null ? [] : input_wires;
  this.output_wire = output_wire == null ? undefined : output_wire;
  this.operation = operation == null ? 'unknown' : operation;
}

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
Gate.prototype.toJSON = function () {
  return {
    "input_wires": this.input_wires,
    "output_wire": this.output_wire,
    "operation": this.operation
  };
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
 * Return a gate data structure instance as a JSON string.
 * @returns {string} Gate data structure instance as a JSON string
 */
GarbledGate.prototype.toJSONString = function () {
  return JSON.stringify(this.values);
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
  this.garbledGates = new Array(number);
};

/**
 * Insert a gate into a specific entry in the collection.
 * @param {number} index - Index at which to insert the supplied gate
 * @param {Object} garbledGate - Garbled gate to insert
 */
GarbledGates.prototype.set = function (index, garbledGate) {
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
 * Return garbled gates as a JSON string.
 * @returns {string} Garbled gates as a JSON string
 */
GarbledGates.prototype.toJSONString = function () {
  return JSON.stringify(this.toJSON());
};

/**
 * Build an ordered collection of garbled gates from its JSON representation.
 * @param {Object[]} json - Array of gates, with each gate as JSON
 * @returns {Object} Ordered collection of garbled gates
 */
GarbledGates.prototype.fromJSON = function (json) {
  return new GarbledGates(json.map(function (vs) { return new GarbledGate(vs); }));
};

/**
 * Build an ordered collection of garbled gates from a JSON string.
 * @returns {Object} Ordered collection of garbled gates
 */
GarbledGates.prototype.fromJSONString = function (s) {
  return GarbledGates.prototype.fromJSON(JSON.parse(s));
};

module.exports = {
  Gate: Gate,
  GarbledGate: GarbledGate,
  GarbledGates: GarbledGates,
  bristolOpToIGG: bristolOpToIGG
};
