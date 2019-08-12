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
    let g = 1;

    var labels = shuffle([0, 1, 2, 3]);
    let W0G = labels[0];
    let W1G = labels[1];
    let W0E = labels[2];
    let W1E = labels[3];
    var gate = [null, null, null, null];
    gate[0] = encrypt(keyderive(W0G, W0E), 0);
    gate[1] = encrypt(keyderive(W0G, W1E), 0);
    gate[2] = encrypt(keyderive(W1G, W0E), 0);
    gate[3] = encrypt(keyderive(W1G, W1E), 1);
    gate = shuffle(gate);

    give('gate', JSON.stringify(gate));
    give('WgG', g ? W1G : W0G);

    obliviousT(W0E, W1E);

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
      let WgG = msg[1];
      let WeE = msg[2];
      for (var i = 0; i < gate.length; i++) {
        let decryption = decrypt(keyderive(WgG, WeE), gate[i]);
        console.log(decryption);
        if (!isNaN(decryption)) {  // Will replace this with point-and-permute soon
          give('decryption', decryption);
        }
      }
    });
  }
}












;
