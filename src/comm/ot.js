'use strict';

const sodium = require('libsodium-wrappers-sumo');

const crypto = require('../util/crypto.js');
const labelParser = require('../parse/label.js');

function OT(socket) {
  this.socket = socket;
}

OT.prototype.send = function (tag, m0, m1) {
  const self = this;
  const _id = this.socket.nextId();

  const a = sodium.crypto_core_ristretto255_scalar_random();
  const A = sodium.crypto_scalarmult_ristretto255_base(a);

  this.socket.send('A', Array.from(A), _id);
  this.socket.hear('B', _id).then(function (B) {
    B = Uint8Array.from(B);
    let k0 = sodium.crypto_scalarmult_ristretto255(a, B);
    let k1 = sodium.crypto_scalarmult_ristretto255(a, sodium.crypto_core_ristretto255_sub(B, A));

    k0 = sodium.crypto_generichash(m0.bytes.length, k0);
    k1 = sodium.crypto_generichash(m1.bytes.length, k1);

    const e0 = crypto.encrypt_generic(m0, k0, 0);
    const e1 = crypto.encrypt_generic(m1, k1, 0);

    self.socket.send('e', [e0.serialize(), e1.serialize()], _id);
  });
};

OT.prototype.receive = function (tag, c) {
  const self = this;
  const _id = this.socket.nextId();

  const b = sodium.crypto_core_ristretto255_scalar_random();
  let B = sodium.crypto_scalarmult_ristretto255_base(b);

  return new Promise(function (resolve) {
    self.socket.hear('A', _id).then(function (A) {
      A = Uint8Array.from(A);
      if (c === 1) {
        B = sodium.crypto_core_ristretto255_add(A, B);
      }

      self.socket.send('B', Array.from(B), _id);
      self.socket.hear('e', _id).then(function (e) {
        e = labelParser(e[c]);

        let k = sodium.crypto_scalarmult_ristretto255(b, A);
        k = sodium.crypto_generichash(e.bytes.length, k);

        resolve(crypto.decrypt_generic(e, k, 0));
      });
    });
  });
};

module.exports = OT;
