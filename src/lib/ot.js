const init = function(socket) {
  const crypto = require('../utils/crypto.js');
  const curve = crypto.ed25519;
  const Label = require('./label.js');

  const bytes = 8;

  /*
  *  Oblivious Transfer primitive
  *  Sender calls send(a, b)
  *  Receiver calls receive(c) and gets c?a:b
  */
  const send = function(m0, m1) {
    var msg_id = socket.nextid();

    return new Promise(function (resolve) {
      let a = curve.random();
      let A = curve.mult_g(a);
      socket.give(msg_id + 'A', curve.point2str(A));
      socket.get(msg_id + 'B').then(function (B_str) {
        let B = curve.str2point(B_str);

        let k0 = curve.hash(curve.mult(B, a));
        let k1 = curve.hash(curve.mult(curve.sub(B, A), a));
        let e0 = crypto.encrypt_generic(m0, k0);
        let e1 = crypto.encrypt_generic(m1, k1);
        socket.give(msg_id + 'e', JSON.stringify([curve.str2point(e0), curve.str2point(e1)]));

        resolve();
      });
    });
  }

  const receive = function(c) {
    var msg_id = socket.nextid();

    return new Promise(function (resolve) {
      socket.get(msg_id + 'A').then(function (A_str) {
        let A = curve.str2point(A_str);

        let b = curve.random();
        let B = c ? curve.add(A, curve.mult_g(b)) : curve.mult_g(b);
        socket.give(msg_id + 'B', curve.point2str(B));
        socket.get(msg_id + 'e').then(function (e_JSON) {
          let e = curve.str2point(JSON.parse(e_JSON)[c]);

          let k = curve.hash(curve.mult(A, b));
          let m_c = crypto.decrypt_generic(e, k);

          resolve(m_c);
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
