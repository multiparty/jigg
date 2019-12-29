/**
 * Cryptographically-suitable utility functions for random operations.
 * @module src/utils/random
 */

//var sodium = require('../sodium.js');

const bytes = 16;

/**
 * Return a random bit.
 * @returns {uint32_t} The random bit.
 */
function randomBit() {
  return sodium.randombytes_uniform(2);
}

/**
 * Choose random number within bitLength bits without replacement.
 * @param {number} bitLength - The number of bits in value's representation.
 * @returns {uint32_t} The random number.
 */
function randomWithReplacement(bitLength) {
  if (bitLength == null) {
    bitLength = bytes * 8;
  }

  var r = randomBit();
  for (var i = 1; i < bitLength; i++) {
    r *= 2;
    r += randomBit();
  }
  return r;
}

/**
 * Cryptographically shuffle array.
 * @param {Array} array - Length of the label.
 * @returns {Array} Shuffled array.
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
  randomBit: randomBit,
  randomWithReplacement: randomWithReplacement,
  bytes: bytes
};
