const ed25519 = require('./ed25519.js');
const bytes = 8;

/*
 *  Encryption based on fixed-key AES ( /any blockcipher)
 *  proposed in Bellare et al. IEEE SP.2013.39
 */
function encrypt(a, b, t, m) {
  // console.log('a', a, '\nb', b, '\nt', t, '\nm', m);
  const k = a.xor(b);
  return m.xor(k).xor(
    random_oracle(k, t)
    .subarray(0, bytes+1)  // back to the correct number of bytes
  );
}

// Fixed-key 1-block cipher as the Random Oracle
function random_oracle(m, t = 0) {
  return sodium.crypto_secretbox_easy(
    m,
    new Uint8Array(24).fill(t),  // nonce 24 bytes becasue this sodium uses 192 bit blocks
    sodium.from_hex('da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8')  // sha(0)
  );
}

// Generic encryption
function encrypt_generic(plaintext, key, nonce) {
  return plaintext.xor_array(k).xor_array(random_oracle(k, nonce));
}

/*
 *  Asymmetric cryptography functionalities
 */
function public_encrypt(plaintext, publicKey) {
  // CODE
  return plaintext;
}

function private_decrypt(ciphertext, privateKey) {
  // CODE
  return ciphertext;
}

// Generic pairwise XOR for any indexed data structure
function xor_array(a, b, l) {
  if (l == null) {
    l = a.length;
  }

  if (a.length !== b.length) {
    throw new Error('array length mismatch: ' + a.length + ', ' + b.length + ', ' + l);
  }

  var c = a.constructor(l);
  for (var i = 0; i < l; i++) {
    c[i] = a[i] ^ b[i];
  }
  return c;
}

module.exports = {
  encrypt: encrypt,  // label encryption
  decrypt: encrypt,
  encrypt_generic: encrypt_generic,  // symmetric encryption
  decrypt_generic: encrypt_generic,
  public_encrypt: public_encrypt,  // asymmetric encryption
  private_decrypt: private_decrypt,  // asymmetric decryption
  xor_array: xor_array,
  ed25519: ed25519
};
