/**
 * Evaluator for garbled circuit protocol.
 * @module src/evaluator
 */

const Label = require('./lib/label.js');
const gate = require('./gate.js');
const circuit = require('./circuit.js');
const evaluate = require('./evaluate.js');
const socket = require('./lib/socket.js');
const OT = require('./lib/ot.js');

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
 * @param {Array<number>} input - The party's input as an array of bits
 * @param {resultCallback} callback - The function to apply to the result bit string
 * @param {progressCallback} callback - The function to log or display progress
 * @param {number} parallel - Parallelization parameter
 * @param {number} throttle - Throttling parameter
 * @param {number} port - The port to use for communications
 * @param {boolean} debug - Debugging mode flag
 * @constructor
 */
function Evaluator(circuitURL, input, callback, progress, parallel, throttle, port, debug) {
  this.Wire = undefined;
  this.circuitURL = circuitURL;
  this.input = input;
  this.callback = callback;
  this.parallel = parallel == null ? 30 : parallel;
  this.throttle = throttle == null ? 1 : throttle;
  this.progress = progress == null ? function () {} : progress;
  this.socket = socket.io(port == null ? 3000 : port);
  this.OT = OT(this.socket);
  this.debug = debug;
  this.log = this.debug? function () {
    console.log.apply(console, ['Evaluator', ...arguments]);
  } : new Function();

  if (this.parallel === 0) {
    this.parallel = Number.MAX_VALUE;
  }
}

/**
 * Initialize the data structure for labeled wires.
 * @param {Object} circuit - The circuit for which to generate labels.
 * @returns {Object} The labeled wires.
 */
Evaluator.prototype.initialize_labels = function (circuit) {
  var Wire = [null];
  for (var i = 0; i < circuit.wires; i++) {
    Wire.push([]);
  }
  return Wire;
};

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

  var promise = circuit.circuit_load_bristol(this.circuitURL, this.socket.port);
  promise.then(function (circuit) {
    that.Wire = that.initialize_labels(circuit);
    that.init(circuit);
  });
};

/**
 * Initialize the evaluator.
 */
Evaluator.prototype.init = function (circuit) {
  const that = this;

  // Total input.
  const input = (new Array(1 + this.input.length)).concat(this.input);

  // All required message promises to evaluate.
  var messages = [this.socket.get('gates')]; // Promise to the garbled gates.

  // Promises to each of the garbler's input labels.
  for (var i = 0; i < circuit.input.length / 2; i++) {
    this.log('listen for Wire', circuit.input[i]);
    messages.push(this.socket.get('Wire' + circuit.input[i]));
  }

  // Promises to each of the evaluator's input labels.
  for (var i = circuit.input.length / 2; i < circuit.input.length; i++) {
    this.log('obliviousT ask for wire', circuit.input[i], 'with value', input[circuit.input[i]]);
    messages.push(this.OT.receive(input[circuit.input[i]]));
  }

  // Wait until all messages are received.
  Promise.all(messages).then(function (msg) {
    that.log('msg', msg);

    var garbledGates = JSON.parse(msg[0]);
    for (i = 0; i < circuit.input.length; i++) {
      var j = circuit.input[i];
      that.Wire[j] = Label(msg[j]);
      that.log('Wire', j, that.Wire);
    }

    that.evaluate(circuit, garbledGates, 0);
  });
};

/**
 * Evaluate all the garbled gates (with optional throttling).
 * @param {number} start - The gate index at which to begin/continue evaluating.
 */
Evaluator.prototype.evaluate = function (circuit, garbledGates, start) {
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    const gate = circuit.gate[i];
    this.log('evaluate_gate', garbledGates[i], gate.wirein, gate.wireout);
    evaluate.evaluateGate(garbledGates[i], gate.type, gate.wirein, gate.wireout, this.Wire);
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) { // done
    this.finish(circuit);
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.evaluate.bind(this, circuit, garbledGates, start), this.throttle);
  } else {
    this.evaluate(circuit, garbledGates, start);
  }
};

/**
 * Give wires back to garbler, receive decoded output states, and run callback on results.
 */
Evaluator.prototype.finish = function (circuit) {
  const that = this;

  // Collect all output wires' labels and send
  // them back to the garbler for decoding.
  var evaluation = {};
  for (var i = 0; i < circuit.output.length; i++) {
    var j = circuit.output[i];
    evaluation[j] = this.Wire[j].stringify();
    this.log('j', j, this.Wire[j]);
  }
  this.socket.give('evaluation', evaluation);

  // Receive decoded output states.
  this.socket.get('results').then(function (results) {
    that.callback(results.join(''));
  }.bind(this));
};

module.exports = Evaluator;
