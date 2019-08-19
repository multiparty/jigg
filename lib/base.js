/*
 *  Setup Connections
 */
var role;
var messages;
function begin() {
  role = $('#partytype').val();
  join(role);
  hear('whoami').then((msg) => role = msg);
  hear('go').then(init);
}

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
//circuit_from_path('circuits/'+$('#circuit').val(), 'text').then((bristol) => circuit = bristol).then(main);
  circuit_from_path('circuits/bristol_circuit.txt', 'text').then((bristol) => circuit = bristol).then(main);
}

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function garble_gate(type, wirein, wireout) {
  console.log('garble_gate', type, wirein, wireout);
  return new Promise(function (resolve) {
    const i = wirein[0];
    const j = (wirein.length === 2)? wirein[1] : i;
    const k = wireout;

    if (type === 'and') {
      var t = [0,0,0,1];
    } else if (type === 'xor') {
      var t = [0,1,1,0];
    } else if (type === 'not') {
      // temporary support
      var t = [1,-1,-1,0];
    }

    const gate = [
      [encrypt(keyderive(Wire[i][0], Wire[j][0]), Wire[k][t[0]]), (2*(Wire[i][0]%2)) + (Wire[j][0]%2)],
      [encrypt(keyderive(Wire[i][0], Wire[j][1]), Wire[k][t[1]]), (2*(Wire[i][0]%2)) + (Wire[j][1]%2)],
      [encrypt(keyderive(Wire[i][1], Wire[j][0]), Wire[k][t[2]]), (2*(Wire[i][1]%2)) + (Wire[j][0]%2)],
      [encrypt(keyderive(Wire[i][1], Wire[j][1]), Wire[k][t[3]]), (2*(Wire[i][1]%2)) + (Wire[j][1]%2)]
    ].sort((c1, c2) => c1[1] - c2[1]).map((c) => c = c[0]);  // point-and-permute

    resolve(gate);
  });
}

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function evaluate_gate(gate, wirein, wireout) {
  console.log('evaluate_gate', gate, wirein, wireout);
  return new Promise(function (resolve) {
    const i = wirein[0];
    const j = (wirein.length === 2)? wirein[1] : i;
    const k = (wireout != null)? wireout : 0;  // if null, just return decrypted
    const l = (2*(Wire[i]%2)) + (Wire[j]%2);

    Wire[k] = decrypt(keyderive(Wire[i], Wire[j]), gate[l]);

    resolve(Wire[k]);
  });
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
    const party_input = $('#input').val().split('').map(JSON.parse);
    const inputs = (new Array(1)).concat(party_input).concat(new Array(party_input.length));
    console.log('input states', inputs);

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

    // Give the evaluator the first half of the input labels
    for (var i = 0; i < circuit.input.length/2; i++) {
      let j = circuit.input[i];
      console.log('give Wire'+j, i, circuit.input, inputs[j], Wire[j][1], Wire[j][0], inputs[j] ? Wire[j][1] : Wire[j][0]);
      give('Wire'+j, inputs[j] ? Wire[j][1] : Wire[j][0]);
    }

    // Use oblivious transfer for the second half of the input labels
    for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
      let j = circuit.input[i];
      console.log('transfer for Wire'+j);
      obliviousT(Wire[j][0], Wire[j][1]);
    }

    // Garble all gates
    var gates = [];
    const throttle = 1;  // milliseconds
    (function garble_at(i) {
      const gate = circuit.gate[i];
      garble_gate(gate.type, gate.wirein, gate.wireout).then(function (garbled_gate) {
        gates[i] = garbled_gate;

        i++; if (i < circuit.gates) {
          setTimeout(() => garble_at(i), throttle);
        } else {
          // Give the garbled gates to evaluator
          give('gates', JSON.stringify(gates));
        }
      });
    })(0);

    // Get output labels and decode them back to their original values
    get('evaluation').then(function (evaluation) {
      var results = [];
      for (var i = 0; i < circuit.output.length; i++) {
        results.push(Wire[circuit.output[i]].indexOf(evaluation[circuit.output[i]]));
      }
      give('results', results); console.log('results', results);
      $('#results').text('Results: ' + results.join(''));
    });
  }

  if (role === 'evaluator') {
    // User input
    const party_input = $('#input').val().split('').map(JSON.parse);
    const inputs = (new Array(1+party_input.length)).concat(party_input);
    console.log('input states', inputs);

    messages = [];

    // Promise to the garbled gates
    messages.push(get('gates'));

    // Promises to each of the garbler's input labels
    for (var i = 0; i < circuit.input.length/2; i++) {
      console.log('listen for Wire'+circuit.input[i]);
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

      const throttle = 1;  // milliseconds
      (function evaluate_at(start) {
        console.log('start start', start);
        const gatedef = circuit.gate[start];
        evaluate_gate(gates[start], gatedef.wirein, gatedef.wireout).then(function (labelout) {
          Wire[gatedef.wireout] = labelout;  // redundant as of now
          console.log('start evald', start);

          start++; if (start < circuit.gates) {
            console.log('start continue', start);
            setTimeout(() => evaluate_at(start), throttle);
          } else {
            console.log('start end', start);
            // Collect all output wires' labels
            // and send them back to the garbler for decoding
            var evaluation = {};
            for (var i = 0; i < circuit.output.length; i++) {
              let j = circuit.output[i];
              console.log('j', j, Wire[j]);
              evaluation[j] = Wire[j];
            }
            give('evaluation', evaluation);

            // Receive decoded output states
            get('results')
            .then((results) => {$('#results').text('Results: ' + results.join(''));return results;})
            .then(console.log.bind(null, 'results'));
          }
        });
      })(0);
    });
  }
}
