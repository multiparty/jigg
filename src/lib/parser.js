'use strict';

const socket = require('./socket.js');

const bytes = 16;
const types = {'AND': 'and', 'XOR': 'xor', 'INV': 'not'};

function circuit_load_bristol(path, port) {
  var circuit = {
    wires: 0, gates: 0,
    input: [], output: [],
    gate: []
  };

  return new Promise(function (resolve) {
    socket.geturl(path, 'text', port).then(function (text) {
      const bristol = text.split('\n').map(function (line) {
        return line.split(' ');
      });

      circuit.gates = +bristol[0][0];
      circuit.wires = +bristol[0][1];

      if (bristol[1][0] != 2) {
        // Asymmetric inputs!!
      }

      for (var i = 1; i <= bristol[1][0] * bristol[1][1]; i++) {
        circuit.input.push(i);
      }

      for (i = 1+circuit.wires-(bristol[2][0]*bristol[2][1]); i <= circuit.wires; i++) {
        circuit.output.push(i);
      }

      for (i = 0; i < circuit.gates; i++) {
        var args = bristol[i+3];

        var gate = {};
        gate.wirein = [1+(+args[2])];
        if (parseInt(args[0]) === 2) {
          gate.wirein.push(1+(+args[3]));
        }
        gate.wireout = 1+(+args[2+(+args[0])]);
        gate.type = types[args[3+(+args[0])]];

        circuit.gate.push(gate);
      }

      resolve(circuit);
    });
  });
}

module.exports = {
  circuit_load_bristol: circuit_load_bristol
};
