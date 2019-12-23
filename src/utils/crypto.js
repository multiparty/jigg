/**
 * Cryptographic utility functions.
 * @module utils/crypto
 */

//const sodium = require('../sodium.js');
const bytes = 8;

/**
 * Encryption based on fixed-key AES;
 * proposed in Bellare et al. IEEE SP.2013.39.
 * @param {string} a - ...
 * @param {string} b - ...
 * @param {string} t - ...
 * @param {string} m - ...
 * @returns {string} The encrypted result.
 */
function encrypt(a, b, t, m) {
  // console.log('a', a, '\nb', b, '\nt', t, '\nm', m);
  const k = a.xor(b);
  return m.xor(k).xor(random_oracle(k, t));
}
const decrypt = encrypt;

/**
 * Fixed-key 1-block cipher as the Random Oracle.
 * @param {string} m - ...
 * @param {string} t - ...
 * @returns {string} ...
 */
function random_oracle(m, t = 0) {
  return sodium.crypto_secretbox_easy(
    m,
    new Uint8Array(24).fill(t),  // Nonce 24 bytes because this sodium uses 192 bit blocks.
    sodium.from_hex('da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8')  // SHA(0).
  ).subarray(0, bytes+1);  // Prune back to the correct number of bytes.
}

/**
 * Generic element-wise XOR for any indexed data structure
 * @param {Array} a - First input to XOR.
 * @param {Array} b - Second input to XOR.
 * @param {number} l - Length of inputs.
 * @returns {Array} Result of XOR operation on inputs.
 */
function xor_array(a, b, l) {
  if (l == null) {
    l = a.length;
  }

  if (a.length !== b.length) {
    throw new Error('Array length mismatch: ' + a.length + ', ' + b.length + ', ' + l);
  }

  var c = a.constructor(l);
  for (var i = 0; i < l; i++) {
    c[i] = a[i] ^ b[i];
  }
  return c;
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
  xor_array: xor_array
};
