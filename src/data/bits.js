/**
 * Bit vectors.
 * @module src/data/bits
 */

'use strict';

/**
 * Create a new bit vector instance. 
 * @param {*} argument - Bits specified using some type and representation
 * @param {string} representation - Representation format of argument
 * @constructor
 */
function Bits(argument, representation) {
  // The internal representation is an array of numbers
  // in which each number is either 0 or 1.
  if (typeof(argument) == 'string') {
    if (representation == null || representation === 'binary') {
      this.bits = argument.split('');
    }
  }
  if (Object.prototype.toString.call(argument) === '[object Array]') {
    this.bits = argument;
  }
}

/**
 * Return a JSON representation of the bit vector.
 * @returns {number[]} Array of numbers (each number is a bit)
 */
Bits.prototype.toJSON = function () {
  return this.bits;
};

/**
 * Return a string representation of the bit vector.
 * @returns {string} String representation of the bit vector in binary
 */
Bits.prototype.toString = function () {
  return this.bits.join('');
};

module.exports = {
  Bits: Bits
};
