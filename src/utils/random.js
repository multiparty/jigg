/**
 * Cryptographically-suitable utility functions for random operations.
 * @module src/utils/random
 */

//var sodium = require('../sodium.js');
var label = require('../data/label.js');

const bytes = 16;
const labels = [];

/**
 * Return a random bit.
 * @returns {uint32_t} The random bit.
 */
function random_bit() {
  return sodium.randombytes_uniform(2);
}

/**
 * Choose random number within bitLength bits without replacement.
 * @param {number} bitLength - The number of bits in value's representation.
 * @returns {uint32_t} The random number.
 */
function random_with_replacement(bitLength) {
  if (bitLength == null) {
    bitLength = bytes * 8;
  }

  var r = random_bit();
  for (var i = 1; i < bitLength; i++) {
    r *= 2;
    r += random_bit();
  }
  return r;
}

/**
 * Generate a new random unused label.
 * @param {number} length - The length of the label.
 * @param {number} bits - The number of bits in individual values.
 * @returns {Object} The random label as a Label object.
 */
function random(length, bits) {
  if (length == null) {
    length = bytes;
  }
  if (bits == null) {
    bits = 8;
  }

  var l = new label.Label();
  for (var i = 0; i < length; i++) {
    l[i] = random_with_replacement(bits);
  }
  labels.unshift(l.toString());
  return (labels.lastIndexOf(l.toString()) === 0)? l : random(length);
}

/**
 * Cryptographically shuffle array.
 * @param {Array} array - The length of the label.
 * @returns {Array} The shuffled array.
 */
function shuffle(array) {
  var r, tmp, i;
  for (i = array.length-1; i > 0; i--) {
    // Pick random index at or to the left of array[i].
    r = sodium.randombytes_uniform(i + 1);

    // Swap array[i] with array[r].
    tmp = array[r];
    array[r] = array[i];
    array[i] = tmp;
  }
  return array;
}

module.exports = {
  shuffle: shuffle,
  random: random,
  random_bit: random_bit
};
