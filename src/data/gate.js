/**
 * Gate (normal and garbled) data structure and associated functions.
 * @module src/data/gate
 */

'use strict';

const bristolOpToIGG = {AND: 'and', XOR: 'xor', INV: 'not'};

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
    wire_in_index: this.wire_in_index,
    wire_out_index: this.wire_out_index,
    operation: this.operation
  };
};

/**
 * Create a new garbled gate data structure instance.
 * @param {Object[]} labels - List of encrypted garbled gate labels
 * @constructor
 */
function GateGarbled(labels) {
  this.labels = (labels == null) ? [] : labels;
}

/**
 * Get the value of the garbled gate at the specified index.
 * @param {number} index - Index of the desired value
 * @returns {string} Value at the specified index
 */
GateGarbled.prototype.get = function (index) {
  return this.labels[index];
};

/**
 * Return a gate data structure instance as a JSON object.
 * @returns {Object} Gate data structure instance as a JSON object
 */
GateGarbled.prototype.toJSON = function () {
  return this.labels;
};

/**
 * Return a gate data structure instance as a JSON string.
 * @returns {string} Gate data structure instance as a JSON string
 */
GateGarbled.prototype.toJSONString = function () {
  return JSON.stringify(this.labels);
};

/**
 * Create an ordered collection of garbled gates.
 * @param {Object} [gatesGarbled={}] - Map from gate indices to garbled gates
 * @constructor
 */
function GatesGarbled(gatesGarbled) {
  this.gatesGarbled = (!gatesGarbled) ? {} : gatesGarbled;
}

/**
 * Insert a gate into a specific entry in the collection.
 * @param {number} index - Index at which to insert the supplied gate
 * @param {Object} gateGarbled - Garbled gate to insert
 */
GatesGarbled.prototype.set = function (index, gateGarbled) {
  this.gatesGarbled[index] = gateGarbled;

  // Note: A possible optimize to reduce message sizes is to
  // not include gates with empty label lists at this point.
  // If at some later point .get() is called on that gate
  // index, things should behave as if the index is invalid,
  // anyway.
};

/**
 * Retrieve the garbled gate at the specified index.
 * @param {number} index - Index of the desired gate
 * @returns {Object} Gate at the specified index
 */
GatesGarbled.prototype.get = function (index) {
  return this.gatesGarbled[index];
};

/**
 * Return garbled gates as a JSON object.
 * @returns {Object[]} Array of gates, with each gate as JSON
 */
GatesGarbled.prototype.toJSON = function () {
  var json = {};
  for (var i in this.gatesGarbled) {
    json[i] = this.gatesGarbled[i].toJSON();
  }
  return json;
};

/**
 * Return garbled gates as a JSON string.
 * @returns {string} Garbled gates as a JSON string
 */
GatesGarbled.prototype.toJSONString = function () {
  return JSON.stringify(this.toJSON());
};

/**
 * Build an ordered collection of garbled gates from its JSON representation.
 * @param {Object[]} json - Array of gates, with each gate as JSON
 * @returns {Object} Ordered collection of garbled gates
 */
GatesGarbled.prototype.fromJSON = function (json) {
  var gatesGarbled = new GatesGarbled();
  for (var i in json) {
    gatesGarbled.set(i, new GateGarbled(json[i]));
  }
  return gatesGarbled;
};

/**
 * Build an ordered collection of garbled gates from a JSON string.
 * @returns {Object} Ordered collection of garbled gates
 */
GatesGarbled.prototype.fromJSONString = function (s) {
  return GatesGarbled.prototype.fromJSON(JSON.parse(s));
};

module.exports = {
  Gate: Gate,
  GateGarbled: GateGarbled,
  GatesGarbled: GatesGarbled,
  bristolOpToIGG: bristolOpToIGG
};
