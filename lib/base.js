/*
 *  Setup Connections
 */
var role = 'whoever';
join(role);
hear('whoami').then((msg) => role = msg);
hear('go').then(init);

/***  2PC Implimentation  ***/

/*
 *  Boolean circuit definition
 */
/*const circuit = {
  wires: 8, gates: 4,
  input: [1, 2, 3, 4], output: [5, 7, 8],
  gate: [
    {wirein: [1,2], wireout: 5, type: 'and'},
    {wirein: [3,4], wireout: 6, type: 'and'},
    {wirein: [6], wireout: 7, type: 'not'},
    {wirein: [5,7], wireout: 8, type: 'and'}
  ]
};*/
var circuit;
function init() {
  circuit_from_path('circuits/bristol_circuit.txt', 'text').then((bristol) => circuit = bristol).then(main);
}

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function garble_gate(type, wirein, wireout) {
  const i = wirein[0];
  const j = (wirein.length === 2)? wirein[1] : i;
  const k = wireout; // previously `circuit[[i, j]].wireout`

  if (type === 'and') {
    var t = [0,0,0,1];
  } else if (type === 'xor') {
    var t = [0,1,1,0];
  } else if (type === 'not') {
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
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function evaluate_gate(gate, wirein, wireout) {
  const i = wirein[0];
  const j = (wirein.length === 2)? wirein[1] : i;
  const k = wireout; // previously `circuit[[i, j]].wireout`

  for (var l = 0; l < gate.length; l++) {
    const decryption = decrypt(keyderive(Wire[i], Wire[j]), gate[l]);
    if (!isNaN(decryption)) {  // Will replace this with point-and-permute soon
      Wire[k] = decryption;
    }
  }
}

/*
 *  The standard garbling scheme as followed by the two parties
 */
function main() {
  console.log(circuit);

  // Safely init all wires
  var Wire = [null];
  for (var i = 1; i <= circuit.wires; i++) {
    Wire.push([]);
  }

  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    const Wire1 = 1;
    const Wire2 = 1;

    var labels = [];
    for (var i = 0; i < circuit.wires * 2; i++) {
      labels.push(i);
    }
    labels = shuffle(labels);
    for (var i = 1; i <= circuit.wires; i++) {
        Wire[i][0] = labels[(2*i)-2];
        Wire[i][1] = labels[(2*i)-1];
    }

    var gates = [];
    for (var i = 0; i < circuit.gates; i++) {
      const gate = circuit.gate[i];
      gates[i] = garble_gate(gate.type, gate.wirein, gate.wireout);
    }

    give('gates', JSON.stringify(gates));
    give('Wire1', Wire1 ? Wire[1][1] : Wire[1][0]);
    give('Wire2', Wire2 ? Wire[2][1] : Wire[2][0]);
    obliviousT(Wire[3][0], Wire[3][1]);
    obliviousT(Wire[4][0], Wire[4][1]);

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
    const Wire3 = 1;
    const Wire4 = 0;

    var messages = [];

    messages.push(get('gates'));  // Garbled gates

    // Garbler input label
    messages.push(get('Wire1'));
    messages.push(get('Wire2'));

    // Evaluator input label
    messages.push(obliviousT(Wire3));
    messages.push(obliviousT(Wire4));

    Promise.all(messages).then(function (msg) {
      const gates = JSON.parse(msg[0]);

      Wire[1] = msg[1];
      Wire[2] = msg[2];
      Wire[3] = msg[3];
      Wire[4] = msg[4];

      for (var i = 0; i < circuit.gates; i++) {
        const gatedef = circuit.gate[i];
        evaluate_gate(gates[i], gatedef.wirein, gatedef.wireout);
      }

      var evaluation = [];
      for (var i = 0; i < circuit.output.length; i++) {
        // Collect all output wires
        evaluation[circuit.output[i]] = Wire[circuit.output[i]];
      }
      give('evaluation', evaluation);
      get('results').then(console.log.bind(null, 'results'));
    });
  }
}
