/*
 *  Setup Connections
 */
var role = 'whoever';
join(role);
hear('whoami').then((msg) => role = msg);
hear('go').then(main);

/***  2PC Implimentation  ***/

/*
 *  Boolean circuit definition
 */
const circuit = {
  wires: 3, gates: 1,
  input: [1, 2], output: [3],
  gate: [
    {wirein: [1,2], wireout: 3, gate: 'and'}
  ]
};
var Wire = (new Array(1+circuit.wires)).fill(new Array(2));  // Safely init all wires

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function garble_gate(gatetype, wirein, wireout) {
  let i = wirein[0];
  let j = (wirein.length === 2)? wirein[1] : i;
  let k = wireout; // previously `circuit[[i, j]].wireout`

  if (gatetype === 'and') {
    var t = [0,0,0,1];
  } else if (gatetype === 'xor') {
    var t = [0,1,1,0];
  } else if (gatetype === 'not') {
    // temporary support
    var t = [1,-1,-1,0];
  }

  return shuffle([
    encrypt(keyderive(Wire[i][0], Wire[j][0]), Wire[k][t[0]]),
    encrypt(keyderive(Wire[i][0], Wire[j][1]), Wire[k][t[1]]),
    encrypt(keyderive(Wire[i][1], Wire[j][0]), Wire[k][t[2]]),
    encrypt(keyderive(Wire[i][1], Wire[j][1]), Wire[k][t[3]])
  ]);
}

/*
 *  The standard garbling scheme as followed by the two parties
 */
function main() {
  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    let Wire1 = 1;

    var labels = [];
    for (var i = 0; i < circuit.wires * 2; i++) {
      labels.push(i);
    }
    labels = shuffle(labels);
    for (var i = 1; i <= circuit.wires; i++) {
        Wire[i][0] = labels[(2*i)-2];
        Wire[i][1] = labels[(2*i)-1];
    }

    var gate = garble_gate('and', [1, 2], 3);

    give('gate', JSON.stringify(gate));
    give('WgG', Wire1 ? Wire[1][1] : Wire[1][0]);

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
    let Wire2 = 1;

    Promise.all([
      get('gate'),       // Garbled gate
      get('WgG'),        // Garbler input label
      obliviousT(Wire2)  // Evaluator input label
    ]).then(function (msg) {
      let gate = JSON.parse(msg[0]);

      Wire[1] = msg[1];
      Wire[2] = msg[2];
      for (var i = 0; i < gate.length; i++) {
        let decryption = decrypt(keyderive(Wire[1], Wire[2]), gate[i]);
        if (!isNaN(decryption)) {  // Will replace this with point-and-permute soon
          Wire[circuit.gate[0].wireout] = decryption;
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
