/**
 * Garbler for garbled circuit protocol.
 * @module src/garbler
 */

const Label = require('./lib/label.js');
const gate = require('./gate.js');
const circuit = require('./circuit.js');
const garble = require('./garble.js');
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
 * Create a new garbler party for the circuit at the given URL with the given input.
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
function Garbler(circuitURL, input, callback, progress, parallel, throttle, port, debug) {
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
    console.log.apply(console, ['Garbler', ...arguments]);
  } : new Function();

  if (this.parallel === 0) {
    this.parallel = Number.MAX_VALUE;
  }
}

/**
 * Run the garbler on the circuit.
 */
Garbler.prototype.start = function () {
  this.socket.join('garbler');
  this.socket.hear('go').then(this.load_circuit.bind(this));
};

/**
 * Parse and load the circuit, then initialize the garbler.
 */
Garbler.prototype.load_circuit = function () {
  const that = this;
  var promise = circuit.circuit_load_bristol(this.circuitURL, this.socket.port);
  promise.then(function (circuit) {
    that.log(this.circuitURL, circuit);
    that.init(circuit);
  });
};

/**
 * Initialize the garbler.
 */
Garbler.prototype.init = function (circuit) {
  // User input.
  const inputs = (new Array(1)).concat(this.input).concat(new Array(this.input.length));
  this.log('input states', inputs);

  // Generate labels and save them in labeled wire data structure.
  var wiresToLabels = garble.generateWiresToLabels(circuit);
  var garbledGates = Array(circuit.gates);
  this.log('Wire', wiresToLabels);

  // Give the evaluator the first half of the input labels.
  for (var i = 0; i < circuit.input.length/2; i++) {
    var j = circuit.input[i]; // Index of ith input gate.
    this.log('give Wire' + j, i, circuit.input, inputs[j], wiresToLabels[j][1], wiresToLabels[j][0], inputs[j] ? wiresToLabels[j][1] : wiresToLabels[j][0]);
    this.socket.give('Wire'+j, wiresToLabels[j][(inputs[j] == 0) ? 0 : 1]);
  }

  // Use oblivious transfer for the second half of the input labels.
  for (var i = circuit.input.length/2; i < circuit.input.length; i++) {
    var j = circuit.input[i];
    this.log('transfer for Wire' + j);
    this.OT.send(wiresToLabels[j][0], wiresToLabels[j][1]);
  }

  this.garble(circuit, garbledGates, wiresToLabels, 0);
};

/**
 * Garble all the gates (with optional throttling).
 * @param {number} start - The gate index at which to begin/continue garbling.
 */
Garbler.prototype.garble = function (circuit, garbledGates, wiresToLabels, start) {
  // Garble all gates.
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    garbledGates[i] = garble.garbleGate(circuit.gate[i], wiresToLabels);
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) {
    this.finish(circuit, garbledGates, wiresToLabels);
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.garble.bind(this, circuit, garbledGates, wiresToLabels, start), this.throttle);
  } else {
    this.garble(circuit, garbledGates, wiresToLabels, start);
  }
};

/**
 * Give garbled gates to evaluator, decode output, and run callback on results.
 */
Garbler.prototype.finish = function (circuit, garbledGates, wiresToLabels) {
  const that = this;

  // Give the garbled gates to evaluator.
  this.socket.give('gates', JSON.stringify(garbledGates));

  // Get output labels and decode them back to their original values.
  this.socket.get('evaluation').then(function (evaluation) {
    var results = [];
    for (var i = 0; i < circuit.output.length; i++) {
      var label = evaluation[circuit.output[i]]; // Wire output label.
      var states = wiresToLabels[circuit.output[i]].map(Label.prototype.stringify); // True and false labels.
      var value = states.map(function (e) {
        return e.substring(0, e.length-3)
      }).indexOf(label.substring(0, label.length-3)); // Find which state the label represents.
      results.push(value);
    }

    this.socket.give('results', results);
    that.log('results', results);

    results = results.join('');
    that.callback(results);
  }.bind(this));
};

module.exports = Garbler;
