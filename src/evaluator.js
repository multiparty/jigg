/**
 * Evaluator for garbled circuit protocol.
 * @module evaluator
 */

const socket = require('./lib/socket.js');
const Label = require('./lib/label.js');
const parser = require('./lib/parser.js');
const OT = require('./lib/ot.js');
const crypto = require('./utils/crypto.js');

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
  this.circuit = undefined;
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
 * Decrypt a single garbled gate; the resulting label is stored automatically and also returned.
 * @param {Object[]} gate - The array of all gates
 * @param {string} type - The gate operation
 * @param {number[]} wirein - The array of indices of the input wires
 * @param {number} wireout - The index of the output wire
 * @param {Object[]} Wire - The labeled wire data structure
 */
Evaluator.prototype.evaluate_gate = function (gate, type, wirein, wireout, Wire) {
  if (this.log !== undefined && this.log != null) 
    this.log('evaluate_gate', gate, wirein, wireout);

  if (Wire == null && this !== undefined && this != null)
    Wire = this.Wire;

  const i = wirein[0];
  const j = (wirein.length === 2) ? wirein[1] : i;
  const k = (wireout != null) ? wireout : 0; // If null, just return decrypted.
  const l = 2 * Wire[i].pointer() + Wire[j].pointer();

  if (type === 'xor') {
    Wire[k] = Wire[i].xor(Wire[j]);
  } else if (type === 'not') {
    Wire[k] = Wire[i];  // Already inverted.
  } else if (type === 'and') {
    Wire[k] = crypto.decrypt(Wire[i], Wire[j], k, Label(gate[l]));
  }
};

/**
 * Evaluate all the gates (stateless version).
 * @param {Object} circuit - The circuit in which to garble the gates.
 * @param {Object[]} Wire - The labeled wire data structure.
 * @param {Object[]} ggates - The garbled gates.
 * @returns {Object[]} The labeled wire data structure.
 */
Evaluator.prototype.evaluate_gates = function (circuit, Wire, ggates) {
  for (var i = 0; i < circuit.gates; i++) {
    const gate = circuit.gate[i];
    this.evaluate_gate(ggates[i], gate.type, gate.wirein, gate.wireout, Wire);
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

  var promise = parser.circuit_load_bristol(this.circuitURL, this.socket.port);
  promise.then(function (circuit) {
    that.circuit = circuit;
    that.Wire = that.initialize_labels(circuit);
    that.init();
  });
};

/**
 * Initialize the evaluator.
 */
Evaluator.prototype.init = function () {
  const that = this;

  // Total input.
  const input = (new Array(1 + this.input.length)).concat(this.input);

  // All required message promises to evaluate.
  var messages = [this.socket.get('gates')];  // Promise to the garbled gates.

  // Promises to each of the garbler's input labels.
  for (var i = 0; i < this.circuit.input.length / 2; i++) {
    this.log('listen for Wire', this.circuit.input[i]);
    messages.push(this.socket.get('Wire' + this.circuit.input[i]));
  }

  // Promises to each of the evaluator's input labels.
  for (i = this.circuit.input.length / 2; i < this.circuit.input.length; i++) {
    this.log('obliviousT ask for wire', this.circuit.input[i], 'with value', input[this.circuit.input[i]]);
    messages.push(this.OT.receive(input[this.circuit.input[i]]));
  }

  // Wait until all messages are received.
  Promise.all(messages).then(function (msg) {
    that.log('msg', msg);

    that.gates = JSON.parse(msg[0]);
    for (i = 0; i < that.circuit.input.length; i++) {
      var j = that.circuit.input[i];
      that.Wire[j] = Label(msg[j]);
      that.log('Wire', j, that.Wire);
    }

    that.evaluate(0);
  });
};

/**
 * Evaluate all the gates (with optional throttling).
 * @param {number} start - The gate index at which to begin/continue evaluating.
 */
Evaluator.prototype.evaluate = function (start) {
  for (var i = start; i < start + this.parallel && i < this.circuit.gates; i++) {
    const gate = this.circuit.gate[i];
    this.evaluate_gate(this.gates[i], gate.type, gate.wirein, gate.wireout);
  }

  start += this.parallel;
  this.progress(Math.min(start, this.circuit.gates), this.circuit.gates);

  if (start >= this.circuit.gates) { // done
    this.finish();
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.evaluate.bind(this, start), this.throttle);
  } else {
    this.evaluate(start);
  }
};

/**
 * Give wires back to garbler, receive decoded output states, and run callback on results.
 */
Evaluator.prototype.finish = function () {
  const that = this;

  // Collect all output wires' labels and send
  // them back to the garbler for decoding.
  var evaluation = {};
  for (var i = 0; i < this.circuit.output.length; i++) {
    var j = this.circuit.output[i];
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
