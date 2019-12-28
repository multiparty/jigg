/**
 * Evaluator for garbled circuit protocol.
 * @module src/evaluator
 */

const bits = require('./data/bits.js');
const gate = require('./data/gate.js');
const circuit = require('./data/circuit.js');
const label = require('./data/label.js');
const evaluate = require('./evaluate.js');
const socket = require('./comm/socket.js');
const OT = require('./comm/ot.js');

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
  this.input = input;
  this.callback = callback;
  this.parallel = parallel == null ? 30 : parallel;
  this.throttle = throttle == null ? 1 : throttle;
  this.progress = progress == null ? function () {} : progress;
  this.socket = socket.io(port == null ? 3000 : port);
  this.OT = OT(this.socket);
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
  this.socket.join('evaluator');
  this.socket.hear('go').then(this.load_circuit.bind(this));
};

/**
 * Parse and load the circuit, then initialize the evaluator.
 */
Evaluator.prototype.load_circuit = function () {
  const that = this;
  var promise = new Promise(function (resolve) {
    this.socket.geturl(this.circuitURL, 'text', this.socket.port).then(function (txt) {
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

  // Total input.
  const input = (new Array(1 + this.input.length)).concat(this.input);

  // All required message promises to evaluate.
  var messages = [this.socket.get('garbledGates')]; // Promise to the garbled gates.

  // Promises to each of the garbler's input labels.
  for (var i = 0; i < circuit.input.length / 2; i++) {
    messages.push(this.socket.get('Wire' + circuit.input[i]));
  }

  // Promises to each of the evaluator's input labels.
  for (var i = circuit.input.length / 2; i < circuit.input.length; i++) {
    messages.push(this.OT.receive(input[circuit.input[i]]));
  }

  // Wait until all messages are received.
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

  // Collect all output wires' labels and send
  // them back to the garbler for decoding.
  var outputWireToLabels = wireToLabels.copyWithOnlyIndices(circuit.output);
  this.socket.give('outputWireToLabels', JSON.stringify(outputWireToLabels.toJSON()));

  // Receive decoded output states.
  this.socket.get('output').then(function (output) {
    that.callback(new bits.Bits(output));
  }.bind(this));
};

module.exports = Evaluator;
