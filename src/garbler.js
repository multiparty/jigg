var Wire;

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function garble_gate(type, wirein, wireout) {
  console.log('garble_gate', type, wirein, wireout);

  const i = wirein[0];
  const j = (wirein.length === 2) ? wirein[1] : i;
  const k = wireout;

  if (type === 'xor') {
    return 'xor';  // free xor - encrypt nothing
  } else if (type === 'not') {
    return 'not';
  } else if (type === 'and') {
    var t = [0,0,0,1];
  } // --Define any other gates here--

  return [
    [crypto.encrypt(Wire[i][0], Wire[j][0], k, Wire[k][t[0]]).stringify(), (2*Wire[i][0].pointer()) + Wire[j][0].pointer()],
    [crypto.encrypt(Wire[i][0], Wire[j][1], k, Wire[k][t[1]]).stringify(), (2*Wire[i][0].pointer()) + Wire[j][1].pointer()],
    [crypto.encrypt(Wire[i][1], Wire[j][0], k, Wire[k][t[2]]).stringify(), (2*Wire[i][1].pointer()) + Wire[j][0].pointer()],
    [crypto.encrypt(Wire[i][1], Wire[j][1], k, Wire[k][t[3]]).stringify(), (2*Wire[i][1].pointer()) + Wire[j][1].pointer()]
  ].sort(function (c1, c2) {
    return c1[1] - c2[1]
  }).map(function (c) {
    return c[0]; // point-and-permute
  });
}
