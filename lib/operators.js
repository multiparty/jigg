function circuit_from_path(path, type) {
  if (type === 'text') {
    return circuit_load_bristol(path, 'text');
  } else if (type === 'json') {
    return circuit_load_json(path, 'json');
  }
}

function circuit_load_bristol(path) {
  var circuit = {
    wires: 0, gates: 0,
    input: [], output: [],
    gate: []
  };

  return new Promise(function (resolve) {
    geturl(path, 'text').then(function (text) {
      const bristol = text.split('\n').map((line) => line = line.split(' '));

      circuit.gates = +bristol[0][0];
      circuit.wires = +bristol[0][1];

      for (var i = 1; i <= bristol[1][1]; i++) {
        circuit.input.push(i);
      }

      for (var i = bristol.length-bristol[2][1]; i < bristol.length; i++) {
        circuit.output.push(i);
      }

      for (var i = 0; i < circuit.gates; i++) {
        let args = bristol[i+3];
        console.log(args);

        var gate = {};
        gate.wirein = [1+(+args[2])];
        if (parseInt(args[0]) === 2) {
          gate.wirein.push(1+(+args[3]));
        }
        gate.wireout = 1+(+args[2+(+args[0])]);
        gate.type = args[3+(+args[0])];

        console.log(gate);
        circuit.gate.push(gate);
      }

      resolve(circuit);
    });
  });
}

function shuffle(array) {
  var r, tmp, i;
  for (i = array.length-1; i > 0; i--) {
    r = Math.floor((i + 1) * Math.random());  // Pick random index at or left of array[i]

    // Swap array[i] with array[r]
    tmp = array[r];
    array[r] = array[i];
    array[i] = tmp;
  }
  return array;
}

/*
 *  Dummy authenticated encryption and decryption
 *  (will replace with aes with point-and-permute)
 */
function encrypt(k, m) {
  const c = (k^m)*k;
  console.log('c', c);
  return c;
}

function decrypt(k, c) {
  var m = (c/k)^k;
  console.log('m', m);//, m+((c/k)%1));
  if ((c/k)%1 !== 0) {
    m = NaN;
  }
  return m;
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function keyderive(a, b) {
  return (String(a) + String(b) + String(a) + String(b)).hashCode();
}

function xor_bits(a, b) {
  if (a.length !== b.length) {
    throw new error('array length mismatch');
  }
  var c = [];
  for (var i = 0; i < a.length; i++) {
    c[i] = a[i] ^ b[i];
  }
  return c;
}

function obliviousT(a, b) {
  let msg_id = nextid();
  call('oblv', {msg_id: msg_id, length: Math.ceil(Math.log2(circuit.wires * 2))});

  var __return;
  var promise = new Promise((resolve, reject) => __return = resolve);

  if (role === 'garbler') {
    const m0 = a;
    const m1 = b;
    hear('oblv'+msg_id).then(function (r0_r1_JSON) {
      const r0_r1 = JSON.parse(r0_r1_JSON);
      const r0 = r0_r1[0];
      const r1 = r0_r1[1];
      get('e'+msg_id).then(function (e_JSON) {
        const e = parseInt(e_JSON);
        const f0 = m0 ^ (e ? r1 : r0);
        const f1 = m1 ^ (e ? r0 : r1);
        give('f'+msg_id, JSON.stringify([f0, f1]));
      });
    });
  }

  if (role === 'evaluator') {
    const c = a;
    hear('oblv'+msg_id).then(function (d_rd_JSON) {
      const d_rd = JSON.parse(d_rd_JSON);
      const d = d_rd[0];
      const r_d = d_rd[1];
      give('e'+msg_id, JSON.stringify(c ^ d));
      get('f'+msg_id).then(function (f_JSON) {
        const f = JSON.parse(f_JSON);
        const f0 = f[0];
        const f1 = f[1];
        const m_c = r_d ^ (c ? f1 : f0);
        __return(m_c);
      });
    });
  }

  return promise;
}
