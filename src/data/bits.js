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
  // The internal representation is an array of numbers in
  // which each number is either 0 or 1, with the right-most
  // digit being the least significant.
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
 * Return a bit vector padded to the specified length.
 * @param {number} length - Target bit vector length
 * @returns {number} Padded bit vector
 */
Bits.prototype.pad = function (length) {
  var bits = [];
  for (var i = 0; i < Math.max(0, length - this.bits.length); i++) {
    bits.push(0);
  }
  for (var i = 0; i < this.bits.length; i++) {
    bits.push(this.bits[i]);
  }
  return new Bits(bits);
};

/**
 * Return a bit vector truncated to the specified length.
 * @param {number} length - Target bit vector length
 * @returns {number} Truncated bit vector
 */
Bits.prototype.truncate = function (length) {
  var bits = [];
  var length_new = Math.min(this.bits.length, length);
  var diff = this.bits.length - length_new;
  for (var i = 0; i < length_new; i++) {
    bits.push(this.bits[i+diff]);
  }
  return new Bits(bits);
};

/**
 * Return a reversed bit vector.
 * @returns {Object} Reversed bit vector
 */
Bits.prototype.rev = function () {
  var bits = [];
  for (var i = this.bits.length-1; i >= 0; i--) {
    bits.push(this.bits[i]);
  }
  return new Bits(bits);
};

/**
 * Concatenate two bit vectors.
 * @param {Object} other - Other bit vector
 * @returns {Object} Concatenated bit vector
 */
Bits.prototype.concat = function (other) {
  var bits = [];
  for (var i = 0; i < this.bits.length; i++) {
    bits.push(this.bits[i]);
  }
  for (var i = 0; i < other.bits.length; i++) {
    bits.push(other.bits[i]);
  }
  return new Bits(bits);
};

/**
 * Return a BigInt (decimal) representation of the bit vector.
 * @returns {number} Numeric value corresponding to the bit vector
 */
Bits.prototype.toNumber = function () {
  var n = BigInt(0);
  var multiplier = BigInt(1);
  for (var i = this.bits.length-1; i >= 0; i--) {
      n += BigInt(this.bits[i]) * multiplier;
      multiplier *= BigInt(2);
  }
  return n;
};

/**
 * Creates a bit vector representation of a natural number.
 * Works both with numbers and BigInt instances.
 * @param {number} n - Natural number to convert into bit vector
 * @returns {Object} Bit vector
 */
Bits.prototype.fromNumber = function (n) {
  var bits = [];
  var zero = (typeof n === 'bigint') ? BigInt(0) : 0;
  var two = (typeof n === 'bigint') ? BigInt(2) : 2;
  while (n > zero) {
      bits = [((n%two)==BigInt(0)) ? 0 : 1].concat(bits);
      n = n / two;
  }
  return new Bits(bits);
};

/**
 * Perform bit-wise conjunction on two bit vectors.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing bit-wise conjunction
 */
Bits.prototype.and = function (other) {
  var bits = [];
  if (this.bits.length == other.bits.length) {
    for (var i = 0; i < this.bits.length; i++) {
      bits.push((this.bits[i] == 1 && other.bits[i] == 1) ? 1 : 0);
    }
  }
  return new Bits(bits);
};

/**
 * Perform bit-wise disjunction on two bit vectors.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing bit-wise disjunction
 */
Bits.prototype.or = function (other) {
  var bits = [];
  if (this.bits.length == other.bits.length) {
    for (var i = 0; i < this.bits.length; i++) {
      bits.push((this.bits[i] == 1 || other.bits[i] == 1) ? 1 : 0);
    }
  }
  return new Bits(bits);
};

/**
 * Perform bit-wise exclusive disjunction on two bit vectors.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing the bit-wise exclusive disjunction
 */
Bits.prototype.xor = function (other) {
  var bits = [];
  if (this.bits.length == other.bits.length) {
    for (var i = 0; i < this.bits.length; i++) {
      bits.push((this.bits[i] != other.bits[i]) ? 1 : 0);
    }
  }
  return new Bits(bits);
};

/**
 * Perform negation of a bit vector.
 * @returns {number} Bit vector representing the negation of the bit vector
 */
Bits.prototype.not = function () {
  var bits = [];
  for (var i = 0; i < this.bits.length; i++) {
    bits.push(1 - this.bits[i]);
  }
  return new Bits(bits);
};

/**
 * Perform bit-by-bit conjunction across all bits of a vector.
 * @returns {number} Bit vector representing conjunction of all bits
 */
Bits.prototype.andBits = function () {
  for (var i = 0; i < this.bits.length; i++)
    if (this.bits[i] == 0)
      return new Bits([0]);
  return new Bits([1]);
};

/**
 * Perform bit-by-bit disjunction across all bits of a vector.
 * @returns {number} Bit vector representing disjunction of all bits
 */
Bits.prototype.orBits = function () {
  for (var i = 0; i < this.bits.length; i++)
    if (this.bits[i] == 1)
      return new Bits([1]);
  return new Bits([0]);
};

/**
 * Add one bit vector to another bit vector.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing the sum
 */
Bits.prototype.add = function (other) {
  var n = this.toNumber();
  var m = other.toNumber();
  return Bits.prototype.fromNumber(n + m);
};

/**
 * Subtract one bit vector to another bit vector.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing the difference
 */
Bits.prototype.sub = function (other) {
  var n = this.toNumber();
  var m = other.toNumber();
  return Bits.prototype.fromNumber((n >= m) ? n - m : 0);
};

/**
 * Multiply one bit vector by another bit vector.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing the product
 */
Bits.prototype.mul = function (other) {
  var n = this.toNumber();
  var m = other.toNumber();
  return Bits.prototype.fromNumber(n * m);
};

/**
 * Divide one bit vector by another bit vector.
 * @param {Object} other - Other bit vector
 * @returns {number} Bit vector representing the quotient
 */
Bits.prototype.div = function (other) {
  var n = this.toNumber();
  var m = other.toNumber();
  return Bits.prototype.fromNumber(Math.floor(n / m));
};

/**
 * Return a zero bit vector of specified length.
 * @param {number} length - Length of bit vector
 * @returns {Object} Random bit vector
 */
function zero(length) {
  var bits = [];
  for (var i = 0; i < length; i++) {
    bits.push(0);
  }
  return new Bits(bits);  
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
  fromNumber: Bits.prototype.fromNumber,
  zero: zero,
  random: random
};
