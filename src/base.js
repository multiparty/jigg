const hexutils = require('./utils/hexutils.js');
const socket = require('./lib/socket.js');
const OT = require('./lib/ot.js');
const parser = require('./lib/parser.js');
const crypto = require('./utils/crypto.js');
const Label = require('./lib/label.js');
const randomutils = require('./utils/random.js');

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
  socket.join(role);
  socket.hear('whoami').then(function (msg) {
    role = msg;
  });
  socket.hear('go').then(init);
}

/***  2PC Implementation  ***/

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
var Wire;
function init() {
  parser.circuit_load_bristol('circuits/' + $('#circuit').val()).then(function (circuit) {
    main(circuit);
  });
}



/*
 *  The standard garbling scheme as followed by the two parties
 */
function main(circuit) {
  var i, j, k, point;
  console.log(circuit);

  // Safely init all wires
  Wire = [null];
  for (i = 1; i <= circuit.wires; i++) {
    Wire.push([]);
  }

  // Read browser limit
  parallel = parseInt($('#parallel').val(), 10);

  console.log('I am ' + role + '.');

  var party_input = $('#input').val();
  if ($('#base').val() === 'hex') {
    party_input = hexutils.hex2bin(party_input);
  }
  party_input = party_input.split('').map(JSON.parse);

  if (role === 'garbler') {
    // User input
    const inputs = (new Array(1)).concat(party_input).concat(new Array(party_input.length));
    console.log('input states', inputs);

    /*
     *  Generate labels and encode each state of
     *  every wire with a randomly generated label
     */
    const R = randomutils.random();  // R in {0, 1}^N

    for (j = 0; j < circuit.input.length; j++) {
      i = circuit.input[j];

      var label = randomutils.random();
      Wire[i][0] = label;
      Wire[i][1] = label.xor(R);

      point = randomutils.random_bit();
      Wire[i][0].pointer(point);
      Wire[i][1].pointer(1-point);
    }

    for (i = 0; i < circuit.gates; i++) {
      var gate = circuit.gate[i];
      var label_gate = i;

      if (gate.type === 'xor') {
        var a = Wire[gate.wirein[0]][0];
        var b = Wire[gate.wirein[1]][0];
        k = gate.wireout;

        Wire[k][0] = a.xor(b).point(a.pointer() ^ b.pointer());
        Wire[k][1] = a.xor(b).xor(R).point(a.pointer() ^ b.pointer() ^ 1);
      } else if (gate.type === 'and') {
        k = gate.wireout;

        var key = randomutils.random();
        point = randomutils.random_bit();

        Wire[k][0] = key.point(point);
        Wire[k][1] = key.xor(R).point(point ^ 1);
      } else if (gate.type === 'not') {
        Wire[gate.wireout][0] = Wire[gate.wirein[0]][1];
        Wire[gate.wireout][1] = Wire[gate.wirein[0]][0];
      } else {
        throw new Error('Unsupported gate type \''+gate.type+'\'');
      }
    }

    console.log('Wire', Wire);

    // Give the evaluator the first half of the input labels
    for (i = 0; i < circuit.input.length/2; i++) {
      j = circuit.input[i];
      console.log('give Wire'+j, i, circuit.input, inputs[j], Wire[j][1], Wire[j][0], inputs[j] ? Wire[j][1] : Wire[j][0]);
      socket.give('Wire'+j, inputs[j] ? Wire[j][1] : Wire[j][0]);
    }

    // Use oblivious transfer for the second half of the input labels
    for (i = circuit.input.length/2; i < circuit.input.length; i++) {
      j = circuit.input[i];
      console.log('transfer for Wire'+j);
      OT.send(Wire[j][0], Wire[j][1]);
    }

    // Garble all gates
    var gates = [];
    (function garble_at(start) {
      (new Promise(function (resolve) {
        for (var i = start; i < start+parallel && i < circuit.gates; i++) {
          const gate = circuit.gate[i];
          gates[i] = garble_gate(gate.type, gate.wirein, gate.wireout);
        }
        resolve(gates);
      })).then(function (gates) {  //garbled_gate) { gates[i] = garbled_gate;
        start += parallel; if (start < circuit.gates) {
          setTimeout(function () {
            garble_at(start);
          }, throttle);
        } else {
          // Give the garbled gates to evaluator
          socket.give('gates', JSON.stringify(gates));
        }
        $('#results').text(window.logtext + '\n\n' + start + '/' + circuit.gates);
      });
    })(0);

    // Get output labels and decode them back to their original values
    socket.get('evaluation').then(function (evaluation) {
      var results = [];
      for (var i = 0; i < circuit.output.length; i++) {
        var label = evaluation[circuit.output[i]];  // wire output label
        var states = Wire[circuit.output[i]].map(Label.prototype.stringify);  // true and false labels
        var value = states.map(function (e) {
          return e.substring(0, e.length-3)
        }).indexOf(label.substring(0, label.length-3));  // find which state the label represents
        results.push(value);
      }
      socket.give('results', results);
      console.log('results', results);

      results = results.join('');
      if ($('#base').val() === 'hex') {
        results = hexutils.bin2hex(results);
      }

      $('#results').text('Results: ' + results);
    });
  }

  if (role === 'evaluator') {
    // User input
    const inputs = (new Array(1+party_input.length)).concat(party_input);
    console.log('input states', inputs);

    var messages = [];

    // Promise to the garbled gates
    messages.push(socket.get('gates'));

    // Promises to each of the garbler's input labels
    for (i = 0; i < circuit.input.length/2; i++) {
      console.log('listen for Wire'+circuit.input[i]);
      messages.push(socket.get('Wire'+circuit.input[i]));
    }

    // Promises to each of the evaluator's input labels
    for (i = circuit.input.length/2; i < circuit.input.length; i++) {
      console.log('obliviousT ask for wire', circuit.input[i], 'with value', inputs[circuit.input[i]]);
      messages.push(OT.receive(inputs[circuit.input[i]]));
    }

    Promise.all(messages).then(function (msg) {
      console.log('msg', msg);
      const gates = JSON.parse(msg[0]);

      for (i = 0; i < circuit.input.length; i++) {
        j = circuit.input[i];
        Wire[j] = Label(msg[j]);
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
            setTimeout(function () {
              evaluate_at(start)
            }, throttle);
          } else {
            console.log('start end', start);
            // Collect all output wires' labels
            // and send them back to the garbler for decoding
            var evaluation = {};
            for (i = 0; i < circuit.output.length; i++) {
              j = circuit.output[i];
              console.log('j', j, Wire[j]);
              evaluation[j] = Wire[j].stringify();
            }
            socket.give('evaluation', evaluation);

            // Receive decoded output states
            socket.get('results').then(function (results) {
              results = results.join('');
              if ($('#base').val() === 'hex') {
                results = hexutils.bin2hex(results);
              }

              $('#results').text('Results: ' + results);
              console.log(results);
            });
          }
          $('#results').text(window.logtext + '\n\n' + start + '/' + circuit.gates);
        });
      })(0);
    });
  }
}

module.exports = {
  begin: begin
};