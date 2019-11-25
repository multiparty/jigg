const sodium = require('libsodium-wrappers');

function encrypt(m, pk) {
  let c = new Uint8Array(16);
  for (var i = 0; i < 16; i++) {
    c[i] = m[i] ^ pk[i];
  }
  return c;
}

function decrypt(c, sk) {
  let m = new Uint8Array(16);
  for (var i = 0; i < 16; i++) {
    m[i] = c[i] ^ sk[i];
  }
  return m;
}

function add(a, b) {
  let c = new Uint8Array(16);
  for (var i = 0; i < 16; i++) {
    c[i] = a[i] + b[i];
  }
  return c;
}

function sub(a, b) {
  let c = new Uint8Array(16);
  for (var i = 0; i < 16; i++) {
    c[i] = a[i] - b[i];
  }
  return c;
}

function keygen() {
  let pk = sodium.randombytes_buf(32);
  let sk = pk;
  return {publicKey: pk, privateKey: sk};
}

sodium.ready.then(function () {
  let keypair = keygen();
  let pk = keypair.publicKey;  // public key
  let sk = keypair.privateKey;  // private (secret) key

  let m0 = new Uint8Array(16).fill(0);
  let m1 = new Uint8Array(16).fill(1);
  let x0 = sodium.randombytes_buf(16);
  let x1 = sodium.randombytes_buf(16);
  // send x0, x1, pk

  let c = 0;
  let k = sodium.randombytes_buf(16);
  let v = add(c ? x1 : x0, encrypt(k, pk));
  // send v

  let m0k = add(m0, decrypt(sub(v, x0), sk));
  let m1k = add(m1, decrypt(sub(v, x1), sk));
  // send m0k, m1k

  let mc = sub(c ? m1k : m0k, k);

  console.log(m0, m1, c, mc);
});




// sodium.ready.then(function () {
//   // console.log(sodium.crypto_secretbox_easy(
//   //   new Uint8Array(24).fill(0),
//   //   new Uint8Array(24).fill(0),  // nonce 24 bytes becasue this sodium uses 192 bit blocks
//   //   sodium.from_hex('da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8')
//   // ));
//   //
//   // console.log(sodium.crypto_box_easy(
//   //   new Uint8Array(8).fill(0),
//   //   new Uint8Array(24).fill(0),
//   //   new Uint8Array(32).fill(0),
//   //   new Uint8Array(32).fill(0)
//   // ));
//
//
//   var key = sodium.crypto_box_keypair();
//   var plaintext = new Uint8Array(16);
//   var message_id = 0;
//   var nonce = new Uint8Array(24).fill(message_id);
//
//   var encrypted = sodium.crypto_box_easy(plaintext, nonce, key.publicKey, key.privateKey);
//   console.log(encrypted);
//   encrypted[7] = 0;
//   console.log(encrypted);
//
//   var decrypted = sodium.crypto_box_open_easy(encrypted, nonce, key.publicKey, key.privateKey);
//   console.log(decrypted);
// });
