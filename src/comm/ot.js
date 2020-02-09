'use strict';

const sodium = require('libsodium-wrappers-sumo');

const crypto = require('../util/crypto.js');
const labelParser = require('../parse/label.js');

function OT(socket) {
  this.socket = socket;
}

OT.prototype.send = function (tag, m0, m1) {
  const SALT = new Uint8Array(sodium.crypto_pwhash_scryptsalsa208sha256_SALTBYTES);

  const self = this;
  const _id = this.socket.nextId();

  this.socket.hear('C', _id).then(function (c) {
    const m = c === 1 ? m1 : m0;
    self.socket.emit('T', m.serialize(), _id);
  });
  return;

  const a = sodium.crypto_core_ristretto255_scalar_random();
  const A = sodium.crypto_scalarmult_ristretto255_base(a);

  this.socket.emit('A', Array.from(A), _id);
  this.socket.hear('B', _id).then(function (B) {
    B = Uint8Array.from(B);
    let k0 = sodium.crypto_scalarmult_ristretto255(B, a);
    let k1 = sodium.crypto_scalarmult_ristretto255(sodium.crypto_core_ristretto255_sub(B, A), a);

    k0 = sodium.crypto_pwhash_scryptsalsa208sha256(m0.bytes.length, k0, SALT, 0, 0);
    k1 = sodium.crypto_pwhash_scryptsalsa208sha256(m1.bytes.length, k1, SALT, 0, 0);

    const e0 = crypto.encrypt_generic(m0, k0, 0);
    const e1 = crypto.encrypt_generic(m1, k1, 0);

    self.socket.emit('e', [e0.serialize(), e1.serialize()], _id);
  });
};

OT.prototype.receive = function (tag, c, labelSize) {
  const SALT = new Uint8Array(sodium.crypto_pwhash_scryptsalsa208sha256_SALTBYTES);

  const self = this;
  const _id = this.socket.nextId();

  return new Promise(function (resolve) {
    self.socket.emit('C', c, _id);
    self.socket.hear('T', _id).then(function (label) {
      resolve(labelParser(label));
    });
  });

  return new Promise(function (resolve) {
    self.socket.hear('A', _id).then(function (A) {
      A = Uint8Array.from(A);
      const b = sodium.crypto_core_ristretto255_scalar_random();
      let B = sodium.crypto_scalarmult_ristretto255_base(b);
      if (c === 1) {
        B = sodium.crypto_core_ristretto255_add(A, B);
      }

      self.socket.emit('B', Array.from(B), _id);
      self.socket.hear('e', _id).then(function (e) {
        e = labelParser(e[c]);

        let k = sodium.crypto_scalarmult_ristretto255(A, b);
        k = sodium.crypto_pwhash_scryptsalsa208sha256(labelSize, k, SALT, 0, 0);

        resolve(crypto.decrypt_generic(e, k, 0));
      });
    });
  });
};

module.exports = OT;
