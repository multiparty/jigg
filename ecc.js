const sodium = require('libsodium-wrappers-sumo');

sodium.ready.then(function () {
  const random = sodium.crypto_core_ristretto255_random;
  const add = sodium.crypto_core_ristretto255_add;
  const sub = sodium.crypto_core_ristretto255_sub;
  const mult = sodium.crypto_core_ristretto255_scalar_mul;
  const inverse = sodium.crypto_core_ristretto255_scalar_inverse;
  const valid = sodium.crypto_core_ristretto255_is_valid_point;
  const mult_g = sodium.crypto_scalarmult_ristretto255_base;

  let m0 = random();  // new Uint8Array(16).fill(0);
  let m1 = random();  // new Uint8Array(16).fill(1);

  let c = 0;

  let a = random();
  let A = mult_g(a);
  // send A

  let b = random();
  let B = c ? add(A, mult_g(b)) : mult_g(b);
  // send B

  // invalid group elements  v v v  becasue clamping
  let k0 = mult(B, a);
  let k1 = mult(sub(B, A), a);
  let kR = mult(A, b);

  console.log(A, B, k0, k1, kR, mult(mult_g(b), a), mult(mult_g(a), b), mult_g(add(b, a)));
});
