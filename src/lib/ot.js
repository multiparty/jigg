const init = function(socket) {
  const crypto = require('../utils/crypto.js');
  const Label = require('./label.js');

  const bytes = 8;

  /*
  *  Oblivious Transfer primitive
  *  Sender calls send(a, b)
  *  Receiver calls receive(c) and gets c?a:b
  */
  function send(a, b) {
    var msg_id = socket.nextid();
    socket.call('oblv', {msg_id: msg_id, length: bytes + 1});

    return new Promise(function (resolve) {
      socket.hear('oblv' + msg_id).then(function (r0_r1_JSON) {
        const r0_r1 = JSON.parse(r0_r1_JSON);
        const r0 = r0_r1[0];
        const r1 = r0_r1[1];

        socket.get('e' + msg_id).then(function (e_JSON) {
          const e = parseInt(e_JSON);
          const f0 = crypto.xor_array(a, e ? r1 : r0);
          const f1 = crypto.xor_array(b, e ? r0 : r1);

          socket.give('f' + msg_id, '[' + f0.stringify() + ',' + f1.stringify() + ']');
          resolve();
        });
      });
    });
  }

  function receive(c) {
    var msg_id = socket.nextid();
    socket.call('oblv', {msg_id: msg_id, length: bytes + 1});

    return new Promise(function (resolve) {
      socket.hear('oblv' + msg_id).then(function (d_rd_JSON) {
        const d_rd = JSON.parse(d_rd_JSON);
        const d = d_rd[0];
        const r_d = d_rd[1];

        socket.give('e' + msg_id, c ^ d);
        socket.get('f' + msg_id).then(function (f_JSON) {
          const f = JSON.parse(f_JSON);
          const f0 = f[0];
          const f1 = f[1];

          const m_c = crypto.xor_array(r_d, c ? f1 : f0);
          const label = Label(m_c);
          resolve(label);
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
