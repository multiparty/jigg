const sodium = require('libsodium-wrappers-sumo');
const elliptic = require('elliptic');
const lib = elliptic.ec('ed25519');
const rand = elliptic.rand;  // random bytes buffer

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
  const add = (p, o) => p.add(o);
  const sub = (p, o) => p.add(o.neg());
  const mult = (p, o) => p.mul(o.x);
  const inverse = p => p.neg();
  const valid = p => p.validate();
  const mult_g = p => mult(lib.g, p);
  const random = () => mult_g(lib.curve.point(rand(32)));
  const point_to_hash = (p, len) => {
    const e = new Uint8Array(p.encode());  // 64 bytes, or p.encodeCompressed() for 32 bytes
    const salt = new Uint8Array(32);  // constant is fine
    const digest = sodium.crypto_pwhash_scryptsalsa208sha256(len, e, salt, 0, 0);
    // console.log(e, digest);
    return digest;
  };
  const enc = (m, k) => xor_array(m, k);
  const dec = (c, k) => xor_array(c, k);


  /*** Oblivious Transfer ***/

  const bytes = 32;

  let m0 = new Uint8Array(bytes).fill(0);  // random();
  let m1 = new Uint8Array(bytes).fill(1);  // random();

  let c = 1;

  let a = random();
  let A = mult_g(a);
  // send A

  let b = random();
  let B = c ? add(A, mult_g(b)) : mult_g(b);
  // send B

  // [sodium had] invalid group elements  v v v  becasue clamping
  let k0 = point_to_hash(mult(B, a), bytes);
  let k1 = point_to_hash(mult(sub(B, A), a), bytes);
  let e0 = enc(m0, k0);
  let e1 = enc(m1, k1);
  // send e0, e1

  let kR = point_to_hash(mult(A, b), 32);
  let mc = dec(c ? e1 : e0, kR);

  console.log(m0, m1, mc);
});
