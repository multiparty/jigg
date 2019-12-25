/**
 * Gate (normal and garbled) data structure and associated functions.
 * @module src/gate
 */

'use strict';

const types = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

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

module.exports = {
  Gate: Gate,
  types: types
};
