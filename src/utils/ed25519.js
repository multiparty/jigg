// random group element
const random = sodium.crypto_core_ristretto255_random;

// point addition [point, point]
const add = sodium.crypto_core_ristretto255_add;

// point subtraction [point, point]
const sub = sodium.crypto_core_ristretto255_sub;

// scalar multiplication [point, point]
const mult = sodium.crypto_core_ristretto255_scalar_mul;

// generator multiplication [point]
const mult_g = sodium.crypto_scalarmult_ristretto255_base;

// point negation [point]
const inv = sodium.crypto_core_ristretto255_scalar_inverse;

// if a point exists on this curve [point]
const valid = sodium.crypto_core_ristretto255_is_valid_point;

// point to hash [point, bytes]
const hash = (a, l = 32) => sodium.crypto_pwhash_scryptsalsa208sha256(l, a, a, 0, 0);

// serialize [point]
const point2str = (a) => a.toString();

// parse [string]
const str2point = (s) => new Uint8Array(JSON.parse('['+s+']'));

module.exports = {
  random: random,
  add: add,
  sub: sub,
  mult: mult,
  mult_g: mult_g,
  inv: inv,
  valid: valid,
  hash: hash
};
