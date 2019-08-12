/*
 *  Setup Connections
 */
var role = 'whoever';
join(role);
hear('whoami').then((msg) => role = msg);
hear('go').then(main);

/*
 *  2PC code here
 */

function garbled_gate() {

}


function main() {
  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    let Wire0 = 1;

    var labels = shuffle([0, 1, 2, 3]);
    var Wire = [[]];
    Wire[0][0] = labels[0];
    Wire[0][1] = labels[1];
    Wire[1][0] = labels[2];
    Wire[1][1] = labels[3];
    var gate = [null, null, null, null];
    gate[0] = encrypt(keyderive(Wire[0][0], Wire[1][0]), 0);
    gate[1] = encrypt(keyderive(Wire[0][0], Wire[1][1]), 0);
    gate[2] = encrypt(keyderive(Wire[0][1], Wire[1][0]), 0);
    gate[3] = encrypt(keyderive(Wire[0][1], Wire[1][1]), 1);
    gate = shuffle(gate);

    give('gate', JSON.stringify(gate));
    give('WgG', Wire0 ? Wire[0][1] : Wire[0][0]);

    obliviousT(Wire[1][0], Wire[1][1]);

    get('decryption').then(console.log.bind(null, 'decryption'));
  }

  if (role === 'evaluator') {
    let e = 1;

    Promise.all([
      get('gate'),   // Garbled gate
      get('WgG'),    // Garbler input label
      obliviousT(e)  // Evaluator input label
    ]).then(function (msg) {
      let gate = JSON.parse(msg[0]);
      let Wire0g = msg[1];
      let Wire1e = msg[2];
      for (var i = 0; i < gate.length; i++) {
        let decryption = decrypt(keyderive(Wire0g, Wire1e), gate[i]);
        console.log(decryption);
        if (!isNaN(decryption)) {  // Will replace this with point-and-permute soon
          give('decryption', decryption);
        }
      }
    });
  }
}












;
