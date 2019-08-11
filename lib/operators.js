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
  console.log(a, b, (String(a) + String(b)).hashCode());
  return (String(a) + String(b)).hashCode();
}
