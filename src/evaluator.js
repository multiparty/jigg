/**
 * Evaluator for garbled circuit protocol.
 * @module src/evaluator
 */

'use strict';

const bits = require('./data/bits');
const gate = require('./data/gate');
const circuit = require('./data/circuit');
const label = require('./data/label');
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
 * Create a new evaluator party for the circuit at the given URL with the given input.
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
function Evaluator(circuitURL, input, callback, progress, parallel, throttle, port, debug) {
  this.circuitURL = circuitURL;
  this.input = input.bits;
  this.callback = callback;
  this.parallel = parallel == null ? 30 : parallel;
  this.throttle = throttle == null ? 1 : throttle;
  this.progress = progress == null ? function () {} : progress;
  this.channel = new channel.Channel(port);
  this.debug = debug;
  this.log = this.debug ? function () {
    console.log.apply(console, ['Evaluator', ...arguments]);
  } : new Function();

  if (this.parallel === 0) {
    this.parallel = Number.MAX_VALUE;
  }
}

/**
 * Run the evaluator on the circuit.
 */
Evaluator.prototype.start = function () {
  this.channel.socket.join('evaluator');
  this.channel.socket.hear('go').then(this.load_circuit.bind(this));
};

/**
 * Parse and load the circuit, then initialize the evaluator.
 */
Evaluator.prototype.load_circuit = function () {
  const that = this;
  var promise = new Promise(function (resolve) {
    socket.geturl(that.circuitURL, 'text', that.channel.socket.port).then(function (txt) {
      resolve(circuit.Circuit.prototype.fromBristolFashion(txt));
    });
  });
  promise.then(function (circuit) {
    that.init(circuit);
  });
};

/**
 * Initialize the evaluator.
 * @param {Object} circuit - Original circuit
 */
Evaluator.prototype.init = function (circuit) {
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
Evaluator.prototype.evaluateGatesThrottled = function (circuit, garbledGates, wireToLabels, start) {
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    evaluate.evaluateGate(circuit.gate[i], garbledGates.get(i), wireToLabels);
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) {
    this.finish(circuit, wireToLabels);
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
Evaluator.prototype.finish = function (circuit, wireToLabels) {
  const that = this;

  // Collect all output wires' labels; send them back to garbler for decoding.
  var outputWireToLabels = wireToLabels.copyWithOnlyIndices(circuit.output);
  this.channel.sendDirect('outputWireToLabels', JSON.stringify(outputWireToLabels.toJSON()));

  // Receive decoded output states.
  this.channel.receiveDirect('output').then(function (output) {
    that.callback(new bits.Bits(output));
  }.bind(this));
};

module.exports = Evaluator;
