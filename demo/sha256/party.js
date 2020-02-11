const JIGG = require('../../src/jigg.js');
const fs = require('fs');

// Handle command line arguments.
const role = process.argv[2];
const input = process.argv[3];
const debug = process.argv[4] !== 'false';

const circuitPath = __dirname + '/../../circuits/bristol/sha-256.txt';
const circuit = fs.readFileSync(circuitPath, 'utf8');

// Application code.
console.time('time');

const agent = new JIGG.Client(role, 'http://localhost:3000', {debug: debug});
agent.loadCircuit(circuit);
agent.setInput(agent.hexutils.hex2bin(input).split('').map(Number));
agent.start();

agent.getOutput().then(function (output) {
  if (debug) {
    console.timeEnd('time');
  }

  console.log(agent.hexutils.bin2hex(output.join('')));
  agent.disconnect();
});
