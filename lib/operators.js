
/*
 *  Return proper word length for encryption and labeling
 */
function word() {
  return Math.ceil(Math.log2(circuit.wires * 2));
}
const bytes = 16;

/*
 *  Convert a hexadecimal base string to a binary base string
 *  Eg. 'ABC' => '101010111100'
 */
const table16 = {
  '0': '0000', '1': '0001', '2': '0010', '3': '0011',
  '4': '0100', '5': '0101', '6': '0110', '7': '0111',
  '8': '1000', '9': '1001', 'A': '1010', 'B': '1011',
  'C': '1100', 'D': '1101', 'E': '1110', 'F': '1111'
};
function hex2bin(hex) {
  if ($('#base').val() === 'bin') { return hex; }  // skip if already base2
  var bin = '';
  for (var i = 0; i < hex.length; i++) {
    bin += table16[hex[i].toUpperCase()];
  }
  return bin;
}

/*
 *  Convert a binary base string to a hexadecimal base string
 *  Eg. '101010111100' => 'ABC'
 */
const table2 = {
  '0000': '0', '0001': '1', '0010': '2', '0011': '3',
  '0100': '4', '0101': '5', '0110': '6', '0111': '7',
  '1000': '8', '1001': '9', '1010': 'A', '1011': 'B',
  '1100': 'C', '1101': 'D', '1110': 'E', '1111': 'F'
};
function bin2hex(bin) {
  if ($('#base').val() === 'bin') { return bin; }  // skip if already base2
  var hex = '';
  bin = (new Array((4-(bin.length%4))%4)).fill('0').join('') + bin;
  for (var i = 0; i < bin.length; i+=4) {
    hex += table2[bin.substr(i, 4)];
  }
  return hex;
}

function circuit_from_path(path, type) {
  if (type === 'text') {
    return circuit_load_bristol(path, 'text');
  } else if (type === 'json') {
    return circuit_load_json(path, 'json');
  }
}

const types = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};
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

      for (var i = 1+circuit.wires-bristol[2][1]; i <= circuit.wires; i++) {
        circuit.output.push(i);
      }

      for (var i = 0; i < circuit.gates; i++) {
        let args = bristol[i+3];

        var gate = {};
        gate.wirein = [1+(+args[2])];
        if (parseInt(args[0]) === 2) {
          gate.wirein.push(1+(+args[3]));
        }
        gate.wireout = 1+(+args[2+(+args[0])]);
        gate.type = types[args[3+(+args[0])]];

        circuit.gate.push(gate);
      }

      resolve(circuit);
    });
  });
}

/*
 *  Label object with prototype to save memory
 */
var Label = function (init = bytes+1) {
  return Reflect.construct(Uint8Array, [init], Label);
};

// Copy Uint8Array features
Reflect.setPrototypeOf(Label.prototype, Uint8Array.prototype);

// Add in our label helpers
Label.prototype.stringify = function () {
  var json = '[';
  for (var i = 0; i < this.length - 1; i++) {
    json += this[i] + ',';
  }
  json += this[i] + ']';
  return json;
};
Label.prototype.pointer = function (point) {
  return this[bytes] = (point == null)? this[bytes] : point;
};
Label.prototype.point = function (point) {
  this.pointer(point);
  return this;
};
Label.prototype.xor_key = function (b) {  // xor_array.bind(this, this, arguments[0], this.length-1);
  return xor_array(this, b, this.length - 1);
};

/*
 *  Generic pairwise XOR for any indexed data structure
 */
function xor_array(a, b, l = a.length) {
  if (a.length !== b.length) {
    throw new error('array length mismatch');
  }
  var c = a.constructor(a.length);
  for (var i = 0; i < l; i++) {
    c[i] = a[i] ^ b[i];
  }
  return c;
};

/*
 *  Random bit
 */
const random_bit = () => Math.random() < 0.5 ? 0 : 1;

/*
 *  Pick a random number within bitLength bits without replacement
 */
var catalog = [];
function random_no_repeat(bitLength = word()) {
  var r = random_bit();
  for (var i = 1; i < bitLength; i++) {
    r *= 2;
    r += random_bit();
  }
  catalog.unshift(r);  // -or- catalog = [r].concat(catalog);
  return (catalog.lastIndexOf(r) < 1)? r : random(bitLength);
}

/*
 *  Pick a random number within bitLength bits without replacement
 */
function random_with_replacement(bitLength = word()) {
  var r = random_bit();
  for (var i = 1; i < bitLength; i++) {
    r *= 2;
    r += random_bit();
  }
  return r;
}

/*
 *  Pick a new random unused label
 */
var labels = [];
function random(length = bytes, bits = 8) {
  var l = new Label();
  for (var i = 0; i < length; i++) {
    l[i] = random_with_replacement(bits);
  }
  labels.unshift(l.toString());
  return (labels.lastIndexOf(l.toString()) === 0)? l : random(length);
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
 *  Encryption based on fixed-key AES
 *  proposed in Bellare et al. IEEE 2013
 */
const encrypt = decrypt = function(a, b, t, m) {
  console.log('a', a, 'b', b, 't', t, 'm', m);
  const k = a.xor_key(b).xor_key(t);
  return aes_fixed(k).xor_key(k).xor_key(m);
};

function aes_fixed(m) {
  const c = m;
  return Math.floor((c/1.5) + m) % c;
}

function obliviousT(a, b) {
  let msg_id = nextid();
  call('oblv', {msg_id: msg_id, length: word()});

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
        give('f'+msg_id, '[' + f0.stringify() + ',' + f1.stringify() + ']');
      });
    });
  }

  if (role === 'evaluator') {
    const c = a;
    hear('oblv'+msg_id).then(function (d_rd_JSON) {
      const d_rd = JSON.parse(d_rd_JSON);
      const d = d_rd[0];
      const r_d = d_rd[1];
      give('e'+msg_id, xor_array(c, d).stringify());
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
