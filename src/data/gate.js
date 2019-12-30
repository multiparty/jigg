/**
 * Gate (normal and garbled) data structure and associated functions.
 * @module src/data/gate
 */

'use strict';

const bristolOpToIGG = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

/**
 * Create a new gate data structure instance.
 * @param {number[]} wire_in_index - Input wire indices for the gate
 * @param {number[]} wire_out_index - Output wire indices for the gate
 * @param {string} operation - Gate operation
 * @constructor
 */
function Gate(wire_in_index, wire_out_index, operation) {
  this.wire_in_index = wire_in_index == null ? [] : wire_in_index;
  this.wire_out_index = wire_out_index == null ? [] : wire_out_index;
  this.operation = operation == null ? 'unknown' : operation;
}

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
Gate.prototype.toJSON = function () {
  return {
    "wire_in_index": this.wire_in_index,
    "wire_out_index": this.wire_out_index,
    "operation": this.operation
  };
};

/**
 * Create a new garbled gate data structure instance.
 * @param {Object[]} labels - List of encrypted garbled gate labels
 * @constructor
 */
function GarbledGate(labels) {
  this.labels = (labels == null) ? [] : labels;
}

/**
 * Get the value of the garbled gate at the specified index.
 * @param {number} index - Index of the desired value
 * @returns {string} Value at the specified index
 */
GarbledGate.prototype.get = function (index) {
  return this.labels[index];
};

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
GarbledGate.prototype.toJSON = function () {
  return this.labels;
};

/**
 * Return a gate data structure instance as a JSON string.
 * @returns {string} Gate data structure instance as a JSON string
 */
GarbledGate.prototype.toJSONString = function () {
  return JSON.stringify(this.labels);
};

/**
 * Create an ordered collection of garbled gates.
 * @param {Object} [garbledGates={}] - Map from gate indices to garbled gates
 * @constructor
 */
function GarbledGates(garbledGates) {
  this.garbledGates = (!garbledGates) ? {} : garbledGates;
}

/**
 * Insert a gate into a specific entry in the collection.
 * @param {number} index - Index at which to insert the supplied gate
 * @param {Object} garbledGate - Garbled gate to insert
 */
GarbledGates.prototype.set = function (index, garbledGate) {
  this.garbledGates[index] = garbledGate;

  // Note: A possible optimize to reduce message sizes is to
  // not include gates with empty label lists at this point.
  // If at some later point .get() is called on that gate
  // index, things should behave as if the index is invalid,
  // anyway.
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
  var json = {};
  for (var i in this.garbledGates) {
    json[i] = this.garbledGates[i].toJSON();
  }
  return json;
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
  var garbledGates = new GarbledGates();
  for (var i in json) {
    garbledGates.set(i, new GarbledGate(json[i]));
  }
  return garbledGates;
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
