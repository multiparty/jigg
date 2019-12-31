/**
 * Oblivious transfer (OT) functionality.
 * @module src/comm/parser
 */

'use strict';

const crypto = require('../util/crypto');
const label = require('../data/label');

/**
 * Create a communication object that uses OT.
 * @param {Object} socket - Socket to use for communications
 * @returns {Object} OT-based I/O object
 */
const init = function(socket) {
  const bytes = 8;

  /**
   * Oblivious transfer sending primitive:
   *   sender calls send(a, b);
   *   receiver calls receive(c) and gets c?a:b.
   * @param {Array} a - First argument
   * @param {Array} b - Second argument
   * @returns {Promise} Promise object that executes action
   */
  const send = function(a, b) {
    var msgId = socket.nextid();
    socket.call('oblv', {msgId: msgId, length: bytes + 1});

    return new Promise(function (resolve) {
      socket.hear('oblv' + msgId).then(function (r0_r1_JSON) {
        const r0_r1 = label.labelsFromJSONString(r0_r1_JSON);
        const r0 = r0_r1[0];
        const r1 = r0_r1[1];

        socket.get('e' + msgId).then(function (e_JSON) {
          const e = parseInt(e_JSON);
          const f0 = crypto.xorArray(a, e ? r1 : r0);
          const f1 = crypto.xorArray(b, e ? r0 : r1);
          socket.give('f' + msgId, label.labelsToJSONString([f0, f1]));
          resolve();
        });
      });
    });
  }

  /**
   * Oblivious transfer receiving primitive:
   *   sender calls send(a, b);
   *   receiver calls receive(c) and gets c?a:b.
   * @param {boolean} c - Criteria parameter
   * @returns {Promise} Promise object that executes action
   */
  const receive = function(c) {
    var msgId = socket.nextid();
    socket.call('oblv', {msgId: msgId, length: bytes + 1});

    return new Promise(function (resolve) {
      socket.hear('oblv' + msgId).then(function (d_rd_JSON) {
        const d_rd = JSON.parse(d_rd_JSON); // This has the form [int, Label].
        const d = d_rd[0];
        const r_d = d_rd[1];

        socket.give('e' + msgId, c ^ d);
        socket.get('f' + msgId).then(function (f_JSON) {
          const f = label.labelsFromJSONString(f_JSON);
          const f0 = f[0];
          const f1 = f[1];

          const m_c = crypto.xorArray(r_d, c ? f1 : f0);
          const labelNew = label.Label(m_c);
          resolve(labelNew);
        });
      });
    });
  }

  return {
    send: send,
    receive: receive
  };
}

module.exports = init;
