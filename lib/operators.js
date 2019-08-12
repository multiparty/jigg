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

function encrypt(m, k) {
  return m^k;
}

function decrypt(m, k) {
  return m^k;
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
  return (String(a) + String(b)).hashCode();
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

function obliviousT(a, b, length = 2) {
  call('oblv', length);

  var __return;
  var promise = new Promise((resolve, reject) => __return = resolve);

  if (role === 'garbler') {
    let m0 = a;
    let m1 = b;
    hear('oblv').then(function (r0_r1_JSON) {
      let r0_r1 = JSON.parse(r0_r1_JSON);
      let r0 = r0_r1[0];
      let r1 = r0_r1[1];
      get('e').then(function (e_JSON) {
        let e = parseInt(e_JSON);
        let f0 = xor_bits(m0, e ? r1 : r0);
        let f1 = xor_bits(m1, e ? r0 : r1);
        give('f', JSON.stringify([f0, f1]));
        // get('m_c').then((m_c) => __return(JSON.parse(m_c)));
      });
    });
  }

  if (role === 'evaluator') {
    let c = a;
    hear('oblv').then(function (d_rd_JSON) {
      let d_rd = JSON.parse(d_rd_JSON);
      let d = d_rd[0];
      let r_d = d_rd[1];
      give('e', JSON.stringify(c ^ d));
      get('f').then(function (f_JSON) {
        let f = JSON.parse(f_JSON);
        let f0 = f[0];
        let f1 = f[1];
        let m_c = xor_bits(r_d, c ? f1 : f0);
        __return(m_c);
        // give('m_c', JSON.stringify(m_c));
      });
    });
  }

  return promise;
}
