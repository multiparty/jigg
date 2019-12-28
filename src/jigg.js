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
 * @param {string} result - Result bit string to process
 */

/**
 * This callback logs or displays progress.
 *
 * @callback progressCallback
 * @param {number} current - Progress so far (i.e., numerator)
 * @param {number} total - Target total (i.e., the denominator)
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
      that.runGarbler(circuit);
    else if (that.role == 'Evaluator')
      that.runEvaluator(circuit);
  });
};

/**
 * This callback performs a step in either garbling or evaluation.
 *
 * @callback stepCallback
 * @param {Object} circuit - Original circuit
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 * @param {number} i - Gate index at which to begin/continue
 */
 
/**
 * This callback continues on to the next/final stage in the protocol.
 *
 * @callback finishCallback
 * @param {Object} circuit - Original circuit
 * @param {Object} garbledGates - Ordered collection of garbled gates (unused)
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 */

/**
 * Process all gates (with throttling) using supplied step function.
 * @param {stepCallback} step - Step to perform for this part of protocol
 * @param {finishCallback} finish - Callback to final stage of protocol
 * @param {Object} circuit - Original circuit
 * @param {Object} garbledGates - Ordered collection of garbled gates
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 * @param {number} start - Gate index at which to begin/continue processing
 */
Agent.prototype.gatesThrottled = function (step, finish, circuit, garbledGates, wireToLabels, start) {
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    step(circuit, garbledGates, wireToLabels, i);
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) {
    finish(circuit, garbledGates, wireToLabels);
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.gatesThrottled.bind(this, step, finish, circuit, garbledGates, wireToLabels, start), this.throttle);
  } else {
    this.gatesThrottled(step, finish, circuit, garbledGates, wireToLabels, start);
  }
};

/**
 * Initialize the garbler.
 * @param {Object} circuit - Circuit in which to garble the gates
 */
Agent.prototype.runGarbler = function (circuit) {
  var wireToLabels = garble.generateWireToLabelsMap(circuit);
  garble.sendInputWireToLabelsMap(this.channel, circuit, wireToLabels, this.input);
  var garbledGates = new gate.GarbledGates();
  garbledGates.allocate(circuit.gates);
  this.gatesThrottled( // Garble the gates with throttling to avoid hanging.
    function (circuit, garbledGates, wireToLabels, i) {
      garbledGates.set(i, garble.garbleGate(circuit.gate[i], wireToLabels));
    },
    this.finishGarbler.bind(this), circuit, garbledGates, wireToLabels, 0
  );
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
    that.channel.sendDirect('output', output);
    that.callback(new bits.Bits(output));
  }.bind(this));
};

/**
 * Initialize the evaluator.
 * @param {Object} circuit - Original circuit
 */
Agent.prototype.runEvaluator = function (circuit) {
  const that = this;
  var messages = evaluate.receiveMessages(this.channel, circuit, this.input);
  Promise.all(messages).then(function (messages) {
    var [garbledGates, wireToLabels] = evaluate.processMessages(circuit, messages);
    that.gatesThrottled( // Evaluate the gates with throttling to avoid hanging.
      function (circuit, garbledGates, wireToLabels, i) {
        evaluate.evaluateGate(circuit.gate[i], garbledGates.get(i), wireToLabels);
      },
      that.finishEvaluator.bind(that), circuit, garbledGates, wireToLabels, 0
    );
  });
};

/**
 * Give wires back to garbler, receive decoded output states, and run callback on results.
 * @param {Object} circuit - Original circuit
 * @param {Object} garbledGates - Ordered collection of garbled gates (unused)
 * @param {Object} wireToLabels - Mapping from gate indices to labels
 */
Agent.prototype.finishEvaluator = function (circuit, garbledGates, wireToLabels) {
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
