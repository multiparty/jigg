/**
 * Garbler for garbled circuit protocol.
 * @module src/garbler
 */

'use strict';

const bits = require('./data/bits');
const gate = require('./data/gate');
const circuit = require('./data/circuit');
const label = require('./data/label');
const wireToLabelsMap = require('./data/wireToLabelsMap');
const garble = require('./garble');
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
 * Create a new garbler party for the circuit at the given URL with the given input.
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
function Garbler(circuitURL, input, callback, progress, parallel, throttle, port, debug) {
  this.circuitURL = circuitURL;
  this.input = input.bits;
  this.callback = callback;
  this.parallel = parallel == null ? 30 : parallel;
  this.throttle = throttle == null ? 1 : throttle;
  this.progress = progress == null ? function () {} : progress;
  this.channel = new channel.Channel(port);
  this.debug = debug;
  this.log = this.debug ? function () {
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
  this.channel.socket.join('garbler');
  this.channel.socket.hear('go').then(this.load_circuit.bind(this));
};

/**
 * Parse and load the circuit, then initialize the garbler.
 */
Garbler.prototype.load_circuit = function () {
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
 * Initialize the garbler.
 * @param {Object} circuit - Circuit in which to garble the gates
 */
Garbler.prototype.init = function (circuit) {
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
Garbler.prototype.garbleGatesThrottled = function (circuit, wireToLabels, garbledGates, start) {
  // Garble all gates.
  for (var i = start; i < start + this.parallel && i < circuit.gates; i++) {
    garbledGates.insert(i, garble.garbleGate(circuit.gate[i], wireToLabels));
  }

  start += this.parallel;
  this.progress(Math.min(start, circuit.gates), circuit.gates);

  if (start >= circuit.gates) {
    this.finish(circuit, garbledGates, wireToLabels);
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
Garbler.prototype.finish = function (circuit, garbledGates, wireToLabels) {
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

module.exports = Garbler;
