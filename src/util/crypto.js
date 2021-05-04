'use strict';

const sodium = require('libsodium-wrappers-sumo');
const bytes = 16;

function encrypt(a, b, t, m) {
  const a2 = a.double();
  const b4 = b.quadruple();
  const k = a2.xor(b4);
  return m.xor(k).xorBytes(randomOracle(k.bytes, t));
}

function longToByteArray(long) {
  // we want to represent the input as a 24-bytes array
  let byteArray = new Uint8Array(sodium.crypto_secretbox_NONCEBYTES);

  for (let index = 0; index < byteArray.length; index++) {
    let byte = long & 0xff;
    byteArray [ index ] = byte;
    long = (long - byte) / 256 ;
  }

  return byteArray;
}

function randomOracle(m, t) {
  return sodium.crypto_secretbox_easy(
    m,
    longToByteArray(t),  // Nonce 24 bytes because this sodium uses 192 bit blocks.
    sodium.from_hex('da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8')  // SHA(0).
  ).subarray(0, bytes+1);  // Prune back to the correct number of bytes.
}

function encrypt_generic(plaintext, key, nonce) {
  return plaintext.xorBytes(key).xorBytes(randomOracle(key, nonce));
}

module.exports = {
  encrypt: encrypt, // label encryption
  decrypt: encrypt,
  encrypt_generic: encrypt_generic, // OT
  decrypt_generic: encrypt_generic
};
