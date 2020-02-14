const JIGG = require('../src/jigg.js');
const fs = require('fs');

// Handle command line arguments.
const port = process.argv[2];
const role = process.argv[3];
let input = process.argv[4];
let encoding = process.argv[5];
let circuitName = process.argv[6];
const debug = process.argv[7] !== 'false';

// default arguments.
if (encoding == null) {
  encoding = 'number';
}
if (circuitName == null) {
  circuitName = 'arith-add-32-bit-old.txt';
}

// encoding
if (encoding === 'number') {
  input = parseInt(input);
}
if (encoding === 'bits') {
  input = input.split('').map(Number);
}

// Read circuit
const circuitPath = __dirname + '/../circuits/bristol/' + circuitName;
const circuit = fs.readFileSync(circuitPath, 'utf8');

// Application code.
const agent = new JIGG.Client(role, 'http://localhost:' + port, {debug: debug});
agent.loadCircuit(circuit);
agent.setInput(input, encoding);

agent.addProgressListener(function (status) {
  if (status === 'connected') {
    console.time('time');
  }
});

agent.getOutput(encoding).then(function (output) {
  if (debug) {
    console.timeEnd('time');
  }

  console.log(output);
  agent.disconnect();
});

agent.start();