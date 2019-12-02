const sodium = require('libsodium-wrappers-sumo');

// Generic pairwise XOR for any indexed data structure
function xor_array(a, b, l) {
  if (l == null) {
    l = a.length;
  }

  if (a.length !== b.length) {
    throw new Error('array length mismatch: ' + a.length + ', ' + b.length + ', ' + l);
  }

  var c = new Uint8Array(l);
  for (var i = 0; i < l; i++) {
    c[i] = a[i] ^ b[i];
  }
  return c;
}

sodium.ready.then(function () {
  const random = sodium.crypto_core_ristretto255_random;
  const add = sodium.crypto_core_ristretto255_add;
  const sub = sodium.crypto_core_ristretto255_sub;
  const mult = sodium.crypto_core_ristretto255_scalar_mul;
  const inverse = sodium.crypto_core_ristretto255_scalar_inverse;
  const valid = sodium.crypto_core_ristretto255_is_valid_point;
  const mult_g = sodium.crypto_scalarmult_ristretto255_base;
  const hash = (a, l) => sodium.crypto_pwhash_scryptsalsa208sha256(l, a, a, 0, 0);
  const enc = (m, k) => xor_array(m, k);
  const dec = (c, k) => xor_array(c, k);


  // const lib = sodium.libsodium;
  //
  // // console.log(sodium.randombytes_buf(3));
  // // console.log(sodium.crypto_core_ristretto255_random());
  // var q = sodium.randombytes_buf(32);
  // console.log(q);
  // console.log(lib._crypto_core_ed25519_random(q));
  // console.log(q);
  // console.log(lib._crypto_core_ed25519_from_uniform(sodium.randombytes_buf(32)));
  // console.log(lib._crypto_scalarmult_ed25519_base_noclamp(
  //   sodium.crypto_core_ristretto255_random()
  // ));
  //
  //
  //
  // /////////
  // /*/////*/return;
  // /////////

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
  let k0 = hash(mult(B, a), 32);
  let k1 = hash(mult(sub(B, A), a), 32);
  let e0 = enc(m0, k0);
  let e1 = enc(m1, k1);
  // send e0, e1

  let kR = hash(mult(A, b), 32);
  let mc = dec(c ? e1 : e0, kR);

  console.log(m0, m1, mc);
  // console.log(A, B, k0, k1, kR, mult(mult_g(b), a), mult(mult_g(a), b), mult_g(add(b, a)));
});
