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
var Wire;
function init() {
  circuit_from_path('circuits/sha256.txt', 'text').then((bristol) => circuit = bristol).then(main);
}

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function garble_gate(type, wirein, wireout) {
  console.log('garble_gate', type, wirein, wireout);
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

  return [
    [encrypt(keyderive(Wire[i][0], Wire[j][0]), Wire[k][t[0]]), (2*(Wire[i][0]%2)) + (Wire[j][0]%2)],
    [encrypt(keyderive(Wire[i][0], Wire[j][1]), Wire[k][t[1]]), (2*(Wire[i][0]%2)) + (Wire[j][1]%2)],
    [encrypt(keyderive(Wire[i][1], Wire[j][0]), Wire[k][t[2]]), (2*(Wire[i][1]%2)) + (Wire[j][0]%2)],
    [encrypt(keyderive(Wire[i][1], Wire[j][1]), Wire[k][t[3]]), (2*(Wire[i][1]%2)) + (Wire[j][1]%2)]
  ].sort((c1, c2) => c1[1] - c2[1]).map((c) => c = c[0]);  // point-and-permute
}

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function evaluate_gate(gate, wirein, wireout) {
  console.log('evaluate_gate', gate, wirein, wireout);
  const i = wirein[0];
  const j = (wirein.length === 2)? wirein[1] : i;
  const k = wireout; // previously `circuit[[i, j]].wireout`

  const l = (2*(Wire[i]%2)) + (Wire[j]%2);
  Wire[k] = decrypt(keyderive(Wire[i], Wire[j]), gate[l]);
}

/*
 *  The standard garbling scheme as followed by the two parties
 */
function main() {
  console.log(circuit);

  // Safely init all wires
  Wire = [null];
  for (var i = 1; i <= circuit.wires; i++) {
    Wire.push([]);
  }

  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    // User input
    const inputs = (new Array(512+1)).fill(0);

    // Generate labels
    var labels = [];
    for (var i = 0; i < circuit.wires * 2; i++) {
      labels.push(i);
    }
    labels = shuffle(labels);

    // Encode each state of every wire with a randomly generated label
    for (var i = 1; i <= circuit.wires; i++) {
      let j = (2*i)-2; let k = (2*i)-1;
      let point = random_bit();
      labels[j] = 2*labels[j] + point;
      labels[k] = 2*labels[k] + 1-point;
      Wire[i][0] = labels[j];  // false_label
      Wire[i][1] = labels[k];  // true_label
    }

    console.log('Wire', Wire);
    console.log('labels', labels);

    // Garble all gates
    var gates = [];
    for (var i = 0; i < circuit.gates; i++) {
      const gate = circuit.gate[i];
      gates[i] = garble_gate(gate.type, gate.wirein, gate.wireout);
    }

    // Give the garbled gates to evaluator
    give('gates', JSON.stringify(gates));

    // Give the evaluator the first half of the input labels
    for (var i = 0; i < circuit.input.length/2; i++) {
      let j = circuit.input[i];
      console.log('give Wire'+j);
      give('Wire'+j, inputs[j] ? Wire[j][1] : Wire[j][0]);
    }

    // Use oblivious transfer for the second half of the input labels
    for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
      let j = circuit.input[i];
      console.log('transfer for Wire'+j);
      obliviousT(Wire[j][0], Wire[j][1]);
    }

    // Get output labels and decode them back to their original values
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
    const inputs = (new Array(512+1)).fill(0);

    var messages = [];

    // Promise to the garbled gates
    messages.push(get('gates'));

    // Promises to each of the garbler's input labels
    for (var i = 0; i < circuit.input.length/2; i++) {
      messages.push(get('Wire'+circuit.input[i]));
    }

    // Promises to each of the evaluator's input labels
    for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
      console.log('obliviousT ask for wire', circuit.input[i], 'with value', inputs[circuit.input[i]]);
      messages.push(obliviousT(inputs[circuit.input[i]]));
    }

    Promise.all(messages).then(function (msg) {
      console.log('msg', msg);
      const gates = JSON.parse(msg[0]);

      for (var i = 0; i < circuit.input.length; i++) {
        let j = circuit.input[i];
        Wire[j] = msg[j];
      }
      console.log('Wire', Wire);

      for (var i = 0; i < circuit.gates; i++) {
        const gatedef = circuit.gate[i];
        console.log(evaluate_gate(gates[i], gatedef.wirein, gatedef.wireout));
      }

      console.log(Wire);

      // Collect all output wires' labels
      // and send them back to the garbler for decoding
      var evaluation = [];
      for (var i = 0; i < circuit.output.length; i++) {
        let j = circuit.output[i];
        console.log('j', j, Wire[j]);
        evaluation[j] = Wire[j];
      }
      give('evaluation', evaluation);
      get('results').then(console.log.bind(null, 'results'));
    });
  }
}
