/*
 *  Setup Connections
 */
var role = 'whoever';
join(role);
hear('whoami').then((msg) => role = msg);
hear('go').then(main);


/*
 *  Boolean circuit definition
 */
const circuit = {
  wires: 3, gates: 1,
  input: [1, 2], output: [3],
  '1,2': {wireout: 3, gate: 'and'}
};
circuit.wires++;

/*
 *  2PC code here
 */
function garbled_gate() {
}
function main() {
  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    let Wire0 = 1;

    var labels = shuffle([0, 1, 2, 3, 4, 5]);
    var Wire = (new Array(circuit.wires)).fill(new Array(2));  // Safely init all wires
    Wire[1][0] = labels[0];
    Wire[1][1] = labels[1];
    Wire[2][0] = labels[2];
    Wire[2][1] = labels[3];
    Wire[3][0] = labels[4];
    Wire[3][1] = labels[5];
    var gate = [null, null, null, null];
    gate[0] = encrypt(keyderive(Wire[1][0], Wire[2][0]), Wire[3][0]);
    gate[1] = encrypt(keyderive(Wire[1][0], Wire[2][1]), Wire[3][0]);
    gate[2] = encrypt(keyderive(Wire[1][1], Wire[2][0]), Wire[3][0]);
    gate[3] = encrypt(keyderive(Wire[1][1], Wire[2][1]), Wire[3][1]);
    gate = shuffle(gate);

    give('gate', JSON.stringify(gate));
    give('WgG', Wire0 ? Wire[1][1] : Wire[1][0]);

    obliviousT(Wire[2][0], Wire[2][1]);

    get('evaluation').then(function (evaluation) {
      var results = [];
      for (var i = 0; i < circuit.output.length; i++) {
        results.push(Wire[circuit.output[i]].indexOf(evaluation[circuit.output[i]]));
      }
      console.log('results', results);
      give('results', results);
    });
  }

  if (role === 'evaluator') {
    let Wire1 = 1;

    Promise.all([
      get('gate'),       // Garbled gate
      get('WgG'),        // Garbler input label
      obliviousT(Wire1)  // Evaluator input label
    ]).then(function (msg) {
      let gate = JSON.parse(msg[0]);

      var Wire = (new Array(circuit.wires)).fill(new Array(2));  // Safely init all wires
      Wire[1] = msg[1];
      Wire[2] = msg[2];
      for (var i = 0; i < gate.length; i++) {
        let decryption = decrypt(keyderive(Wire[1], Wire[2]), gate[i]);
        if (!isNaN(decryption)) {  // Will replace this with point-and-permute soon
          Wire[circuit[[1, 2]].wireout] = decryption;
        }
      }

      var evaluation = [];
      for (var i = 0; i < circuit.output.length; i++) {
        evaluation[circuit.output[i]] = Wire[circuit.output[i]];
      }
      give('evaluation', evaluation);
      get('results').then(console.log.bind(null, 'results'));
    });
  }
}












;
