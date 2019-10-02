const socket = require('./lib/socket.js');
const Label = require('./lib/label.js');
const parser = require('./lib/parser.js');
const OT = require('./lib/ot.js');
const crypto = require('./utils/crypto.js');

/**
 * Create a new evaluator party for the circuit at the given url with the given input
 * @param {string} circuitURL - circuit URL relative to server path
 * @param {Array<number>}input - the party's input as an array of bits
 * @constructor
 */
function Evaluator(circuitURL, input, callback, progress, parallel, throttle) {
  this.Wire = [null];
  this.circuitURL = circuitURL;
  this.input = input;
  this.callback = callback;
  this.parallel = parallel == null ? 30 : parallel;
  this.throttle = throttle == null ? 1 : throttle;
  this.progress = progress == null ? function () {} : progress;

  if (this.parallel === 0) {
    this.parallel = Number.MAX_VALUE;
  }
}

Evaluator.prototype.start = function () {
  socket.join('evaluator');
  socket.hear('go').then(this.load_circuit.bind(this));
};

Evaluator.prototype.load_circuit = function () {
  const that = this;

  var promise = parser.circuit_load_bristol(this.circuitURL);
  promise.then(function (circuit) {
    that.circuit = circuit;
    for (var i = 1; i <= circuit.wires; i++) {
      that.Wire.push([]);
    }

    that.init();
  });
};

Evaluator.prototype.log = function () {
  // console.log.apply(console, arguments);
};

Evaluator.prototype.init = function () {
  const that = this;

  // Total input
  const input = (new Array(1 + this.input.length)).concat(this.input);

  // All required message promises to evaluate
  var messages = [socket.get('gates')];  // Promise to the garbled gates

  // Promises to each of the garbler's input labels
  for (var i = 0; i < this.circuit.input.length / 2; i++) {
    this.log('listen for Wire', this.circuit.input[i]);
    messages.push(socket.get('Wire' + this.circuit.input[i]));
  }

  // Promises to each of the evaluator's input labels
  for (i = this.circuit.input.length / 2; i < this.circuit.input.length; i++) {
    this.log('obliviousT ask for wire', this.circuit.input[i], 'with value', input[this.circuit.input[i]]);
    messages.push(OT.receive(input[this.circuit.input[i]]));
  }

  // Wait until all messages are received
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

Evaluator.prototype.finish = function () {
  const that = this;

  // Collect all output wires' labels
  // and send them back to the garbler for decoding
  var evaluation = {};
  for (var i = 0; i < this.circuit.output.length; i++) {
    var j = this.circuit.output[i];
    evaluation[j] = this.Wire[j].stringify();
    this.log('j', j, this.Wire[j]);
  }
  socket.give('evaluation', evaluation);

  // Receive decoded output states
  socket.get('results').then(function (results) {
    that.callback(results.join(''));
  });
};

/*
 *  Decrypt a single garbled gate
 *  The resultant label is stored automatically and also returned
 */
Evaluator.prototype.evaluate_gate = function (gate, type, wirein, wireout) {
  this.log('evaluate_gate', gate, wirein, wireout);

  const i = wirein[0];
  const j = (wirein.length === 2) ? wirein[1] : i;
  const k = (wireout != null) ? wireout : 0;  // if null, just return decrypted
  const l = 2 * this.Wire[i].pointer() + this.Wire[j].pointer();

  if (type === 'xor') {
    this.Wire[k] = this.Wire[i].xor(this.Wire[j]);
  } else if (type === 'not') {
    this.Wire[k] = this.Wire[i];  // already inverted
  } else if (type === 'and') {
    this.Wire[k] = crypto.decrypt(this.Wire[i], this.Wire[j], k, Label(gate[l]));
  }
};

module.exports = Evaluator;
