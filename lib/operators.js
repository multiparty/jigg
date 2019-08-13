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

function encrypt(k, m) {
  const c = (k^m)*k;
  console.log('c', c);
  return c;
}

function decrypt(k, c) {
  var m = (c/k)^k;
  console.log('m', m+((c/k)%1));
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

var msg_id = 0;
function obliviousT(a, b, length = 2) {
  call('oblv', {msg_id: ++msg_id, length: length});

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
        // get('m_c'+msg_id).then((m_c) => __return(JSON.parse(m_c)));
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
        // give('m_c'+msg_id, JSON.stringify(m_c));
      });
    });
  }

  return promise;
}
