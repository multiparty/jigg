/**
 * Garbler for garbled circuit protocol.
 * @module evaluator
 */

const socket = require('./lib/socket.js');
const Label = require('./lib/label.js');
const parser = require('./lib/parser.js');
const OT = require('./lib/ot.js');
const randomutils = require('./utils/random.js');
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
  this.Wire = undefined;
  this.gates = [];
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
    console.log.apply(console, ['Garbler', ...arguments]);
  } : new Function();

  if (this.parallel === 0) {
    this.parallel = Number.MAX_VALUE;
  }
}

/**
 * Generate labels and encode each state of every wire
 * with a randomly generated label.
 * @param {Object} circuit - The circuit for which to generate labels.
 * @returns {Object} The labeled wires.
 */
Garbler.prototype.generate_labels = function (circuit) {
  var Wire = [null];
  const R = randomutils.random();  // R in {0, 1}^N.

  for (var j = 0; j < circuit.input.length; j++) {
    var i = circuit.input[j];

    var label = randomutils.random();
    Wire[i][0] = label;
    Wire[i][1] = label.xor(R);

    var point = randomutils.random_bit();
    Wire[i][0].pointer(point);
    Wire[i][1].pointer(1-point);
  }

  for (var i = 0; i < circuit.gates; i++) {
    var gate = circuit.gate[i];
    var k;
    if (gate.type === 'xor') {
      var a = Wire[gate.wirein[0]][0];
      var b = Wire[gate.wirein[1]][0];
      k = gate.wireout;

      Wire[k][0] = a.xor(b).point(a.pointer() ^ b.pointer());
      Wire[k][1] = a.xor(b).xor(R).point(a.pointer() ^ b.pointer() ^ 1);
    } else if (gate.type === 'and') {
      k = gate.wireout;

      var key = randomutils.random();
      point = randomutils.random_bit();

      Wire[k][0] = key.point(point);
      Wire[k][1] = key.xor(R).point(point ^ 1);
    } else if (gate.type === 'not') {
      Wire[gate.wireout][0] = Wire[gate.wirein[0]][1];
      Wire[gate.wireout][1] = Wire[gate.wirein[0]][0];
    } else {
      throw new Error('Unsupported gate type \''+gate.type+'\'');
    }
  }

  return Wire;
};

/**
 * Encrypt a single gate; input and output wires must have labels at this point.
 * @param {string} type - The gate operation
 * @param {number[]} wirein - The array of indices of the input wires
 * @param {number} wireout - The index of the output wire
 */
Garbler.prototype.garble_gate = function (type, wirein, wireout) {
  this.log('garble_gate', type, wirein, wireout);

  const i = wirein[0];
  const j = (wirein.length === 2) ? wirein[1] : i;
  const k = wireout;

  if (type === 'xor') {
    return 'xor';  // Free XOR - encrypt nothing.
  } else if (type === 'not') {
    return 'not';
  } else {  // if (type === 'and') {
    var t = [0,0,0,1];
    return [
      [crypto.encrypt(this.Wire[i][0], this.Wire[j][0], k, this.Wire[k][t[0]]).stringify(), (2 * this.Wire[i][0].pointer()) + this.Wire[j][0].pointer()],
      [crypto.encrypt(this.Wire[i][0], this.Wire[j][1], k, this.Wire[k][t[1]]).stringify(), (2 * this.Wire[i][0].pointer()) + this.Wire[j][1].pointer()],
      [crypto.encrypt(this.Wire[i][1], this.Wire[j][0], k, this.Wire[k][t[2]]).stringify(), (2 * this.Wire[i][1].pointer()) + this.Wire[j][0].pointer()],
      [crypto.encrypt(this.Wire[i][1], this.Wire[j][1], k, this.Wire[k][t[3]]).stringify(), (2 * this.Wire[i][1].pointer()) + this.Wire[j][1].pointer()]
    ].sort(function (c1, c2) {  // point-and-permute
      return c1[1] - c2[1];
    }).map(function (c) {
      return c = c[0];
    });
  }
  // Define cases for any other gate types here.
};

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
  var promise = parser.circuit_load_bristol(this.circuitURL, this.socket.port);
  promise.then(function (circuit) {
    that.log(this.circuitURL, circuit);
    that.circuit = circuit;
    for (var i = 1; i <= circuit.wires; i++) {
      that.Wire.push([]);
    }
    that.init();
  });
};

/**
 * Initialize the garbler.
 */
Garbler.prototype.init = function () {
  // User input.
  const inputs = (new Array(1)).concat(this.input).concat(new Array(this.input.length));
  this.log('input states', inputs);

  // Generate labels and save them in this.Wire.
  this.Wire = this.generate_labels(this.circuit);
  this.log('Wire', Wire);

  // Give the evaluator the first half of the input labels.
  for (var i = 0; i < this.circuit.input.length/2; i++) {
    var j = this.circuit.input[i];
    this.log('give Wire' + j, i, this.circuit.input, inputs[j], this.Wire[j][1], this.Wire[j][0], inputs[j] ? this.Wire[j][1] : this.Wire[j][0]);
    this.socket.give('Wire'+j, inputs[j] ? this.Wire[j][1] : this.Wire[j][0]);
  }

  // Use oblivious transfer for the second half of the input labels.
  for (var i = this.circuit.input.length/2; i < this.circuit.input.length; i++) {
    j = this.circuit.input[i];
    this.log('transfer for Wire' + j);
    this.OT.send(this.Wire[j][0], this.Wire[j][1]);
  }

  this.garble(0);
};

/**
 * Garble all the gates (with optional throttling).
 * @param {number} start - The gate index at which to begin/continue garbling.
 */
Garbler.prototype.garble = function (start) {
  // Garble all gates.
  for (var i = start; i < start + this.parallel && i < this.circuit.gates; i++) {
    const gate = this.circuit.gate[i];
    this.gates[i] = this.garble_gate(gate.type, gate.wirein, gate.wireout);
  }

  start += this.parallel;
  this.progress(Math.min(start, this.circuit.gates), this.circuit.gates);

  if (start >= this.circuit.gates) {
    this.finish();
    return;
  }

  if (this.throttle > 0) {
    setTimeout(this.garble.bind(this, start), this.throttle);
  } else {
    this.garble(start);
  }
};

/**
 * Give garbled gates to evaluator, decode output, and run callback on results.
 */
Garbler.prototype.finish = function () {
  const that = this;

  // Give the garbled gates to evaluator.
  this.socket.give('gates', JSON.stringify(this.gates));

  // Get output labels and decode them back to their original values.
  this.socket.get('evaluation').then(function (evaluation) {
    var results = [];
    for (var i = 0; i < that.circuit.output.length; i++) {
      var label = evaluation[that.circuit.output[i]]; // Wire output label.
      var states = that.Wire[that.circuit.output[i]].map(Label.prototype.stringify); // True and false labels.
      var value = states.map(function (e) {
        return e.substring(0, e.length-3)
      }).indexOf(label.substring(0, label.length-3));  // Find which state the label represents.
      results.push(value);
    }

    this.socket.give('results', results);
    that.log('results', results);

    results = results.join('');
    that.callback(results);
  }.bind(this));
};

module.exports = Garbler;
