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

/**
 * Return a random (uniformly) bit vector of specified length.
 * @param {number} length - Length of bit vector
 * @param {number} index - Seed index (for determinism)
 * @returns {Object} Random bit vector
 */
function random(length, index) {
  index = (index == null) ? 1 : index; // Never use 0 as index.
  var prime1 = 7518157;
  var primes2 = [
    1120211, 1193911, 1390931, 1761671, 3001003, 3321233, 3673763,
    3836383, 7069607, 7257527, 7632367, 9620269, 9809089, 9980899
  ]
  var base = index * length;
  var bits = [];
  for (var i = 0; i < length; i++) {
    bits.push(((primes2[i % primes2.length] * (1 + i + base)) % prime1) % 2);
  }
  return new Bits(bits);  
};

module.exports = {
  Bits: Bits,
  random: random
};
