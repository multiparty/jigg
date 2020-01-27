/**
 * Oblivious transfer (OT) functionality.
 * @module src/comm/parser
 */

'use strict';

const crypto = require('../util/crypto');
const curve = crypto.ed25519;
const label = require('../data/label');

/**
 * Create a communication object that uses OT.
 * @param {Object} socket - Socket to use for communications
 * @returns {Object} OT-based I/O object
 */
const init = function(socket) {

  /**
   * Oblivious transfer sending primitive:
   *   sender calls send(a, b);
   *   receiver calls receive(c) and gets c?a:b.
   * @param {Array} m0 - First argument
   * @param {Array} m1 - Second argument
   * @returns {Promise} Promise object that executes action
   */
  const send = function(m0, m1) {
    var msg_id = socket.nextid();
    m0 = m0.toBytes();  // shadow cast as bytes
    m1 = m1.toBytes();

    return new Promise(function (resolve) {
      let a = curve.random();
      let A = curve.mult_g(a);
      socket.give(msg_id + 'A', curve.point2str(A));
      socket.get(msg_id + 'B').then(function (B_str) {
        let B = curve.str2point(B_str);

        let k0 = curve.point2hash(curve.mult(B, a));
        let k1 = curve.point2hash(curve.mult(curve.sub(B, A), a));
        let e0 = crypto.encrypt_generic(m0, k0);
        let e1 = crypto.encrypt_generic(m1, k1);
        socket.give(msg_id + 'e', JSON.stringify([crypto.util.bytes2str(e0), crypto.util.bytes2str(e1)]));

        resolve();
      });
    });
  };

  /**
   * Oblivious transfer receiving primitive:
   *   sender calls send(a, b);
   *   receiver calls receive(c) and gets c?a:b.
   * @param {boolean} c - Criteria parameter
   * @returns {Promise} Promise object that executes action
   */
  const receive = function(c) {
    var msg_id = socket.nextid();

    if (typeof(c) !== 'number') {
      console.warn('Possible wrong input.  Defaulting to 0 bit(s)');
      c = 0;
    }

    return new Promise(function (resolve) {
      socket.get(msg_id + 'A').then(function (A_str) {
        let A = curve.str2point(A_str);

        let b = curve.random();
        let B = c ? curve.add(A, curve.mult_g(b)) : curve.mult_g(b);
        socket.give(msg_id + 'B', curve.point2str(B));
        socket.get(msg_id + 'e').then(function (e_JSON) {
          let e = crypto.util.str2bytes(JSON.parse(e_JSON)[c]);

          let k = curve.point2hash(curve.mult(A, b));
          let m_c = crypto.decrypt_generic(e, k);

          resolve(Label(m_c));  // return transfered bytes as a Label object
        });
      });
    });
  };

  return {
    send: send,
    receive: receive
  };
};

module.exports = init;
