/*
 *  JS Engine Limitations
 */
var throttle = 1;  // milliseconds
var parallel = 10;  // encryptions in parallel

/*
 *  Setup Connections
 */
var role;
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
  circuit_from_path('circuits/'+$('#circuit').val(), 'text').then((bristol) => circuit = bristol).then(main);
  // circuit_from_path('circuits/bristol_circuit.txt', 'text').then((bristol) => circuit = bristol).then(main);
}

/*
 *  Encrypt a single gate
 *  Input and output wires must have labels at this point.
 */
function garble_gate(type, wirein, wireout) {
  console.log('garble_gate', type, wirein, wireout);

  const i = wirein[0];
  const j = (wirein.length === 2)? wirein[1] : i;
  const k = wireout;

  if (type === 'and') {
    var t = [0,0,0,1];
  } else if (type === 'xor') {
    var t = [0,1,1,0];
  if (type === 'xor') {
    return 'xor';  // free xor - encrypt nothing
  } else if (type === 'not') {
    return 'not';
  } else if (type === 'and') {
    var t = [0,0,0,1];
  }

  return [
    [encrypt(keyderive(Wire[i][0], Wire[j][0]), Wire[k][t[0]]), (2*(Wire[i][0]%2)) + (Wire[j][0]%2)],
    [encrypt(keyderive(Wire[i][0], Wire[j][1]), Wire[k][t[1]]), (2*(Wire[i][0]%2)) + (Wire[j][1]%2)],
    [encrypt(keyderive(Wire[i][1], Wire[j][0]), Wire[k][t[2]]), (2*(Wire[i][1]%2)) + (Wire[j][0]%2)],
    [encrypt(keyderive(Wire[i][1], Wire[j][1]), Wire[k][t[3]]), (2*(Wire[i][1]%2)) + (Wire[j][1]%2)]
  ].sort((c1, c2) => c1[1] - c2[1]).map((c) => c = c[0]);  // point-and-permute
}

/*
 *  Decrypt a single garbled gate
 *  The resultant label is stored automatically and also returned
 */
function evaluate_gate(gate, type, wirein, wireout) {
  console.log('evaluate_gate', gate, wirein, wireout);

  const i = wirein[0];
  const j = (wirein.length === 2)? wirein[1] : i;
  const k = (wireout != null)? wireout : 0;  // if null, just return decrypted
  const l = (2*(Wire[i]%2)) + (Wire[j]%2);

  if (type === 'xor') {
    Wire[k] = Wire[i] ^ Wire[j];
  } else if (type === 'not') {
    Wire[k] = Wire[i];  // already inverted
  } else if (type === 'and') {
    Wire[k] = decrypt(keyderive(Wire[i], Wire[j]), gate[l]);
  }

  return Wire[k];
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

  // Read browser limit
  parallel = parseInt($('#parallel').val(), 10);

  console.log('I am ' + role + '.');

  if (role === 'garbler') {
    // User input
    const party_input = $('#input').val().split('').map(JSON.parse);
    const inputs = (new Array(1)).concat(party_input).concat(new Array(party_input.length));
    console.log('input states', inputs);

    // Label helpers
    const key = (label) => (label-(label%2))/2;  // Right shift
    const pointer = (label) => label%2;  // LSB
    const pair = (key, pointer) => (2 * key) + pointer;

    /*
     *  Generate labels and encode each state of
     *  every wire with a randomly generated label
     */
    const R = random();  // R in {0, 1}^N

    for (var j = 0; j < circuit.input.length; j++) {
      let i = circuit.input[j];

      let label = random();
      Wire[i][0] = label;
      Wire[i][1] = label ^ R;

      let point = random_bit();
      Wire[i][0] = 2*Wire[i][0] + point;
      Wire[i][1] = 2*Wire[i][1] + 1-point;
    }

    for (var i = 0; i < circuit.gates; i++) {
      let G_i = circuit.gate[i];
      let label_G_i = i;

      if (G_i.type === 'xor') {
        let a = Wire[G_i.wirein[0]][0];
        let b = Wire[G_i.wirein[1]][0];
        let k = G_i.wireout;

        Wire[k][0] = a ^ b;
        Wire[k][1] = pair(
          key(a) ^ key(b) ^ R,
          pointer(a) ^ pointer(b) ^ 1
        );
      } else if (G_i.type === 'and') {
        let k = G_i.wireout;

        let key = random();
        let pointer = random_bit();

        Wire[k][0] = pair(key, pointer);
        Wire[k][1] = pair(key ^ R, pointer ^ 1);
      } else if (G_i.type === 'not') {
        Wire[G_i.wireout][0] = Wire[G_i.wirein[0]][1];
        Wire[G_i.wireout][1] = Wire[G_i.wirein[0]][0];
      } else {
        throw new Error('Unsupported gate type \''+G_i.type+'\'');
      }
    }

    console.log('Wire', Wire);

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
    (function garble_at(start) {
      (new Promise(function (resolve) {
        for (var i = start; i < start+parallel && i < circuit.gates; i++) {
          const gate = circuit.gate[i];
          gates[i] = garble_gate(gate.type, gate.wirein, gate.wireout);
          console.log('             i =', i, 'gates[i] =', gates[i]);
        }
        resolve(gates);
      })).then(function (gates) {  //garbled_gate) { gates[i] = garbled_gate;
        start += parallel; if (start < circuit.gates) {
          setTimeout(() => garble_at(start), throttle);
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

    var messages = [];

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

      (function evaluate_at(start) {
        (new Promise(function (resolve) {
          for (var i = start; i < start+parallel && i < circuit.gates; i++) {
            const gatedef = circuit.gate[i];
            evaluate_gate(gates[i], gatedef.type, gatedef.wirein, gatedef.wireout);
          }
          resolve(Wire);
        })).then(function (Wire) {
          start += parallel; if (start < circuit.gates) {
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
