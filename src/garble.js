'use strict';

const sodium = require('libsodium-wrappers-sumo');

const Label = require('./modules/label.js');
const Circuit = require('./modules/circuit.js');
const Gate = require('./modules/gate.js');
const labelParser = require('./parse/label.js');
const crypto = require('./util/crypto.js');

const generateInputLabels = function (R, count, labelSize) {
  const garbledAssignment = [];
  for (let i = 0; i < count; i++) {
    const label = new Label(sodium.randombytes_buf(labelSize));
    garbledAssignment[i] = [label, label.xor(R)];
  }

  return garbledAssignment;
};

const garbleAnd = function (agent, gate, R, garbledAssignment) {
  const in1 = gate.inputWires[0];
  const in2 = gate.inputWires[1];
  const out = gate.outputWire;

  const randomLabel = new Label(sodium.randombytes_buf(agent.labelSize));
  garbledAssignment[out] = [randomLabel, randomLabel.xor(R)];

  let values = [
    crypto.encrypt(garbledAssignment[in1][0], garbledAssignment[in2][0], gate.id, garbledAssignment[out][0]),
    crypto.encrypt(garbledAssignment[in1][0], garbledAssignment[in2][1], gate.id, garbledAssignment[out][0]),
    crypto.encrypt(garbledAssignment[in1][1], garbledAssignment[in2][0], gate.id, garbledAssignment[out][0]),
    crypto.encrypt(garbledAssignment[in1][1], garbledAssignment[in2][1], gate.id, garbledAssignment[out][1])
  ];

  let points = [
    2 * garbledAssignment[in1][0].getPoint() + garbledAssignment[in2][0].getPoint(),
    2 * garbledAssignment[in1][0].getPoint() + garbledAssignment[in2][1].getPoint(),
    2 * garbledAssignment[in1][1].getPoint() + garbledAssignment[in2][0].getPoint(),
    2 * garbledAssignment[in1][1].getPoint() + garbledAssignment[in2][1].getPoint()
  ];

  let truthTable = [];
  truthTable[points[0]] = values[0];
  truthTable[points[1]] = values[1];
  truthTable[points[2]] = values[2];
  truthTable[points[3]] = values[3];

  return new Gate(gate.id, 'AND', gate.inputWires, gate.outputWire, truthTable);
};

const garbleXor = function (agent, gate, R, garbledAssignment) {
  const in1 = gate.inputWires[0];
  const in2 = gate.inputWires[1];
  const out = gate.outputWire;

  garbledAssignment[out] = [
    garbledAssignment[in1][0].xor(garbledAssignment[in2][0]),
    garbledAssignment[in1][1].xor(garbledAssignment[in2][1]).xor(R),
  ];

  return gate;
};

const garbleNot = function (agent, gate, R, garbledAssignment) {
  const in1 = gate.inputWires[0];
  const out = gate.outputWire;

  garbledAssignment[out] = [garbledAssignment[in1][1], garbledAssignment[in1][0]];

  return gate;
};

const sendInputLabels = function (agent, garbledAssignment) {
  const circuit = agent.circuit;
  const garblerInputSize = circuit.garblerInputSize;
  const evaluatorInputSize = circuit.evaluatorInputSize;

  // send garbler input labels
  for (let i = 0; i < garblerInputSize; i++) {
    const label = garbledAssignment[i][agent.input[i]];
    agent.socket.send('wire'+i, label.serialize());
  }

  // Send the evaluator the first half of the input labels directly.
  for (let i = 0; i < evaluatorInputSize; i++) {
    const index = i + garblerInputSize;
    agent.OT.send('wire'+index, garbledAssignment[index][0], garbledAssignment[index][1]);
  }
};

const degarbleOutput = function (agent, garbledAssignment, outputLabels) {
  const bits = [];
  for (let i = 0; i < agent.circuit.outputSize; i++) {
    const bitLabel = outputLabels[i];
    const options = garbledAssignment[agent.circuit.wiresCount - agent.circuit.outputSize + i];
    if (options[0].equals(bitLabel)) {
      bits.push(0);
    } else if (options[1].equals(bitLabel)) {
      bits.push(1);
    } else {
      agent.progress('error', null, null, 'output label unequal to either labels');
      agent.log('Output label ' + i + ' unequal to either labels!');
    }
  }

  return bits;
};

const run = function (agent) {
  agent.progress('garbling', 0, agent.circuit.gates.length);

  const circuit = agent.circuit;
  const garbledCircuit = new Circuit(circuit.wiresCount, circuit.garblerInputSize, circuit.evaluatorInputSize, circuit.outputSize, agent.labelSize);

  // generate random offset
  const R = new Label(sodium.randombytes_buf(agent.labelSize));
  R.setPoint(1);

  // generate labels for input wires
  const garbledAssignment = generateInputLabels(R, circuit.evaluatorInputSize + circuit.garblerInputSize, agent.labelSize);

  // garble gates
  for (let i = 0; i < circuit.gates.length; i++) {
    let gate = circuit.gates[i];

    if (gate.operation === 'AND') {
      gate = garbleAnd(agent, gate, R, garbledAssignment);
    } else if (gate.operation === 'XOR') {
      gate = garbleXor(agent, gate, R, garbledAssignment);
    } else {
      gate = garbleNot(agent, gate, R, garbledAssignment);
    }

    garbledCircuit.gates.push(gate);
  }

  // send circuit
  agent.socket.send('circuit', garbledCircuit.serialize());

  // send garbler inputs and OT for evaluator inputs
  agent.progress('OT');
  sendInputLabels(agent, garbledAssignment);

  // get output and de-garble them
  agent.socket.hear('output').then(function (labels) {
    agent.progress('output');

    labels = labels.map(labelParser);
    const bits = degarbleOutput(agent, garbledAssignment, labels);

    // send output
    agent.socket.send('output', bits);

    // resolve promise
    agent._outputResolve(bits);
  });
};

module.exports = run;