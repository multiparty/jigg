/**
 * Main module: garbled circuit protocol agents.
 * @module src/jigg
 */

'use strict';

const bits = require('./data/bits');
const gate = require('./data/gate');
const circuit = require('./data/circuit');
const label = require('./data/label');
const wireToLabelsMap = require('./data/wireToLabelsMap');
const garble = require('./garble');
const evaluate = require('./evaluate');
const channel = require('./comm/channel');
const socket = require('./comm/socket');
const OT = require('./comm/ot');

/**
 * This callback handles the result bit string.
 *
 * @callback resultCallback
 * @param {string} result - The result bit string to process.
 */

/**
 * This callback logs or displays progress.
 *
 * @callback progressCallback
 * @param {number} current - The progress so far (i.e., numerator).
 * @param {number} total - The target total (i.e., the denominator).
 */

/**
 * Create a new agent for the circuit at the given URL with the given input.
 * @param {string} role - Agent role ('Garbler' or 'Evaluator')
 * @param {string} circuitURL - Circuit URL relative to server path
 * @param {number[]} input - The party's input as an array of bits
 * @param {resultCallback} callback - The function to apply to the result bit string
 * @param {progressCallback} callback - The function to log or display progress
 * @param {number} parallel - Parallelization parameter
 * @param {number} throttle - Throttling parameter
 * @param {number} port - Port to use for communications
 * @param {boolean} debug - Debugging mode flag
 * @constructor
 */
function Agent(role, circuitURL, input, callback, progress, parallel, throttle, port, debug) {
  this.role = role;
  this.circuitURL = circuitURL;
  this.input = input.bits;
  this.callback = callback;
  this.parallel = parallel == null ? 30 : parallel;
  this.throttle = throttle == null ? 1 : throttle;
  this.progress = progress == null ? function () {} : progress;
  this.channel = new channel.Channel(port);
  this.debug = debug;
  this.log = this.debug ? function () {
    console.log.apply(console, [this.role, ...arguments]);
  } : new Function();

  if (this.parallel === 0) {
    this.parallel = Number.MAX_VALUE;
  }
}

/**
 * Run the agent on the circuit.
 */
Agent.prototype.start = function () {
  this.channel.socket.join(this.role);
  this.channel.socket.hear('go').then(this.load_circuit.bind(this));
};

/**
 * Parse and load the circuit, then initialize the agent.
 */
Agent.prototype.load_circuit = function () {
  const that = this;
  var promise = new Promise(function (resolve) {
    socket.geturl(that.circuitURL, 'text', that.channel.socket.port).then(function (txt) {
      resolve(circuit.Circuit.prototype.fromBristolFashion(txt));
    });
  });
  promise.then(function (circuit) {
    if (that.role == 'Garbler')
      that.initGarbler(circuit);
    else if (that.role == 'Evaluator')
      that.initEvaluator(circuit);
  });
};

/**
 * Initialize the garbler.
 * @param {Object} circuit - Circuit in which to garble the gates
 */
Agent.prototype.initGarbler = function (circuit) {
  var wireToLabels = garble.generateWireToLabelsMap(circuit);
  garble.sendInputWireToLabelsMap(this.channel, circuit, wireToLabels, this.input);
  var garbledGates = new gate.GarbledGates();
  garbledGates.allocate(circuit.gates);
  this.garbleGatesThrottled(circuit, wireToLabels, garbledGates, 0);
};

/**
 * Garble all the gates (with throttling).
 * @param {Object} circuit - Circuit in which to garble the gates
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @param {number} start - Gate index at which to begin/continue garbling
 */
Agent.prototype.garbleGatesThrottled = function (circuit, wireToLabels, garbledGates, start) {
  // Garble all gates.
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    garbledGates.insert(i, garble.garbleGate(circuit.gate[i], wireToLabels));
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) {
    this.finishGarbler(circuit, garbledGates, wireToLabels);
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.garbleGatesThrottled.bind(this, circuit, wireToLabels, garbledGates, start), this.throttle);
  } else {
    this.garbleGatesThrottled(circuit, wireToLabels, garbledGates, start);
  }
};

/**
 * Give garbled gates to evaluator, decode output, and run callback on results.
 * @param {Object} circuit - Circuit in which to garble the gates
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 */
Agent.prototype.finishGarbler = function (circuit, garbledGates, wireToLabels) {
  const that = this;

  // Give the garbled gates to evaluator.
  this.channel.sendDirect('garbledGates', JSON.stringify(garbledGates.toJSON()));

  // Get output labels and decode them back to their original values.
  this.channel.receiveDirect('outputWireToLabels').then(function (outputWireToLabels) {
    var outputWireToLabels_G =
      wireToLabelsMap.WireToLabelsMap.prototype.fromJSON(
        JSON.parse(outputWireToLabels)
      );
    var output = garble.outputLabelsToBits(circuit, wireToLabels, outputWireToLabels_G);
    this.channel.sendDirect('output', output);
    that.callback(new bits.Bits(output));
  }.bind(this));
};

/**
 * Initialize the evaluator.
 * @param {Object} circuit - Original circuit
 */
Agent.prototype.initEvaluator = function (circuit) {
  const that = this;
  var messages = evaluate.receiveMessages(this.channel, circuit, this.input);
  Promise.all(messages).then(function (messages) {
    var [garbledGates, wireToLabels] = evaluate.processMessages(circuit, messages);
    that.evaluateGatesThrottled(circuit, garbledGates, wireToLabels, 0);
  });
};

/**
 * Evaluate all the garbled gates (with optional throttling).
 * @param {Object} circuit - Original circuit
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 * @param {number} start - Gate index at which to begin/continue evaluating
 */
Agent.prototype.evaluateGatesThrottled = function (circuit, garbledGates, wireToLabels, start) {
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    evaluate.evaluateGate(circuit.gate[i], garbledGates.get(i), wireToLabels);
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) {
    this.finishEvaluator(circuit, wireToLabels);
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.evaluateGatesThrottled.bind(this, circuit, garbledGates, wireToLabels, start), this.throttle);
  } else {
    this.evaluateGatesThrottled(circuit, garbledGates, wireToLabels, start);
  }
};

/**
 * Give wires back to garbler, receive decoded output states, and run callback on results.
 * @param {Object} circuit - Original circuit
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 */
Agent.prototype.finishEvaluator = function (circuit, wireToLabels) {
  const that = this;

  // Collect all output wires' labels; send them back to garbler for decoding.
  var outputWireToLabels = wireToLabels.copyWithOnlyIndices(circuit.output);
  this.channel.sendDirect('outputWireToLabels', JSON.stringify(outputWireToLabels.toJSON()));

  // Receive decoded output states.
  this.channel.receiveDirect('output').then(function (output) {
    that.callback(new bits.Bits(output));
  }.bind(this));
};

module.exports = {
  Agent: Agent
};
