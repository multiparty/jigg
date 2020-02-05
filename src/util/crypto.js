/**
 * Cryptographic utility functions.
 * @module src/util/crypto
 */

'use strict';

//const sodium = require('../sodium');
const ed25519 = require('./ed25519.js');
const bytes = 8;

/**
 * Encryption based on fixed-key AES;
 * proposed in Bellare et al. IEEE SP.2013.39.
 * @param {string} a - Left-side input label
 * @param {string} b - Right-side input label
 * @param {string} t - Unused tweak
 * @param {string} m - Message to encrypt
 * @returns {string} Encrypted message
 */
function encrypt(a, b, t, m) {
  // console.log('a', a, '\nb', b, '\nt', t, '\nm', m);
  const k = a.xor(b);
  return m.xor(k).xor(randomOracle(k, t));
}

function longToByteArray(long) {
  // we want to represent the input as a 8-bytes array
  var byteArray = new Uint8Array(sodium.crypto_secretbox_NONCEBYTES);

  for ( var index = 0; index < byteArray.length; index ++ ) {
    var byte = long & 0xff;
    byteArray [ index ] = byte;
    long = (long - byte) / 256 ;
  }

  return byteArray;
}

/**
 * Fixed-key 1-block cipher as the Random Oracle.
 * @param {string} m - Message
 * @param {string} t - Tweak
 * @returns {string} Pseudorandom bytes for ephemeral OTP key
 */
function randomOracle(m, t = 0) {
    return sodium.crypto_secretbox_easy(
    m,
    longToByteArray(t),  // Nonce 24 bytes because this sodium uses 192 bit blocks.
    sodium.from_hex('da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8')  // SHA(0).
  ).subarray(0, bytes+1);  // Prune back to the correct number of bytes.
}

/**
 *  Generic encryption
 */
function encrypt_generic(plaintext, key, nonce) {
  return xorArray(xorArray(plaintext, key), randomOracle(key, nonce), plaintext.length);
}

/*
 *  Asymmetric cryptography functionalities
 */
function public_encrypt(plaintext, publicKey) {
  // CODE
  throw new Error('Function `public_encrypt` not implemented yet');
  return plaintext;
}

function private_decrypt(ciphertext, privateKey) {
  // CODE
  throw new Error('Function `private_decrypt` not implemented yet');
  return ciphertext;
}

/**
 * Generic element-wise XOR for any indexed data structure
 * @param {Array} a - First input to XOR
 * @param {Array} b - Second input to XOR
 * @param {number} l - Length of inputs
 * @returns {Array} Result of XOR operation on inputs
 */
function xorArray(a, b, l) {
  if (l == null) {
    if (a.length !== b.length) {
      throw new Error('array length mismatch: ' + a.length + ', ' + b.length + ', ' + l);
    } else {
      l = a.length;
    }
  }

  var c = new a.constructor(l);
  for (var i = 0; i < l; i++) {
    c[i] = a[i] ^ b[i];
  }
  return c;
}

function bytes2str(bytes) {
  return '['+bytes.toString()+']';
}

function str2bytes(str) {
  return new Uint8Array(JSON.parse(str));
}

module.exports = {
  encrypt: encrypt,  // label encryption
  decrypt: encrypt,
  encrypt_generic: encrypt_generic,  // symmetric encryption
  decrypt_generic: encrypt_generic,
  public_encrypt: public_encrypt,  // asymmetric encryption
  private_decrypt: private_decrypt,  // asymmetric decryption
  xorArray: xorArray,
  util: {
    str2bytes: str2bytes,
    bytes2str: bytes2str
  },
  ed25519: ed25519
};
