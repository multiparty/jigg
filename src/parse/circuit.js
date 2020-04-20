'use strict';

const Circuit = require('../modules/circuit.js');
const Gate = require('../modules/gate.js');
const Label = require('../modules/label.js');

const circuitParser = function (text) {
  const metaEnd = text.indexOf(']');
  const meta = JSON.parse(text.substring(0, metaEnd + 1));

  const circuit = new Circuit(meta[0], meta[1], meta[2], meta[3], meta[4]);
  let gatesCount = meta[5];

  let i = metaEnd + 1;
  // parse one gate at a time
  while (i < text.length) {
    let operation, inputWires, outputWire, gateId, truthTable;

    // parse operation
    operation = text.charAt(i);
    if (operation === '&') {
      operation = 'AND';
    } else if (operation === '^') {
      operation = 'XOR';
    } else if (operation === '!') {
      operation = 'NOT';
    } else if (operation === '|') {
      operation = 'LOR';
    }

    // parse gate Id
    i++;
    gateId = '';
    while (text.charAt(i) !== '[') {
      gateId += text.charAt(i);
      i++;
    }
    gateId = parseInt(gateId);

    // parse input wires
    inputWires = '';
    while (text.charAt(i) !== ']') {
      inputWires += text.charAt(i);
      i++;
    }
    inputWires = JSON.parse(inputWires + ']');

    // parse output wires
    i++;
    outputWire = '';
    while (text.charAt(i) !== '-' && text.charAt(i) !== '&' &&
           text.charAt(i) !== '^' && text.charAt(i) !== '!' && i < text.length) {
      outputWire += text.charAt(i);
      i++;
    }
    outputWire = parseInt(outputWire);

    // parse truth table if exists
    if (operation === 'AND' || operation === 'LOR') {
      i++;
      truthTable = [];
      // parse one label at a time
      for (let k = 0; k < 4; k++) {
        truthTable[k] = new Uint8Array(circuit.labelSize);
        for (let l = 0; l < circuit.labelSize; l++) {
          truthTable[k][l] = text.charCodeAt(i);
          i++;
        }
        truthTable[k] = new Label(truthTable[k]);
      }
    }

    // build gate and put it in circuit
    circuit.gates.push(new Gate(gateId, operation, inputWires, outputWire, truthTable));
    gatesCount--;
  }

  if (gatesCount !== 0) {
    console.log('problem parsing circuit!');
    throw new Error('problem parsing circuit!');
  }

  return circuit;
};

module.exports = circuitParser;
