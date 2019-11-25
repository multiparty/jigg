const init = function(socket) {
  const crypto = require('../utils/crypto.js');
  const Label = require('./label.js');

  const bytes = 8;

  /*
  *  Oblivious Transfer primitive
  *  Sender calls send(a, b)
  *  Receiver calls receive(c) and gets c?a:b
  */
  const send = function(a, b) {
    var msg_id = socket.nextid();

    return new Promise(function (resolve) {
      socket.give(msg_id, '[' + a.stringify() + ',' + b.stringify() + ']');
      resolve();
    });
  }

  const receive = function(c) {
    var msg_id = socket.nextid();

    return new Promise(function (resolve) {
      socket.get(msg_id).then(function (f_JSON) {
        const f = JSON.parse(f_JSON);
        const f0 = f[0];
        const f1 = f[1];

        const m_c = c ? f1 : f0;
        const label = Label(m_c);
        resolve(label);
      });
    });
  }

  return {
    send: send,
    receive: receive
  };
}

module.exports = init;
